'use strict';

class Core {
  constructor() {
    this.randomList = [];
  }

  addFieldBox(type, target) {
    if (!this.isEl(target)) {
      console.warn('element target does not exist!');
      return this;
    }

    const field = this.createFieldByType(type);
    const labelAttrConfig = {
      class: 'form-label',
      for: field.id
    };

    if (type === 'content' || type === 'treeselect') {
      delete labelAttrConfig.for;
    }

    const label = this.createEl('label', labelAttrConfig, ['New Field']);
    const fieldBox = this.createEl(
      'div',
      { class: 'field-box col-12', 'data-type': type },
      [label, field]
    );

    target.append(fieldBox);

    if (type === 'treeselect') {
      this.buildTreeselects(fieldBox);
    }

    return fieldBox;
  }

  bindFieldConfigEvent(toolbar = this.toolbar) {
    if (!toolbar?.querySelector('.field-config-box')) {
      console.warn('fieldConfigBox does not exist!');
      return this;
    }

    const typeConfigSelect = toolbar.querySelector(
      '[name="field-type-config"]'
    );
    typeConfigSelect.addEventListener('change', () => {
      this.toggleFieldConfig();

      if (!this.nowFieldBox) {
        return;
      }

      this.replaceNowField();
      this.setFieldToolbarData(this.nowFieldBox);
    });

    const nameConfigInput = toolbar.querySelector('[name="field-name-config"]');
    nameConfigInput.addEventListener('input', () => {
      if (!this.nowFieldBox) {
        return;
      }

      const nowFieldType = this.getFieldType(this.nowFieldBox);
      const newName =
        nameConfigInput.value.trim() || `field-${this.getRandom()}`;

      switch (nowFieldType) {
        case 'radio':
        case 'checkbox':
          const options = this.nowFieldBox.querySelectorAll(
            `input[type="${nowFieldType}"]`
          );

          for (const option of options) {
            option.name = newName;
          }

          break;

        default:
          const field = this.nowFieldBox.querySelector('.field');
          field?.setAttribute('name', newName);
          break;
      }
    });

    const labelConfigInput = toolbar.querySelector(
      '[name="field-label-config"]'
    );
    labelConfigInput.addEventListener('input', () => {
      if (!this.nowFieldBox) {
        return;
      }

      const newLabelName = labelConfigInput.value.trim();
      this.nowFieldBox.querySelector('.form-label').innerHTML = newLabelName;
    });

    const widthConfigInput = toolbar.querySelector(
      '[name="field-width-config"]'
    );
    widthConfigInput.addEventListener('input', () => {
      if (!this.nowFieldBox) {
        return;
      }

      // limit value to 1~12(col-1 ~ col-12)
      const widthValue = +widthConfigInput.value;
      widthConfigInput.value = Math.min(12, Math.max(1, widthValue || 1));

      let classString = this.nowFieldBox.classList.value;
      classString = classString.replace(
        /col-(1[0-2]|[1-9])/g,
        `col-${widthConfigInput.value}`
      );

      this.nowFieldBox.setAttribute('class', classString);
    });

    const valueConfigInput = toolbar.querySelector(
      '[name="field-value-config"]'
    );
    valueConfigInput.addEventListener('input', () => {
      if (!this.nowFieldBox) {
        return;
      }

      const fieldType = typeConfigSelect.value;
      const value = valueConfigInput.value;

      switch (fieldType) {
        case 'text':
        case 'textarea':
        case 'number':
        case 'date':
          const field = this.nowFieldBox.querySelector('.form-control');
          field.value = value;
          break;

        case 'select':
        case 'radio':
        case 'checkbox':
          this.changeFieldOption(this.nowFieldBox, value);
          break;

        case 'content':
          const contentField = this.nowFieldBox.querySelector('.field');
          contentField.innerHTML = value;
          break;
      }
    });

    const classConfigInput = toolbar.querySelector(
      '[name="field-class-config"]'
    );
    classConfigInput.addEventListener('input', () => {
      if (!this.nowFieldBox) {
        return;
      }

      const newClassString = classConfigInput.value;
      const nowFieldWitdh = widthConfigInput.value;

      this.nowFieldBox.setAttribute(
        'class',
        `field-box editing col-${nowFieldWitdh} ${newClassString}`
      );
    });

    const patternConfigInput = toolbar.querySelector(
      '[name="field-pattern-config"]'
    );
    patternConfigInput.addEventListener('input', () => {
      if (!this.nowFieldBox) {
        return;
      }

      const pattern = patternConfigInput.value;
      const field = this.nowFieldBox.querySelector('.field');

      field?.setAttribute('pattern', pattern);
    });

    const sourceConfigSelect = toolbar.querySelector(
      '[name="field-source-config"]'
    );
    sourceConfigSelect.addEventListener('change', () => {
      if (!this.nowFieldBox) {
        return;
      }

      // need api to test**********
      const options = sourceConfigSelect.value;
      const fieldType = typeConfigSelect.value;
      this.changeFieldOption(this.nowFieldBox, options);

      valueConfigInput.value =
        fieldType === 'treeselect' ? '' : sourceConfigSelect.value; // overwrite value-config's value
    });

    const requiredConfigSwitch = toolbar.querySelector(
      '[name="field-required-config"]'
    );
    requiredConfigSwitch.addEventListener('change', () => {
      if (!this.nowFieldBox) {
        return;
      }

      const field = this.nowFieldBox.querySelector('.field');

      if (requiredConfigSwitch.checked === true) {
        field.setAttribute('required', 'required');
      } else {
        field.removeAttribute('required');
      }
    });

    return this;
  }

  changeFieldOption(fieldBox, options) {
    if (!this.isEl(fieldBox)) {
      console.warn('element fieldBox does not exist!');
      return this;
    }

    options = typeof options === 'string' ? options.split(',') : options;
    const fieldType = this.getFieldType(fieldBox);

    if (fieldType === 'select') {
      const select = fieldBox.querySelector('select');
      select.innerHTML = '';

      for (const option of options) {
        select.append(new Option(option));
      }
    } else if (fieldType === 'checkbox' || fieldType === 'radio') {
      const oldCheckBoxContainer = fieldBox.querySelector('.form-check-box');
      const name = oldCheckBoxContainer.querySelector('.field')?.name;
      const newField = this.createFieldByType(fieldType, name, options);
      oldCheckBoxContainer.remove();
      fieldBox.append(newField);
    }

    return this;
  }

  clearFieldsData(box) {
    box = this.getEl(box);

    if (!box) {
      console.warn('element box does not exist!');
      return this;
    }

    box.classList.remove('was-validated'); // for boostrap validation
    const fields = box.querySelectorAll('[name]');

    for (const field of fields) {
      this.clearFieldValue(field);
    }

    return this;
  }

  clearFieldValue(field) {
    if (!this.isEl(field)) {
      console.warn('element field does not exist!');
      return this;
    }

    const fieldType = this.getFieldType(field);

    switch (fieldType) {
      case 'treeselect':
        const treeselect = this.getTreeselect(field);

        if (treeselect && treeselect instanceof window.Treeselect) {
          treeselect.updateValue('');
        }

        break;

      case 'radio':
      case 'checkbox':
        field.checked = false;
        break;

      case 'select':
        field.selectedIndex = 0;
        break;

      default:
        field.value = '';
        break;
    }

    return this;
  }

  createEl(tag = 'div', attrs = {}, children = []) {
    const el = document.createElement(tag);

    for (const [attrName, attrValue] of Object.entries(attrs)) {
      el.setAttribute(attrName, attrValue);
    }

    for (const child of children) {
      el.append(child);
    }

    return el;
  }

  createFieldByType(type = '', name, options = ['cat', 'dog', 'monkey']) {
    const random = this.getRandom();
    const fieldConfig = [];
    const fieldName = name || `field-${random}`;
    const fieldId = `field-id-${random}`;

    switch (type) {
      case 'content':
        fieldConfig.push(
          'span',
          {
            class: 'form-text field',
            name: fieldName,
            id: fieldId
          },
          ['New Text']
        );
        break;

      case 'text':
      case 'number':
      case 'date':
      case 'file':
        fieldConfig.push('input', {
          type,
          class: 'form-control field',
          name: fieldName,
          id: fieldId,
          ...(type === 'file' && { disabled: 'disabled' })
        });
        break;

      case 'textarea':
        fieldConfig.push('textarea', {
          class: 'form-control field',
          name: fieldName,
          id: fieldId
        });
        break;

      case 'select':
        const optionEls = [];

        for (const option of options) {
          if (typeof option === 'object') {
            const text = Object.keys(option)[0];
            const value = option[text];
            optionEls.push(new Option(text, value));
          } else {
            optionEls.push(new Option(option));
          }
        }

        fieldConfig.push(
          'select',
          { class: 'form-select field', name: fieldName, id: fieldId },
          optionEls
        );
        break;

      case 'radio':
      case 'checkbox':
        const radios = [];

        for (const option of options) {
          const random = this.getRandom();
          const radioId = `${fieldName}-${random}`;
          const radio = this.createEl(
            'div',
            {
              class: 'form-check'
            },
            [
              this.createEl('input', {
                type,
                value: option,
                name: fieldName,
                id: radioId,
                class: 'form-check-input field'
              }),
              this.createEl(
                'label',
                {
                  for: radioId,
                  class: 'form-check-label'
                },
                [option]
              )
            ]
          );
          radios.push(radio);
        }

        fieldConfig.push(
          'div',
          {
            class: 'form-check-box'
          },
          radios
        );
        break;

      case 'treeselect':
        fieldConfig.push('span', {
          class: 'treeselect field',
          name: fieldName,
          id: fieldId
        });
        break;
    }

    const field = this.createEl(...fieldConfig);
    return field;
  }

  createFieldConfigBox() {
    const fieldLabel = this.createEl('small', { class: 'text-muted mb-1' }, [
      'Field Config'
    ]);
    const typeSelectBox = this.createFloatFieldBox(
      'select',
      'field-type-config',
      'Field Type',
      [
        'text',
        'textarea',
        'number',
        'date',
        'select',
        'radio',
        'checkbox',
        'content',
        'treeselect',
        'file'
      ]
    );
    const nameInputBox = this.createFloatFieldBox(
      'text',
      'field-name-config',
      'Field Name'
    );
    const labelInputBox = this.createFloatFieldBox(
      'text',
      'field-label-config',
      'Label Name'
    );
    const widthInputBox = this.createFloatFieldBox(
      'number',
      'field-width-config',
      'Width ( 1 ~ 12 )'
    );
    const valueInputBox = this.createFloatFieldBox(
      'text',
      'field-value-config',
      'Value'
    );
    const classInputBox = this.createFloatFieldBox(
      'text',
      'field-class-config',
      'Class Name'
    );
    const patternInputBox = this.createFloatFieldBox(
      'text',
      'field-pattern-config',
      'Pattern'
    );
    const sourceSelectBox = this.createFloatFieldBox(
      'select',
      'field-source-config',
      'Source',
      ['', { gender: 'male,female' }, { days: 'Mon,Tue,Wed,Thu,Fri,Sat,Sun' }]
    ); // test fack data **********)
    const requiredSwitchBox = this.createSwitchBox(
      'field-required-config',
      'Required'
    );

    const fieldConfigBox = this.createEl(
      'div',
      { class: 'field-config-box d-flex flex-column' },
      [
        fieldLabel,
        typeSelectBox,
        nameInputBox,
        labelInputBox,
        widthInputBox,
        valueInputBox,
        classInputBox,
        patternInputBox,
        sourceSelectBox,
        requiredSwitchBox
      ]
    );

    return fieldConfigBox;
  }

  createFloatFieldBox(type, name, label, options = []) {
    const field = this.createFieldByType(type, name, options);
    const fieldBox = this.createFloatLabelBox(field, label, 'mb-1');

    return fieldBox;
  }

  createFloatLabelBox(field, labelName = '', boxClass = '') {
    if (!this.isEl(field)) {
      console.warn('element field does not exist!');
      return this;
    }

    const label = this.createEl('label', {}, [labelName]);
    const floatBox = this.createEl(
      'div',
      { class: `form-floating ${boxClass}` },
      [field, label]
    );

    return floatBox;
  }

  createIdBadge(id = '', includeDelete = false) {
    let idBadgeClass = 'badge rounded-pill bg-primary id-badge ';
    const idBadgeChildren = [id];

    if (includeDelete) {
      const deleteBadge = this.createEl(
        'span',
        {
          class:
            'delete-tab-pane-box position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger'
        },
        ['x']
      );
      idBadgeClass += 'position-relative';
      idBadgeChildren.push(deleteBadge);
    }

    const idBadge = this.createEl(
      'sapn',
      { class: idBadgeClass },
      idBadgeChildren
    );
    return idBadge;
  }

  createSwitchBox(name = 'switch', labelName = 'Switch') {
    const switchId = `switch-${this.getRandom()}`;
    const switchInput = this.createEl('input', {
      name,
      type: 'checkbox',
      class: 'form-check-input',
      id: switchId
    });
    const switchLabel = this.createEl(
      'label',
      {
        class: 'form-check-label',
        for: switchId
      },
      [labelName]
    );
    const switchBox = this.createEl(
      'div',
      { class: 'form-check form-switch' },
      [switchInput, switchLabel]
    );

    return switchBox;
  }

  createTabpaneBox(tabElObj = {}, needEdit = false) {
    const tabHeader = this.createEl('div', { class: 'nav nav-tabs' });
    const tabPane = this.createEl('div', { class: 'tab-content mt-3' });
    let activeContentClass = 'show active';
    let activeTabClas = 'active';

    for (const tabName in tabElObj) {
      const tabContentId = `tabName-${this.getRandom()}`;
      const tabContent = this.createEl(
        'div',
        {
          class: `tab-pane fade ${activeContentClass}`,
          id: tabContentId
        },
        [...[].concat(tabElObj[tabName])]
      );
      const tabNameBox = this.createEl(
        'span',
        { class: 'tab-name', contentEditable: needEdit },
        [tabName]
      );
      const tabNameChildren = [tabNameBox];

      if (needEdit) {
        const deleteTabBtn = this.createEl(
          'span',
          { class: 'delete-tab-btn position-absolute text-danger top-0 end-0' },
          ['x']
        );
        tabNameChildren.push(deleteTabBtn);
      }

      const tab = this.createEl(
        'button',
        {
          class: `nav-link position-relative ${activeTabClas}`,
          'data-bs-toggle': 'tab',
          'data-bs-target': `#${tabContentId}`
        },
        tabNameChildren
      );

      activeContentClass = '';
      activeTabClas = '';

      tabHeader.append(tab);
      tabPane.append(tabContent);
    }

    if (needEdit) {
      const addTabBtn = this.createEl(
        'button',
        {
          class: 'btn-primary btn btn-sm mx-3 h-75 add-tab'
        },
        ['Add']
      );
      tabHeader.append(addTabBtn);
    }

    const tabPaneBox = this.createEl(
      'div',
      { class: `tab-pane-box ${needEdit ? 'tab-pane-edit' : ''}` },
      [tabHeader, tabPane]
    );

    return tabPaneBox;
  }

  deleteFieldBox(fieldBox = this.nowFieldBox) {
    if (!this.isEl(fieldBox)) {
      return this;
    }

    // After deletion, focusing on the remaining field improves the user experience
    const prevFieldBox = fieldBox.previousElementSibling?.classList?.contains(
      'field-box'
    )
      ? fieldBox.previousElementSibling
      : null;
    const nextFieldBox = fieldBox.nextElementSibling?.classList?.contains(
      'field-box'
    )
      ? fieldBox.nextElementSibling
      : null;

    fieldBox.remove();
    this._toggleNowFieldBox(prevFieldBox || nextFieldBox);

    return this;
  }

  getChartPreviewData(type = 'line') {
    let data = [];

    switch (type) {
      case 'line':
      case 'bar':
      case 'area':
        data = [
          { name: 'Mon', value: 150 },
          { name: 'Tue', value: 230 },
          { name: 'Wed', value: 224 },
          { name: 'Thu', value: 218 },
          { name: 'Fri', value: 135 },
          { name: 'Sat', value: 147 },
          { name: 'Sun', value: 260 }
        ];
        break;

      case 'pie':
        data = [
          { name: 'Search Engine', value: 1048 },
          { name: 'Direct', value: 735 },
          { name: 'Email', value: 580 },
          { name: 'Union Ads', value: 484 },
          { name: 'Video Ads', value: 300 }
        ];
        break;
    }

    return data;
  }

  getEl(elOrId, tagName = '') {
    if (!elOrId) {
      return null;
    }

    if (tagName) {
      tagName = tagName.toUpperCase();
    }

    let el = null;

    if (this.isEl(elOrId)) {
      el = elOrId;
    } else if (typeof elOrId === 'string') {
      el = document.getElementById(elOrId);
    }

    if (el) {
      if (!tagName || (tagName && el.tagName === tagName)) {
        return el;
      } else {
        console.warn('element type is not correct');
      }
    }

    return null;
  }

  getFieldConfig(fieldBox) {
    if (!this.isEl(fieldBox)) {
      console.warn('element fieldBox does not exist!');
      return {};
    }

    const fieldConfig = {};
    const field = fieldBox.querySelector('.field');
    const fieldClassList = Array.from(fieldBox.classList);
    const fieldType = this.getFieldType(fieldBox);
    const classString = this.getFieldModifiedClass(fieldBox);
    const valueString = this.getFieldValueString(fieldBox);
    const fieldLabelName = fieldBox.querySelector('.form-label')?.innerHTML;
    const fieldNmae = field.getAttribute('name');
    const fieldWidthClass = fieldClassList
      .filter((classString) => classString.indexOf('col-') > -1)
      .shift();
    const fieldWidth = fieldWidthClass?.substring(4) || '12'; // 12 is default width
    const fieldPattern = field.pattern;
    const isRequired = field.getAttribute('required') === null ? false : true;

    fieldConfig['field-name-config'] = fieldNmae;
    fieldConfig['field-label-config'] = fieldLabelName;
    fieldConfig['field-type-config'] = fieldType;
    fieldConfig['field-class-config'] = classString;
    fieldConfig['field-value-config'] = valueString;
    fieldConfig['field-width-config'] = fieldWidth;
    fieldConfig['field-pattern-config'] = fieldPattern;
    fieldConfig['field-source-config'] = ''; // ***********
    fieldConfig['field-required-config'] = isRequired;

    return fieldConfig;
  }

  getFieldModifiedClass(elOrString = '') {
    let classString = elOrString || '';

    if (this.isEl(elOrString)) {
      classString = elOrString.classList.value;
    }

    return classString
      .replace('field-box', '')
      .replace('editing', '')
      .replace(/col-(1[0-2]|[1-9])/g, '')
      .trim();
  }

  getFieldValueString(fieldBox) {
    if (!fieldBox) {
      console.warn('element fieldBox does not exist!');
      return '';
    }

    const fieldType = this.getFieldType(fieldBox);
    let value = '';

    switch (fieldType) {
      case 'text':
      case 'textarea':
      case 'number':
      case 'date':
        value = fieldBox.querySelector('.field').value;
        break;

      case 'content':
        value = fieldBox.querySelector('.form-text').innerHTML;
        break;

      case 'select':
      case 'radio':
      case 'checkbox':
        const options =
          fieldType === 'select'
            ? new Set(fieldBox.querySelector('select').options)
            : new Set(fieldBox.querySelectorAll('input'));

        for (const option of options) {
          value += `${option.value},`;
        }

        break;
    }

    return value;
  }

  getFieldsData(box) {
    box = this.getEl(box);

    if (!box) {
      console.warn('element box does not exist');
      return this;
    }

    const data = {};
    const fields = box.querySelectorAll('[name]');

    for (const field of fields) {
      const name = field.getAttribute('name');
      const value = this.getFieldValue(field);
      data[name] = value;
    }

    return data;
  }

  getFieldType(field) {
    if (!this.isEl(field)) {
      console.warn('element field does not exist!');
      return null;
    }

    if (field.classList.contains('treeselect')) {
      return 'treeselect';
    } else if (field instanceof HTMLInputElement) {
      if (field.closest('.form-switch')) {
        return 'switch';
      } else {
        return field.type;
      }
    } else if (field instanceof HTMLSelectElement) {
      return 'select';
    } else if (field instanceof HTMLTextAreaElement) {
      return 'textarea';
    } else if (field instanceof HTMLSpanElement) {
      return 'content';
    }

    const fieldBox = field.closest('.field-box');

    return fieldBox?.dataset.type;
  }

  getFieldValue(field, convertToJson = false) {
    let value = '';
    field = this.getEl(field);

    if (!field) {
      console.warn('element field does not exist!');
      return value;
    }

    const fieldType = this.getFieldType(field);
    const form = field.closest('form');
    const name = field.getAttribute('name');

    switch (fieldType) {
      case 'content':
        value = field.textContent;
        break;

      case 'treeselect':
        const treeselect = this.getTreeselect(field);

        if (treeselect && treeselect instanceof window.Treeselect) {
          value = treeselect.value;
        }

        break;

      case 'radio':
      case 'checkbox':
        const optionsBox = form || document;
        const checkedOptions = optionsBox.querySelectorAll(
          `[name="${name}"]:checked`
        );
        value = Array.from(checkedOptions).map((option) => option.value);
        break;

      default:
        value = field.value;
        break;
    }

    return convertToJson ? JSON.stringify(value) : value;
  }

  getOrderDataset(dataName) {
    let index;

    for (
      index = 1;
      document.querySelector(`[data-${dataName}="${dataName}${index}"]`);
      index++
    ) {}

    return `${dataName}${index}`;
  }

  getOrderId(id) {
    let index;

    for (index = 1; document.getElementById(`${id}${index}`); index++) {}

    return `${id}${index}`;
  }

  getQueryUrl(url = '', query = {}) {
    if (Object.keys(query).length) {
      url += '?';

      for (const key in query) {
        url += `${key}=${query[key]}&`;
      }

      url = url.substring(0, url.length - 1);
    }

    return url;
  }

  getRandom(min = 100000, max = 999999) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  getRandomDate() {
    const nowYear = new Date().getFullYear();
    const startDate = new Date(nowYear - 2, 0, 1).getTime();
    const endDate = new Date(nowYear + 3, 11, 31).getTime();

    const randomTimestamp = Math.random() * (endDate - startDate) + startDate;
    const randomDate = new Date(randomTimestamp);

    const year = randomDate.getFullYear();
    const month = String(randomDate.getMonth() + 1).padStart(2, '0');
    const day = String(randomDate.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  getRandomValueByType(typeOrOption = 'content') {
    let value = '';
    const words = [
      'apple',
      'banana',
      'cherry',
      'dog',
      'elephant',
      'fox',
      'grape',
      'house',
      'igloo',
      'jacket',
      'kite',
      'lemon',
      'monkey',
      'newspaper',
      'orange',
      'penguin',
      'queen',
      'rainbow',
      'strawberry',
      'tiger',
      'umbrella',
      'violet',
      'watermelon',
      'xylophone',
      'zebra'
    ];
    const randomIndex = Math.floor(Math.random() * words.length);

    switch (typeOrOption) {
      case 'text':
        value = `this is ${words[randomIndex]}`;
        break;

      case 'number':
        value = this.getRandom(1, 999);
        break;

      case 'date':
        value = this.getRandomDate();
        break;

      case 'textarea':
        value = `a lots of ${words[randomIndex]}`;
        break;

      case 'content':
        value = `good ${words[randomIndex]}`;
        break;

      default:
        if (Array.isArray(typeOrOption)) {
          value = typeOrOption[0];
        }
        break;
    }

    return value;
  }

  getSubformData(subformEl) {
    subformEl = this.getEl(subformEl);

    if (!subformEl) {
      console.warn('element subformEl does not exist!');
      return null;
    }

    const rows = subformEl.querySelectorAll('tr');
    const subformData = [];

    for (const row of rows) {
      let isRowEmpty = true;
      const rowData = {};
      const rowFields = row.querySelectorAll('[name]');

      for (const field of rowFields) {
        const fieldName = field.getAttribute('name');

        if (!rowData.hasOwnProperty(fieldName)) {
          const fieldValue = this.getFieldValue(field);
          rowData[fieldName] = fieldValue;

          if (fieldValue) {
            isRowEmpty = false;
          }
        }
      }

      if (!isRowEmpty) {
        // Push data if the row is not empty.
        subformData.push(rowData);
      }
    }

    return subformData;
  }

  getTreeselect(elOrId) {
    const treeselectDom = this.getEl(elOrId);

    if (!window.Treeselect || !this.isEl(treeselectDom)) {
      console.warn(
        'Treeselect does not exist or ​parameter elOrId is not correct!'
      );
      return null;
    }

    const dataId = treeselectDom.dataset.id;
    const treeselect = window.Treeselect.instances?.[dataId];

    return treeselect || null;
  }

  getTreeselectPreviewData() {
    return [
      {
        name: 'JavaScript',
        value: 'JavaScript',
        children: [
          {
            name: 'React',
            value: 'React',
            children: [
              {
                name: 'React.js',
                value: 'React.js',
                children: []
              },
              {
                name: 'React Native',
                value: 'React Native',
                children: []
              }
            ]
          },
          {
            name: 'Vue',
            value: 'Vue',
            children: []
          }
        ]
      },
      {
        name: 'HTML',
        value: 'html',
        children: [
          {
            name: 'HTML5',
            value: 'HTML5',
            children: []
          },
          {
            name: 'XML',
            value: 'XML',
            children: []
          }
        ]
      }
    ];
  }

  getUrlParams(searchParams = window.location.search) {
    const searchObj = new URLSearchParams(searchParams);
    const paramsObj = {};

    for (const [key, value] of searchObj) {
      paramsObj[key] = value;
    }

    return paramsObj;
  }

  isEl(el) {
    return el instanceof Element;
  }

  replaceNowField() {
    const toolbar = this.toolbar;
    const fieldType = toolbar.querySelector('[name="field-type-config"]').value;
    const fieldName = toolbar.querySelector('[name="field-name-config"]').value;
    const labelName = toolbar.querySelector(
      '[name="field-label-config"]'
    ).value;

    const newField = this.createFieldByType(fieldType, fieldName);

    const labelAttrSetting = {
      class: 'form-label',
      for: newField.id
    };

    if (!labelAttrSetting.for) {
      delete labelAttrSetting.for;
    }

    const newLabel = this.createEl('label', labelAttrSetting, [labelName]);

    this.nowFieldBox.innerHTML = '';
    this.nowFieldBox.dataset.type = fieldType;
    this.nowFieldBox.append(newLabel);
    this.nowFieldBox.append(newField);

    if (fieldType === 'treeselect') {
      this.buildTreeselects(this.nowFieldBox);
    }

    return this;
  }

  runScript(script) {
    if (script instanceof HTMLScriptElement !== true) {
      return;
    }

    const scriptAttrArr = Array.from(script.attributes);
    const scriptAttrObj = { type: 'module' };

    for (const attrObj of scriptAttrArr) {
      const { name, value } = attrObj;
      scriptAttrObj[name] = value;

      if (name === 'src' && value.indexOf('http') > -1) {
        delete scriptAttrObj.type;
      }
    }

    const newScript = this.createEl('script', scriptAttrObj, [
      script.innerHTML
    ]);

    document.body.appendChild(newScript);
    document.body.removeChild(newScript);

    return this;
  }

  runStyle(style) {
    const newStyle = document.createElement('style');
    const src = style.getAttribute('src');

    newStyle.innerHTML = style.innerHTML;

    if (src) {
      newStyle.setAttribute('src', src);
    }

    document.body.appendChild(newStyle);

    return newStyle;
  }

  setBsTooltip() {
    if (!bootstrap) {
      console.warn('bootstrap does not exist!');
      return this;
    }

    const tooltipEls = document.querySelectorAll('[data-bs-toggle="tooltip"]');

    for (const tooltipEl of tooltipEls) {
      new bootstrap.Tooltip(tooltipEl);
    }

    return this;
  }

  setFieldsData(box, data = []) {
    box = this.getEl(box);

    if (!box) {
      console.warn('element box does not exist!');
      return this;
    }

    for (const dataName in data) {
      const field = box.querySelector(`[name="${dataName}"]`);

      if (field) {
        this.setFieldValue(field, data[dataName]);
      }
    }

    return this;
  }

  setFieldToolbarData(fieldBox) {
    const toolbar = this.toolbar;
    const fieldConfigBox = toolbar.querySelector('.field-config-box');
    this.clearFieldsData(fieldConfigBox);

    if (!this.isEl(fieldBox)) {
      return this;
    }

    const fieldConfig = this.getFieldConfig(fieldBox);

    this.setFieldsData(fieldConfigBox, fieldConfig);
    this.toggleFieldConfig();

    return this;
  }

  setFieldValue(field, value = '') {
    field = this.getEl(field);

    if (!field) {
      console.warn('element field does not exist!');
      return this;
    }

    const form = field.closest('form');
    const name = field.getAttribute('name');
    const fieldType = this.getFieldType(field);
    this.clearFieldValue(field);

    switch (fieldType) {
      case 'switch':
        field.checked = value;
        break;

      case 'treeselect':
        const treeselect = this.getTreeselect(field);

        if (treeselect && treeselect instanceof window.Treeselect) {
          treeselect.updateValue(value);
        }

        break;

      case 'radio':
      case 'checkbox':
        value = [].concat(value);

        for (const checkedValue of value) {
          const optionsBox = form || document;
          const checkedOption = optionsBox.querySelector(
            `[name="${name}"][value="${checkedValue}"]`
          );

          if (checkedOption) {
            checkedOption.checked = true;
          }
        }

        break;

      case 'content':
        field.textContent = value;
        break;

      default:
        field.value = value;
        break;
    }

    return this;
  }

  setToolbarPosition(target, toolbar = this.toolbar) {
    if (!this.isEl(target) || !this.isEl(toolbar)) {
      return;
    }
    const targetRect = target.getBoundingClientRect();
    const targetPositionX = targetRect.x;
    const targetPositionY = targetRect.top + window.scrollY;
    const targetWidth = targetRect.width;
    const toolbarWidth = parseInt(window.getComputedStyle(toolbar).width);
    const newPositionX =
      toolbarWidth > targetPositionX
        ? targetPositionX + targetWidth + 20
        : targetPositionX - toolbarWidth - 20;

    toolbar.style.left = `${newPositionX}px`;
    toolbar.style.top = `${targetPositionY}px`;

    return this;
  }

  toggleFormReadOnly(formEl, isFormReadOnly) {
    formEl = this.getEl(formEl, 'form');

    if (!this.isEl(formEl)) {
      console.warn("element formEl does not exist or it's not a form!");
      return this;
    }

    isFormReadOnly = isFormReadOnly ?? !formEl.classList.contains('form-read');
    const fields = formEl.querySelectorAll('[name]');
    formEl.classList.toggle('form-read', isFormReadOnly);

    for (const field of fields) {
      if (!isFormReadOnly) {
        field.removeAttribute('disabled');
      } else {
        field.setAttribute('disabled', 'disabled');
      }
    }

    return this;
  }

  toggleFieldConfig() {
    const fieldType = this.toolbar.querySelector(
      '[name="field-type-config"]'
    ).value;
    const hasSourceTypes = ['radio', 'checkbox', 'select', 'treeselect'];
    const withoutValueTypes = ['treeselect'];
    const hasPatternTypes = ['text', 'email', 'password'];
    const withoutRequiredTypes = ['checkbox', 'treeselect'];

    const sourceConfig = this.toolbar.querySelector(
      '[name="field-source-config"]'
    );
    const sourceConfigBox = sourceConfig.closest('.form-floating');
    const valueConfig = this.toolbar.querySelector(
      '[name="field-value-config"]'
    );
    const valueConfigBox = valueConfig.closest('.form-floating');
    const patternConfig = this.toolbar.querySelector(
      '[name="field-pattern-config"]'
    );
    const patternConfigBox = patternConfig.closest('.form-floating');
    const requiredConfig = this.toolbar.querySelector(
      '[name="field-required-config"]'
    );
    const requiredConfigBox = requiredConfig.closest('.form-switch');

    const isSourceShow = hasSourceTypes.includes(fieldType);
    const isValueShow = !withoutValueTypes.includes(fieldType);
    const isPatternShow = hasPatternTypes.includes(fieldType);
    const isRequiredShow = !withoutRequiredTypes.includes(fieldType);

    sourceConfigBox.classList.toggle('d-none', !isSourceShow);
    valueConfigBox.classList.toggle('d-none', !isValueShow);
    patternConfigBox.classList.toggle('d-none', !isPatternShow);
    requiredConfigBox.classList.toggle('d-none', !isRequiredShow);

    return this;
  }

  async buildTreeselects(box) {
    if (!window.Treeselect || !this.isEl(box)) {
      throw new Error(
        'Treeselect does not exist or element box does not exist!'
      );
    }

    const treeselectEls = box.querySelectorAll('.treeselect');
    const treeselects = {};

    for (const treeselectEl of treeselectEls) {
      const dataset = treeselectEl.dataset;
      const source = dataset.source;
      const name = treeselectEl.getAttribute('name');
      const isSingle = dataset.multiple === 'false';
      const options = source
        ? await this.getData(source)
        : this.getTreeselectPreviewData();

      treeselectEl.innerHTML = '';
      treeselects[name] = new window.Treeselect({
        options,
        parentHtmlContainer: treeselectEl,
        isSingleSelect: isSingle,
        openLevel: 1,
        value: isSingle ? '' : []
      });

      const dataId = `treeselect-${this.getRandom()}`;
      treeselectEl.dataset.id = dataId;

      if (!Array.isArray(window.Treeselect.instances)) {
        window.Treeselect.instances = [];
      }

      window.Treeselect.instances[dataId] = treeselects[name];
    }

    return treeselects;
  }

  async deleteData(url = '', para = {}) {
    const response = await fetch(url, {
      method: 'delete',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(para)
    });

    if (response) {
      const responseData = await response.json();
      return responseData;
    } else {
      alert('Failed to get data, please try again later.');
      return null;
    }
  }

  async getChartOption(chartBox) {
    if (!this.isEl(chartBox)) {
      throw new Error('element chartBox does not exist!');
    }

    const option = {};
    const config = chartBox.dataset;
    const type = config.chart;
    const source = config.source;

    switch (type) {
      case 'line':
      case 'bar':
      case 'area':
        {
          const data = source
            ? await this.getData(source)
            : this.getChartPreviewData(type);
          const categoryAxis = config.category === 'x' ? 'xAxis' : 'yAxis';
          const valueAxis = categoryAxis === 'xAxis' ? 'yAxis' : 'xAxis';
          const cateName = source ? config.catename || 'name' : 'name';
          const valueName = source ? config.valuename || 'value' : 'value';
          const cateData = [];
          const valueData = [];

          for (const axisData of data) {
            cateData.push(axisData[cateName]);
            valueData.push(axisData[valueName]);
          }

          option[categoryAxis] = {
            type: 'category',
            boundaryGap: type !== 'area',
            data: cateData
          };
          option[valueAxis] = {
            type: 'value'
          };
          option.series = [
            {
              data: valueData,
              type: type === 'area' ? 'line' : type,
              smooth: true,
              areaStyle: type === 'area' ? {} : null
            }
          ];
        }
        break;

      case 'pie':
        {
          const data = source
            ? await this.getData(source)
            : this.getChartPreviewData(type);
          option.title = {
            text: config.name || '',
            subtext: config.subname || '',
            left: 'center'
          };
          option.tooltip = {
            trigger: 'item'
          };
          option.legend = {
            orient: 'vertical',
            left: 'left'
          };
          option.series = [
            {
              type: 'pie',
              radius: config.size ? `${config.size}%` : '50%',
              data,
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
              }
            }
          ];
        }
        break;
    }

    return option;
  }

  async getData(url = '', query = {}) {
    const api = this.getQueryUrl(url, query);
    const response = await fetch(api);

    if (response) {
      const responseData = await response.json();
      return responseData;
    } else {
      alert('Failed to get data, please try again later.');
      return null;
    }
  }

  async postData(url = '', para = {}) {
    const response = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: typeof para === 'object' ? JSON.stringify(para) : para
    });

    if (response) {
      return response;
    } else {
      alert('Failed to get data, please try again later.');
      return null;
    }
  }

  async putData(url = '', para = {}) {
    const response = await fetch(url, {
      method: 'put',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(para)
    });

    if (response) {
      const responseData = await response.json();
      return responseData;
    } else {
      alert('Failed to get data, please try again later.');
      return null;
    }
  }

  async renderChart(chartEl) {
    if (!this.isEl(chartEl)) {
      throw new Error('element chartEl does not exist!');
    }

    chartEl = chartEl.classList.contains('echart')
      ? chartEl
      : chartEl.querySelector('.echart');

    const oldChart = echarts.getInstanceByDom(chartEl);
    oldChart?.dispose();

    const chart = echarts.init(chartEl);
    const option = await this.getChartOption(chartEl);
    chart.setOption(option);

    // set chart can auto resize
    new ResizeObserver(() => {
      chart.resize();
    }).observe(document.body);

    return chart;
  }

  async setSubformData(subformEl, data = [], addedCallBack = null) {
    subformEl = this.getEl(subformEl);
    const tbody = subformEl?.querySelector('tbody');

    if (!tbody) {
      console.warn('element subformEl or tbody does not exist!');
      return this;
    }

    for (let i = 0; i < data.length; i++) {
      const rows = tbody.querySelectorAll('tr');
      const lastRow = rows[rows.length - 1];
      const rowData = data[i];

      for (const name in rowData) {
        const field = lastRow.querySelector(`[name=${name}]`);

        if (field) {
          this.setFieldValue(field, rowData[name]);
        }
      }

      if (typeof addedCallBack === 'function' && i !== data.length - 1) {
        await addedCallBack();
      }
    }
  }
}

class Page extends Core {
  constructor(config = {}) {
    super();
    this.root = config.root || document.getElementById(config.id || 'main');
    this.source = config.source || '';
    this.container = null;
    this.isEditing = false;
    this.nowLayoutItem = null;
    this.nowTabPane = null;
    this.designItems = {};
    this.editors = {};
    this.titleInstance = null;
    this.toolbar = null;
    this.doAfterLoad = config.doAfterLoad || null;
    this.doBeforeEdit = config.doBeforeEdit || null;
    this.doBeforeSave = config.doBeforeSave || null;

    this._eventHandler = {};
    this._loadState = 0;
    this._initState = 0; // 0: not init yet, 1: init complete

    Page.instance = this;

    if (!this.isEl(this.root)) {
      throw new Error('Element root does not exist!');
    }
  }

  addLayoutItem() {
    const movingBar = this.createEl('div', {
      class: 'moving-bar mb-3',
      'data-bs-toggle': 'tooltip',
      'data-bs-title': 'Drag Me!'
    });

    const layoutItem = this.createEl(
      'div',
      {
        class: 'layout-item card'
      },
      [movingBar]
    );

    this.container.append(layoutItem);
    this.setBsTooltip();
    this._setDesignElSortable();

    // trigger focus on the new item
    setTimeout(() => {
      layoutItem.click();
    }, 0);

    return this;
  }

  clear() {
    this._removeDesignModal();
    this._removeCustomStyle();
    this.root.innerHTML = '';

    return this;
  }

  deleteLayoutItem(layoutItem = this.nowLayoutItem) {
    if (!layoutItem) {
      console.log('element layoutitem does not exist.');
      return this;
    }

    // After deletion, focusing on the remaining items improves the user experience
    const nearLayoutItem =
      layoutItem.previousElementSibling || layoutItem.nextElementSibling;

    layoutItem.remove();
    this._toggleNowLayoutItem(nearLayoutItem);

    return this;
  }

  dispose() {
    if (this.isEditing) {
      this.toggleEditMode(false);
    }

    this._toggleEvent(false);
    this.toolbar?.remove();

    for (const attrName in this) {
      if (this.hasOwnProperty(attrName)) {
        this[attrName] = null;
      }
    }

    return null;
  }

  getLayoutItemConfig(layoutItem = this.nowLayoutItem) {
    const config = {};

    if (!layoutItem) {
      return config;
    }

    let classString = layoutItem.classList.value;
    // These classes should not be modified
    classString = classString.replace('layout-item', '').replace('editing', '');

    const container = this.container || layoutItem.closest('.layout-container');
    const landscapeValue = container.classList.contains('d-flex');
    const modalId = layoutItem.dataset.modal;

    config['layout-class-config'] = classString;
    config['layout-landscape-config'] = landscapeValue;
    config['layout-modal-config'] = modalId ? true : false;
    config['layout-modalId-config'] = modalId;

    return config;
  }

  initEditor() {
    this._initEventHandler();
    this._initContainer();
    this._loadDesignEditor();
    this._initToolbar();
    this._initPageTitle();
    this._initScriptModal();
    this._initStyleModal();

    this._initState = 1;

    return this;
  }

  loadDesignHtml(
    designHtml = '<div>No Data!</div>',
    loadWithEditSwitch = false
  ) {
    this.clear();
    this.root.innerHTML = designHtml;
    this.togglePageTransition(false);

    const template = this.rootSelect('template');
    const scripts = this.rootSelect('script', true);
    const styles = this.rootSelect('style', true);

    if (template) {
      this.root.innerHTML = template.innerHTML;
    }

    this.container = this.rootSelect('.layout-container');

    if (!this.container) {
      this._initContainer();
    }

    this._toggleDesignItemToModal(false);
    const designEls = document.querySelectorAll('[data-design]', true);

    for (const designEl of designEls) {
      this._initDesignItem(designEl);
    }

    if (loadWithEditSwitch) {
      this._initScriptModal();
      this._initStyleModal();
      this._initSwitchEditorBtn();
      this._clearScriptContent();
      this._clearStyleContent();
      this._setScriptContent(scripts[scripts.length - 1], false);
      this._setStyleContent(styles[styles.length - 1], false);
    }

    for (const script of scripts) {
      this.runScript(script);
    }

    for (const style of styles) {
      const newStyle = this.runStyle(style);
      newStyle.dataset.custom = true;
    }

    this._loadState = 1;

    if (typeof this.doAfterLoad === 'function') {
      this.doAfterLoad(this.root);
    }

    setTimeout(() => {
      this.togglePageTransition(true);
    }, 300);

    return this;
  }

  rootSelect(selector, all = false) {
    if (!selector) {
      return all ? [] : null;
    }

    selector = selector.trim();

    if (all) {
      return [...this.root.querySelectorAll(selector)];
    } else {
      return this.root.querySelector(selector);
    }
  }

  saveLayout() {
    const layoutEl = this.root.cloneNode(true);
    const editingItems = layoutEl.querySelectorAll('.editing');
    const editModeSwitch = layoutEl.querySelector('.edit-mode-switch');
    const oldSript = this.rootSelect('script');
    const oldStyle = this.rootSelect('style');
    const script = this.createEl('script');
    const style = this.createEl('style');

    oldSript?.remove();
    oldStyle?.remove();
    this._setScriptContent(script);
    this._setStyleContent(style);
    this.root.append(script);
    this.root.append(style);

    for (const editingItem of editingItems) {
      editingItem.classList.remove('editing');
    }

    editModeSwitch?.remove();

    const designHtml = layoutEl.innerHTML;

    if (this.source) {
      this.postData(this.source, designHtml);
    } else {
      window.sessionStorage.setItem('designHtml', designHtml);
    }

    return designHtml;
  }

  setToolbarData(layoutItem = this.nowLayoutItem) {
    const layoutItemConfig = this.getLayoutItemConfig(layoutItem);

    this.clearFieldsData(this.toolbar);
    this.setFieldsData(this.toolbar, layoutItemConfig);

    return this;
  }

  toggleEditMode(isEditing = true) {
    if (!this._initState) {
      this.initEditor();
    }

    this.isEditing = isEditing;
    this.toggleToolbar(isEditing);
    this._toggleEvent(isEditing);
    this._toggleNowLayoutItem(
      isEditing ? this.rootSelect('.layout-item') : null
    );
    this._toggleNowTabpane(
      isEditing ? this.rootSelect('.tab-pane-edit') : null
    );
    this._toggleTabpaneEditing(isEditing);
    this._toggleTitleEditable(isEditing);
    this.titleInstance?._toggleEditMode(isEditing);

    if (isEditing) {
      this._setDesignElSortable();

      if (typeof this.doBeforeEdit === 'function') {
        this.doBeforeEdit(this.root);
      }
    } else {
      this._handleBeforeSave();

      if (typeof this.doBeforeSave === 'function') {
        this.doBeforeSave(this.root);
      }

      this._removeCustomStyle();
      this.saveLayout();
      this._handleDesignEls();

      if (typeof this.doAfterLoad === 'function') {
        this.doAfterLoad(this.root);
      }
    }

    this._toggleDesignItemToModal(isEditing);

    for (const childEditor in this.editors) {
      this.editors[childEditor]?._toggleEditMode(isEditing);
    }

    this._handleBeforeEdit(isEditing);
    this._focusFirstDesignItem();

    document.body.classList.toggle('editing', isEditing);

    return this;
  }

  togglePageTransition(isLoad) {
    this.root?.classList.toggle('page-transition', !isLoad);

    return this;
  }

  toggleToolbar(isShow = true) {
    this.toolbar.classList.toggle('d-none', !isShow);
    return this;
  }

  _addTabAndContent(tabpaneBox) {
    if (!this.isEl(tabpaneBox)) {
      console.warn('element tabpane does not exist!');
      return this;
    }

    const tabBox = tabpaneBox.querySelector('.nav-tabs');
    const tabContentBox = tabpaneBox.querySelector('.tab-content');
    const addTabBtn = tabBox.querySelector('.add-tab');

    const tabContentId = `tabName-${this.getRandom()}`;
    const tabContent = this.createEl('div', {
      class: 'tab-pane fade',
      id: tabContentId
    });
    const tabNameBox = this.createEl('span', { contentEditable: true }, [
      'New Tab'
    ]);
    const deleteTabBtn = this.createEl(
      'span',
      { class: 'delete-tab-btn position-absolute text-danger top-0 end-0' },
      ['x']
    );
    const tab = this.createEl(
      'button',
      {
        class: 'nav-link position-relative ',
        'data-bs-toggle': 'tab',
        'data-bs-target': `#${tabContentId}`
      },
      [tabNameBox, deleteTabBtn]
    );

    tabBox?.insertBefore(tab, addTabBtn);
    tabContentBox?.append(tabContent);

    this._setDesignElSortable();

    return this;
  }

  _addTabPane(layoutItem = this.nowLayoutItem) {
    const tabPaneBox = this.createTabpaneBox(
      { Tab1: '', Tab2: '', Tab3: '' },
      true
    );
    const idBadge = this.createIdBadge('tab-pane', true);

    tabPaneBox.classList.add('p-1');
    tabPaneBox.insertBefore(idBadge, tabPaneBox.firstChild);
    layoutItem?.append(tabPaneBox);
    this._setDesignElSortable();

    setTimeout(() => {
      tabPaneBox.click();
    }, 0);

    return this;
  }

  _addTitle(layoutItem = this.nowLayoutItem) {
    const title = this.createEl(
      'h5',
      {
        class: 'card-title',
        contenteditable: 'plaintext-only'
      },
      ['New Title']
    );
    layoutItem?.append(title);

    this._bindTitleEvent(title);

    return this;
  }

  _bindModalEvent(modal) {
    if (!this.isEl(modal)) {
      return;
    }

    modal.addEventListener('show.bs.modal', (e) => {
      this.clearFieldsData(modal);
      const editBtn = e.relatedTarget;

      if (!editBtn) {
        return;
      }

      const tableId = editBtn.closest('table').id;
      const tableInstance = this.designItems[tableId];
      const dataIdKeyName = tableInstance.dataIdKey;
      const dataIdKey = editBtn.dataset.key;
      const data = tableInstance.data.filter(
        (item) => item[dataIdKeyName] == dataIdKey
      )[0];

      this.setFieldsData(modal, data);
    });

    return this;
  }

  _bindTitleEvent(title) {
    if (!this.isEl(title)) {
      return this;
    }

    title.onkeydown = (event) => {
      if (
        (event.key === 'Delete' || event.key === 'Backspace') &&
        title.innerHTML.length === 0
      ) {
        title.remove();
      }
    };

    return this;
  }

  _bindToolbarEvent() {
    const toolbar = this.toolbar;

    const landscapeSwitch = toolbar.querySelector(
      '[name="layout-landscape-config"]'
    );
    landscapeSwitch.addEventListener('click', () => {
      this.container?.classList.toggle('d-flex', landscapeSwitch.checked);
    });

    const addLayoutItemBtn = toolbar.querySelector('[name="add-layout-item"]');
    addLayoutItemBtn.addEventListener('click', () => {
      this.addLayoutItem();
    });

    const deleteLayoutItemBtn = toolbar.querySelector(
      '[name="delete-layout-item"]'
    );
    deleteLayoutItemBtn.addEventListener('click', () => {
      this.deleteLayoutItem(this.nowLayoutItem);
    });

    const classConfigInput = toolbar.querySelector(
      '[name="layout-class-config"]'
    );
    classConfigInput.addEventListener('input', () => {
      this.nowLayoutItem?.setAttribute(
        'class',
        `layout-item editing ${classConfigInput.value}`
      );
    });

    const modalIdConfigInput = toolbar.querySelector(
      '[name="layout-modalId-config"]'
    );
    modalIdConfigInput.addEventListener('input', () => {
      if (!this.nowLayoutItem) {
        return;
      }

      this.nowLayoutItem.dataset.modal = modalIdConfigInput.value;
    });

    const modalConfigSwitch = toolbar.querySelector(
      '[name="layout-modal-config"]'
    );
    modalConfigSwitch.addEventListener('change', () => {
      if (!this.nowLayoutItem) {
        return;
      }

      if (modalConfigSwitch.checked === true) {
        const newModalId = this.getOrderDataset('modal');
        this.nowLayoutItem.dataset.modal = newModalId;
        modalIdConfigInput.value = newModalId;
      } else {
        delete this.nowLayoutItem.dataset.modal;
        modalIdConfigInput.value = '';
      }

      this._toggleToolbarConfig();
    });

    const addFormItemBtn = toolbar.querySelector('[name="add-form"]');
    addFormItemBtn.addEventListener('click', () => {
      const formEditor = this.editors.formEditor;
      const nowTabContent = this.nowTabPane?.querySelector('.tab-pane.active');

      formEditor.addForm(nowTabContent || this.nowLayoutItem);
    });

    const addTableItemBtn = toolbar.querySelector('[name="add-table"]');
    addTableItemBtn.addEventListener('click', () => {
      const tableEditor = this.editors.tableEditor;
      const nowTabContent = this.nowTabPane?.querySelector('.tab-pane.active');

      tableEditor.addTable(nowTabContent || this.nowLayoutItem);
    });

    const addChartItemBtn = toolbar.querySelector('[name="add-chart"]');
    addChartItemBtn.addEventListener('click', () => {
      const chartEditor = this.editors.chartEditor;
      const nowTabContent = this.nowTabPane?.querySelector('.tab-pane.active');

      chartEditor.addChart(nowTabContent || this.nowLayoutItem);
    });

    const addTitleBtn = toolbar.querySelector('[name="add-title"]');
    addTitleBtn.addEventListener('click', () => {
      this._addTitle(this.nowLayoutItem);
    });

    const addTabpaneBtn = toolbar.querySelector('[name="add-tabpane"]');
    addTabpaneBtn.addEventListener('click', () => {
      this._addTabPane(this.nowLayoutItem);
    });

    return this;
  }

  _clearScriptContent() {
    const scriptArea = document.getElementById('script-area');

    if (!scriptArea) {
      return;
    }

    scriptArea.value = '';

    return this;
  }

  _clearStyleContent() {
    const styleArea = document.getElementById('style-area');

    if (!styleArea) {
      return;
    }

    styleArea.value = '';

    return this;
  }

  _createModal(id) {
    const modalId = id || this.getOrderId('modal');
    const closeBtn = this.createEl('button', {
      class: 'btn-close',
      'data-bs-dismiss': 'modal'
    });
    const modalHeader = this.createEl('div', { class: 'modal-header' }, [
      closeBtn
    ]);
    const modalBody = this.createEl('div', { class: 'modal-body' });
    const modalContent = this.createEl('div', { class: 'modal-content' }, [
      modalHeader,
      modalBody
    ]);
    const modalDialog = this.createEl('div', { class: 'modal-dialog' }, [
      modalContent
    ]);
    const modal = this.createEl(
      'div',
      { class: 'modal fade design-modal', id: modalId, tabindex: -1 },
      [modalDialog]
    );

    return modal;
  }

  _deleteTabContentByTab(tab) {
    if (!this.isEl(tab)) {
      console.warn('element tab does not exist!');
      return this;
    }

    const tabpaneBox = tab.closest('.tab-pane-box');
    const tabContentId = tab.dataset.bsTarget;
    const tabContent = tabpaneBox.querySelector(tabContentId);

    tab.remove();
    tabContent?.remove();

    return this;
  }

  _focusFirstDesignItem() {
    const firstDesignItem = this.rootSelect('[data-design]');
    const firstFieldBox = firstDesignItem?.querySelector('.field-box');

    if (firstFieldBox) {
      firstFieldBox.click();
    } else {
      firstDesignItem?.click();
    }

    return this;
  }

  _handleBeforeSave() {
    const forms = this.rootSelect('[data-design="form"]', true);

    for (const form of forms) {
      page.editors.formEditor._toggleDisabledSubmitBtn(form, false);
    }

    page.editors.tableEditor._toggleDisabledSubformBtn(false);
    this._toggleFileInputDisabled(false);

    return this;
  }

  _handleBeforeEdit(isEditing) {
    if (!isEditing) {
      return;
    }

    this._toggleFileInputDisabled(true);
    return this;
  }

  _handleDesignEls() {
    for (const designId in this.designItems) {
      const designItem = this.designItems[designId];

      if (!designItem) {
        return;
      }

      const constructorName = designItem.constructor.name.toLowerCase();

      if (constructorName !== designItem.el.dataset.design) {
        designItem.dispose();
        delete this.designItems[designId];
      } else {
        designItem.refreshInstance();
      }
    }

    const designEls = this.rootSelect('[data-design]', true);

    for (const designEl of designEls) {
      const designId = designEl.getAttribute('id');

      if (!Object.keys(this.designItems).includes(designId)) {
        const itemInstance = this._initDesignItem(designEl);

        if (itemInstance instanceof Table) {
          itemInstance._toggleDatatableToTable(true);
        }
      }
    }

    return this;
  }

  _initContainer() {
    this.container = this.rootSelect('.layout-container');

    if (!this.container) {
      this.container = this.createEl('div', {
        class: 'layout-container card-body'
      });

      this.root.append(this.container);
    }

    this.setBsTooltip();
    this._toggleEvent(true);

    return this;
  }

  _initDesignItem(designEl) {
    if (!this.isEl(designEl)) {
      console.warn('element designEl does not exist!');
      return null;
    }

    const id = designEl.getAttribute('id');
    const type = designEl.dataset.design;
    const constructorObj = {
      form: Form,
      table: Table,
      subform: Subform,
      chart: Chart
    };

    if (!constructorObj[type]) {
      return null;
    }

    const itemInstance = new constructorObj[type]({
      el: designEl,
      designItems: this.designItems
    });
    this.designItems[id] = itemInstance; // let it can connect to each other.

    return itemInstance;
  }

  _initEventHandler() {
    this._eventHandler.bodyClick = (e) => {
      const clickedLayoutItem = e.target.closest('.layout-item');
      const clickedToolbar = e.target.closest('.config-toolbar');

      if (clickedLayoutItem) {
        this._toggleNowLayoutItem(clickedLayoutItem);
        this.setToolbarData(clickedLayoutItem);
      } else if (!clickedToolbar) {
        this._toggleNowLayoutItem(null);
        this.setToolbarData(null);
      }

      // tabpane-related
      const clickedTabpane = e.target.closest('.tab-pane-edit');
      this._toggleNowTabpane(clickedTabpane);

      if (e.target.closest('.delete-tab-btn')) {
        const tab = e.target.closest('.nav-link');
        this._deleteTabContentByTab(tab);
      }

      if (e.target.closest('.add-tab')) {
        const tabpaneBox = e.target.closest('.tab-pane-box');
        this._addTabAndContent(tabpaneBox);
      }

      if (e.target.closest('.delete-tab-pane-box')) {
        const tabpaneBox = e.target.closest('.tab-pane-box');
        tabpaneBox?.remove();
      }
    };

    return this;
  }

  _initPageTitle() {
    const pageTitleEl = this.rootSelect('.pagetitle');
    this.titleInstance = new Title({
      el: pageTitleEl,
      container: this.container
    });

    return this;
  }

  _initScriptModal() {
    let scriptModal = document.getElementById('script-modal');

    if (scriptModal) {
      return;
    }

    scriptModal = this._createModal('script-modal');
    scriptModal.classList.remove('design-modal');

    const modalDialog = scriptModal.querySelector('.modal-dialog');
    const modalHeader = scriptModal.querySelector('.modal-header');
    const modalBody = scriptModal.querySelector('.modal-body');
    const scriptHeader = this.createEl('h3', {}, ['Script']);
    const scriptArea = this.createFieldByType('textarea', 'Script');

    modalDialog.classList.add('modal-lg');
    modalHeader.insertBefore(scriptHeader, modalHeader.firstChild);
    modalBody.append(scriptArea);
    scriptArea.id = 'script-area';
    scriptArea.style.height = '600px';
    document.body.append(scriptModal);

    return this;
  }

  _initStyleModal() {
    let styleModal = document.getElementById('style-modal');

    if (styleModal) {
      return;
    }

    styleModal = this._createModal('style-modal');
    styleModal.classList.remove('design-modal');

    const modalDialog = styleModal.querySelector('.modal-dialog');
    const modalHeader = styleModal.querySelector('.modal-header');
    const modalBody = styleModal.querySelector('.modal-body');
    const styleHeader = this.createEl('h3', {}, ['Style']);
    const styleArea = this.createFieldByType('textarea', 'Style');

    modalDialog.classList.add('modal-lg');
    modalHeader.insertBefore(styleHeader, modalHeader.firstChild);
    modalBody.append(styleArea);
    styleArea.id = 'style-area';
    styleArea.style.height = '600px';
    document.body.append(styleModal);

    return this;
  }

  _initSwitchEditorBtn() {
    const switchEditorBox = this.createSwitchBox(
      'edit-mode-switch',
      'Edit Mode'
    );
    const switchInput = switchEditorBox.querySelector('input');

    switchEditorBox.classList.add('position-absolute', 'edit-mode-switch');
    switchEditorBox.style.zIndex = '9999';
    switchEditorBox.style.top = '15px';
    switchEditorBox.style.right = '15px';

    switchInput.addEventListener('change', () => {
      this.toggleEditMode(switchInput.checked);
    });

    this.root.append(switchEditorBox);

    return this;
  }

  _initToolbar() {
    const layoutLabel = this.createEl('small', { class: 'text-muted mb-1' }, [
      'Layout'
    ]);
    const landscapeSwitchBox = this.createSwitchBox(
      'layout-landscape-config',
      'Landscape'
    );
    const layoutItemLabel = this.createEl(
      'small',
      { class: 'text-muted mb-1 mt-2' },
      ['Layout Item']
    );
    const addItemBtn = this.createEl(
      'button',
      {
        class: 'btn btn-primary mb-1',
        name: 'add-layout-item'
      },
      ['Add']
    );
    const deleteItemBtn = this.createEl(
      'button',
      {
        class: 'btn btn-danger mb-1',
        name: 'delete-layout-item'
      },
      ['Delete']
    );
    const classInputBox = this.createFloatFieldBox(
      'text',
      'layout-class-config',
      'Class Name'
    );
    const modalSwitchBox = this.createSwitchBox('layout-modal-config', 'Modal');
    const modalIdInputBox = this.createFloatFieldBox(
      'text',
      'layout-modalId-config',
      'Modal ID'
    );
    modalIdInputBox.classList.add('d-none');

    const designItemLabel = this.createEl(
      'small',
      { class: 'text-muted mb-1 mt-2' },
      ['Design Item']
    );
    const addFormBtn = this.createEl(
      'button',
      {
        class: 'btn btn-secondary mb-1',
        name: 'add-form'
      },
      ['Add Form']
    );
    const addTableBtn = this.createEl(
      'button',
      {
        class: 'btn btn-secondary mb-1',
        name: 'add-table'
      },
      ['Add Table']
    );
    const addChartBtn = this.createEl(
      'button',
      {
        class: 'btn btn-secondary mb-1',
        name: 'add-chart'
      },
      ['Add Chart']
    );

    const othersLabel = this.createEl(
      'small',
      { class: 'text-muted mb-1 mt-2' },
      ['Others']
    );
    const addTitleBtn = this.createEl(
      'button',
      {
        class: 'btn btn-secondary mb-1',
        name: 'add-title'
      },
      ['Add Title']
    );
    const addTabpaneBtn = this.createEl(
      'button',
      {
        class: 'btn btn-secondary mb-1',
        name: 'add-tabpane'
      },
      ['Add Tabpane']
    );

    const scriptLabel = this.createEl(
      'small',
      { class: 'text-muted mb-1 mt-2' },
      ['Script & Style']
    );
    const addScriptBtn = this.createEl(
      'button',
      {
        class: 'btn btn-primary mb-1',
        name: 'add-script',
        'data-bs-toggle': 'modal',
        'data-bs-target': '#script-modal'
      },
      ['Script']
    );

    const addStyleBtn = this.createEl(
      'button',
      {
        class: 'btn btn-primary mb-1',
        name: 'add-style',
        'data-bs-toggle': 'modal',
        'data-bs-target': '#style-modal'
      },
      ['Style']
    );

    const toolbar = this.createEl(
      'div',
      { class: 'config-toolbar card layout-toolbar d-none' },
      [
        layoutLabel,
        landscapeSwitchBox,
        layoutItemLabel,
        addItemBtn,
        deleteItemBtn,
        classInputBox,
        modalSwitchBox,
        modalIdInputBox,
        designItemLabel,
        addFormBtn,
        addTableBtn,
        addChartBtn,
        othersLabel,
        addTitleBtn,
        addTabpaneBtn,
        scriptLabel,
        addScriptBtn,
        addStyleBtn
      ]
    );

    document.body.append(toolbar);
    this.toolbar = toolbar;
    this._bindToolbarEvent();

    return this;
  }

  _loadDesignEditor() {
    const editorsObj = {
      formEditor: FormEditor,
      tableEditor: TableEditor,
      chartEditor: ChartEditor
    };

    for (const editorName in editorsObj) {
      this.editors[editorName] = new editorsObj[editorName]({
        container: this.container,
        designItems: this.designItems
      });
    }

    return this;
  }

  _removeCustomStyle() {
    const customStyles = document.querySelectorAll('style[data-custom="true"]');

    for (const customStyle of customStyles) {
      customStyle.remove();
    }

    return this;
  }

  _removeDesignModal() {
    const designModals = document.querySelectorAll('.design-modal');

    for (const designModal of designModals) {
      designModal.remove();
    }

    return this;
  }

  _setDesignElSortable() {
    const layoutItems = this.rootSelect('.layout-item', true);
    const tabPanes = this.rootSelect('.tab-pane', true);

    for (const layoutItem of layoutItems) {
      new Sortable(layoutItem, {
        handle: '.id-badge',
        group: 'designEls',
        animation: 150,
        ghostClass: 'moving',
        onEnd: (e) => {
          const movedItem = e.item;
          const oldPositionEl = e.srcElement;
          const targetEl = e.to;

          this._toggleNowLayoutItem(targetEl);

          if (movedItem.dataset.design) {
            movedItem.click();
          } else {
            movedItem.querySelector('[data-design]')?.click();
          }

          if (movedItem.dataset.design !== 'form') {
            return; // Only design-form needs special handling because of submit btn.
          }

          const formId = movedItem.getAttribute('id');
          const submitBtn = oldPositionEl.querySelector(`[form="${formId}"]`);

          if (submitBtn) {
            const submitBox = submitBtn.closest('.submit-box');
            targetEl.insertBefore(submitBox, movedItem.nextElementSibling);
          }
        }
      });

      new Sortable(layoutItem, {
        handle: '.submit-moving-bar',
        animation: 150,
        ghostClass: 'moving'
      });
    }

    for (const tabPane of tabPanes) {
      new Sortable(tabPane, {
        handle: '.id-badge',
        group: 'designEls',
        animation: 150,
        ghostClass: 'moving'
      });
    }

    return this;
  }

  _setScriptContent(script, contentToScript = true) {
    if (!script) {
      return;
    }

    const scriptArea = document.getElementById('script-area');
    const scriptContent = scriptArea?.value || '';

    if (contentToScript) {
      script.innerHTML = scriptContent;
    } else {
      scriptArea.value = script.innerHTML;
    }

    return this;
  }

  _setStyleContent(style, contentToStyle = true) {
    if (!style) {
      return;
    }

    const styleArea = document.getElementById('style-area');
    const styleContent = styleArea?.value || '';

    if (contentToStyle) {
      style.innerHTML = styleContent;
    } else {
      styleArea.value = style.innerHTML;
    }

    return this;
  }

  _toggleDesignItemToModal(isEditing) {
    if (isEditing) {
      const designItemModals = document.querySelectorAll('.design-modal');

      for (const designItemModal of designItemModals) {
        const designItem = designItemModal.querySelector('.layout-item');
        this.container.insertBefore(designItem, this.container.firstChild);
        designItemModal.remove();
      }
    } else {
      const modalDesignItems = this.rootSelect('[data-modal]', true);

      for (const modalDesignItem of modalDesignItems) {
        const modalId = modalDesignItem.dataset.modal;
        const newModal = this._createModal(modalId);
        const modalBody = newModal.querySelector('.modal-body');

        modalBody.append(modalDesignItem);
        document.body.append(newModal);

        this._bindModalEvent(newModal);
      }
    }
  }

  _toggleEvent(bind = true) {
    const { bodyClick } = this._eventHandler;
    bind === true
      ? document.body.addEventListener('click', bodyClick)
      : document.body.removeEventListener('click', bodyClick);

    // set layout-item sortable
    if (!this._initState) {
      new Sortable(this.container, {
        handle: '.moving-bar',
        animation: 150,
        ghostClass: 'moving'
      });
    }

    return this;
  }

  _toggleFileInputDisabled(isDisabled) {
    const fileInputs = this.rootSelect('input[type="file"]', true);

    for (const fileInput of fileInputs) {
      if (isDisabled) {
        fileInput.setAttribute('disabled', 'disabled');
      } else {
        fileInput.removeAttribute('disabled');
      }
    }
  }

  _toggleNowLayoutItem(newLayoutItem) {
    const lastLayoutItem = this.nowLayoutItem;
    lastLayoutItem?.classList.remove('editing');

    this.nowLayoutItem = newLayoutItem;
    this.nowLayoutItem?.classList.add('editing');
    this.setToolbarData(this.nowLayoutItem);
    this._toggleToolbarConfig();
    this._toggleToolbarDisabled(newLayoutItem);

    return this;
  }

  _toggleNowTabpane(newTabpane) {
    const lastTabpane = this.nowTabPane;
    lastTabpane?.classList?.remove('editing');

    this.nowTabPane = newTabpane;
    this.nowTabPane?.classList?.add('editing');

    return this;
  }

  _toggleTabpaneEditing(isEditing) {
    const addTabBtns = this.rootSelect('.add-tab', true);
    const deleteTabBtns = this.rootSelect('.delete-tab-btn', true);
    const tabNameSpans = this.rootSelect('.tab-name', true);

    for (const btn of [...addTabBtns, ...deleteTabBtns]) {
      btn.classList.toggle('d-none', !isEditing);
    }

    for (const tabNameSpan of tabNameSpans) {
      if (isEditing) {
        tabNameSpan.setAttribute('contenteditable', true);
      } else {
        tabNameSpan.removeAttribute('contenteditable');
      }
    }

    return this;
  }

  _toggleTitleEditable(isEditable = true) {
    const designModalsTitles = document.querySelectorAll(
      '.design-modal .card-title'
    );
    const rootTitles = this.rootSelect('.card-title', true);
    const titles = [...new Set([...designModalsTitles, ...rootTitles])];

    for (const title of titles) {
      title.setAttribute(
        'contenteditable',
        isEditable ? 'plaintext-only' : false
      );
      this._bindTitleEvent(title);
    }

    return this;
  }

  _toggleToolbarConfig() {
    const modalConfigSwitch = this.toolbar.querySelector(
      '[name="layout-modal-config"]'
    );
    const modalIdConfigInput = this.toolbar.querySelector(
      '[name="layout-modalId-config"]'
    );
    const modalIdConfigField = modalIdConfigInput.closest('.form-floating');

    modalIdConfigField.classList.toggle('d-none', !modalConfigSwitch.checked);

    return this;
  }

  _toggleToolbarDisabled(isEnabled = true) {
    const addBtnNames = [
      'add-form',
      'add-table',
      'add-chart',
      'add-title',
      'add-tabpane'
    ];

    for (const name of addBtnNames) {
      const btn = this.toolbar.querySelector(`[name="${name}"]`);

      isEnabled
        ? btn.removeAttribute('disabled')
        : btn.setAttribute('disabled', 'disalbled');
    }

    return this;
  }
}

class FormEditor extends Core {
  constructor(config = {}) {
    super();

    this.container = this.getEl(config.container);
    this.nowForm = null;
    this.nowFieldBox = null;
    this.toolbar = null;
    this.designItems = config.designItems || {};
    this._eventHandler = {};
    this._sortableInstances = [];
    this._initState = 0; // 0: not init yet, 1: init complete

    if (!this.isEl(this.container)) {
      throw new Error('element container does not exist!');
    }
  }

  addForm(target) {
    target = target || this.container.querySelector('.layout-item.editing');

    if (!this.isEl(target)) {
      return this;
    }

    const form = this._createForm();
    target.append(form);

    this._toggleFormsFieldSortable(true);

    // trigger focus on the new form and it's first field
    setTimeout(() => {
      form.querySelector('.field').click();
    }, 0);

    return this;
  }

  deleteForm(form = this.nowForm) {
    if (!this.isEl(form)) {
      return;
    }

    const formSubmitBtn = this._getNowSubmitBtn(form);

    form.remove();
    formSubmitBtn?.remove();

    return this;
  }

  init() {
    this._initToolbar();
    this._initEventHandler();
    this._toggleEvent();
    this._initState = 1;

    return this;
  }

  toggleToolbar(isShow = true) {
    this.setToolbarPosition(this.nowForm);
    this.toolbar.classList.toggle('d-none', !isShow);
    return this;
  }

  _bindtoolbarEvent() {
    const toolbar = this.toolbar;
    this.bindFieldConfigEvent(toolbar);

    const idConfigInput = toolbar.querySelector('[name="form-id-config"]');
    idConfigInput.addEventListener('input', () => {
      if (!this.nowForm) {
        return;
      }

      this.nowForm.setAttribute('id', idConfigInput.value);
      const submitBtn = this._getNowSubmitBtn(this.nowForm);
      const idBadge = this.nowForm.querySelector('.id-badge');
      submitBtn?.setAttribute('form', idConfigInput.value);

      if (idBadge) {
        idBadge.textContent = idConfigInput.value;
      }
    });

    const classConfigInput = toolbar.querySelector(
      '[name="form-class-config"]'
    );
    classConfigInput.addEventListener('input', () => {
      this.nowForm?.setAttribute(
        'class',
        `form g-0 editing ${classConfigInput.value}`
      );
    });

    const sourceConfigInput = toolbar.querySelector(
      '[name="form-source-config"]'
    );
    sourceConfigInput.addEventListener('input', () => {
      if (!this.nowForm) {
        return;
      }

      this.nowForm.dataset.source = sourceConfigInput.value;
    });

    const SubformConfigInput = toolbar.querySelector(
      '[name="form-subform-config"]'
    );
    SubformConfigInput.addEventListener('input', () => {
      if (!this.nowForm) {
        return;
      }

      this.nowForm.dataset.subform = SubformConfigInput.value;
    });

    const tableConfigInput = toolbar.querySelector(
      '[name="form-table-config"]'
    );
    tableConfigInput.addEventListener('input', () => {
      if (!this.nowForm) {
        return;
      }

      this.nowForm.dataset.tableid = tableConfigInput.value;
    });

    const addFieldBtn = toolbar.querySelector('[name="add-field-btn"]');
    addFieldBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const typeConfigSelect = toolbar.querySelector(
        '[name="field-type-config"]'
      );
      const type = typeConfigSelect.value;
      const newFieldBox = this.addFieldBox(type, this.nowForm);
      newFieldBox.click();
    });

    const deleteFieldBtn = toolbar.querySelector('[name="delete-field-btn"]');
    deleteFieldBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.deleteFieldBox();
    });

    const deleteFormBtn = toolbar.querySelector('[name="delete-form-btn"]');
    deleteFormBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.deleteForm();
    });

    const submitContentInput = toolbar.querySelector(
      '[name="submit-content-config"]'
    );
    submitContentInput.addEventListener('input', () => {
      const nowSubmitBtn = this._getNowSubmitBtn(this.nowForm);

      if (!nowSubmitBtn) {
        return;
      }

      nowSubmitBtn.innerHTML = submitContentInput.value.trim();
    });

    const submitClassInput = toolbar.querySelector(
      '[name="submit-class-config"]'
    );
    submitClassInput.addEventListener('input', () => {
      const nowSubmitBtn = this._getNowSubmitBtn(this.nowForm);
      nowSubmitBtn?.setAttribute('class', submitClassInput.value);
    });

    const submitLinkInput = toolbar.querySelector(
      '[name="submit-link-config"]'
    );
    submitLinkInput.addEventListener('input', () => {
      const nowSubmitBtn = this._getNowSubmitBtn(this.nowForm);
      nowSubmitBtn?.setAttribute('href', submitLinkInput.value);
    });

    const addSubmitBtn = toolbar.querySelector('[name="add-submit-btn"]');
    addSubmitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const nowSubmitBtn = this._getNowSubmitBtn();

      if (nowSubmitBtn) {
        alert('Submit button already exists.');
        return;
      }

      const nowLayoutItem = this.container.querySelector(
        '.layout-item.editing'
      );
      const submitBtn = this._createSubmitBox(this.nowForm.getAttribute('id'));
      this._setSubmitConfig(submitBtn);

      nowLayoutItem?.insertBefore(submitBtn, this.nowForm.nextElementSibling);
    });

    return this;
  }

  _createForm() {
    const id = this.getOrderId('form');
    const idBadge = this.createIdBadge(id);
    const form = this.createEl(
      'form',
      {
        id,
        class: 'form g-0',
        'data-design': 'form',
        'data-source': ''
      },
      [idBadge]
    );

    const basicFieldTypes = ['text', 'select', 'radio'];

    for (const fieldType of basicFieldTypes) {
      this.addFieldBox(fieldType, form);
    }

    return form;
  }

  _createFormConfigBox() {
    const idInputBox = this.createFloatFieldBox(
      'text',
      'form-id-config',
      'Form ID'
    );
    const classInputBox = this.createFloatFieldBox(
      'text',
      'form-class-config',
      'Class Name'
    );
    const sourceInputBox = this.createFloatFieldBox(
      'text',
      'form-source-config',
      'Source'
    );
    const subformInputBox = this.createFloatFieldBox(
      'text',
      'form-subform-config',
      'Subform Connection'
    );
    const tableInputBox = this.createFloatFieldBox(
      'text',
      'form-table-config',
      'Table Connection'
    );

    const deleteFormBtn = this.createEl(
      'button',
      {
        class: 'delete-btn btn btn-danger mx-1 mt-2',
        name: 'delete-form-btn'
      },
      ['Delete Form']
    );

    const formConfigBox = this.createEl(
      'div',
      { class: 'd-flex flex-column flex-wrap form-config-box mb-3' },
      [
        idInputBox,
        classInputBox,
        sourceInputBox,
        subformInputBox,
        tableInputBox,
        deleteFormBtn
      ]
    );

    return formConfigBox;
  }

  _createSubmitBox(formId = '') {
    const submitBtn = this.createEl(
      'button',
      {
        type: 'submit',
        class: 'btn btn-primary',
        form: formId,
        disabled: 'disabled'
      },
      ['Submit']
    );

    const movingBar = this.createEl('div', {
      class: 'submit-moving-bar',
      'data-bs-toggle': 'tooltip',
      'data-bs-title': 'Drag Me!'
    });

    const submitBox = this.createEl('div', { class: 'submit-box p-2' }, [
      movingBar,
      submitBtn
    ]);

    return submitBox;
  }

  _createSubmitConfigBox() {
    const submitConfigLabel = this.createEl(
      'small',
      { class: 'text-muted mb-2' },
      ['Submit Config']
    );
    const BtnContentBox = this.createFloatFieldBox(
      'text',
      'submit-content-config',
      'Button Content'
    );
    const classInputBox = this.createFloatFieldBox(
      'text',
      'submit-class-config',
      'Class Name'
    );
    const linkInputBox = this.createFloatFieldBox(
      'text',
      'submit-link-config',
      'Link'
    );

    const addSubmitBtn = this.createEl(
      'button',
      {
        class: 'btn btn-primary mx-1 mt-2',
        name: 'add-submit-btn'
      },
      ['Add Submit']
    );
    const submitConfigBox = this.createEl(
      'div',
      { class: 'd-flex flex-column flex-wrap submit-config-box mb-3' },
      [
        submitConfigLabel,
        BtnContentBox,
        classInputBox,
        linkInputBox,
        addSubmitBtn
      ]
    );

    return submitConfigBox;
  }

  _getFormConfig(form = this.nowForm) {
    if (!this.isEl(form)) {
      console.warn('element form does not exist!');
      return {};
    }

    const formConfig = {};
    const formID = form.getAttribute('id');
    const classString = this._getFormModifiedClass(form);
    const source = form.dataset.source;
    const subformConnection = form.dataset.subform;
    const dataTableConnection = form.dataset.tableid;

    formConfig['form-id-config'] = formID;
    formConfig['form-class-config'] = classString;
    formConfig['form-source-config'] = source;
    formConfig['form-subform-config'] = subformConnection;
    formConfig['form-table-config'] = dataTableConnection;

    return formConfig;
  }

  _getFormModifiedClass(elOrString) {
    let classString = elOrString || '';

    if (this.isEl(elOrString)) {
      classString = elOrString.classList.value;
    }

    return classString
      .replace('form', '')
      .replace('g-0', '')
      .replace('editing', '')
      .trim();
  }

  _getNowSubmitBtn(nowForm = this.nowForm) {
    if (nowForm) {
      const nowLayoutItem = nowForm.closest('.layout-item');
      const nowSubmitBtn = nowLayoutItem.querySelector(
        `[form="${nowForm.getAttribute('id')}"]`
      );

      return nowSubmitBtn;
    }

    return null;
  }

  _initEventHandler() {
    this._eventHandler.bodyClick = (e) => {
      const clickedForm = e.target.closest('[data-design="form"]');
      const clickedFieldBox = e.target.closest('.field-box');
      const clickedToolbar = e.target.closest('.config-toolbar');

      if (clickedForm) {
        this._toggleNowForm(clickedForm);
        this._toggleNowFieldBox(clickedFieldBox);
        this.toggleToolbar(true);
      } else if (!clickedToolbar) {
        this._toggleNowForm(null);
        this._toggleNowFieldBox(null);
        this.toggleToolbar(false);
      }
    };

    return this;
  }

  _initToolbar() {
    const fieldConfigBox = this.createFieldConfigBox();
    const formConfigBox = this._createFormConfigBox();
    const submitConfigBox = this._createSubmitConfigBox();

    const addFieldBtn = this.createEl(
      'button',
      {
        class: 'btn btn-primary mx-1 mt-2',
        name: 'add-field-btn'
      },
      ['Add']
    );
    const deleteFieldBtn = this.createEl(
      'button',
      {
        class: 'delete-btn btn btn-danger mx-1 mt-2',
        name: 'delete-field-btn'
      },
      ['Delete']
    );

    const tabElObj = {
      Field: [fieldConfigBox, addFieldBtn, deleteFieldBtn],
      Form: [formConfigBox, submitConfigBox]
    };
    const tabPaneBox = this.createTabpaneBox(tabElObj);

    const toolbar = this.createEl(
      'div',
      { class: 'config-toolbar card form-toolbar d-none' },
      [tabPaneBox]
    );

    document.body.append(toolbar);
    this.toolbar = toolbar;
    this._bindtoolbarEvent();

    return this;
  }

  _setSubmitConfig(submitBtn) {
    const submitConfigBox = this.toolbar.querySelector('.submit-config-box');

    if (!this.isEl(submitBtn)) {
      this.clearFieldsData(submitConfigBox);
      return this;
    }

    const submitBtnConfig = {
      'submit-content-config': submitBtn.textContent.trim(),
      'submit-class-config': submitBtn.classList.value,
      'submit-link-config': submitBtn.getAttribute('href')
    };

    this.setFieldsData(submitConfigBox, submitBtnConfig);
    return this;
  }

  _setFormToolbarData(form = this.nowForm) {
    const toolbarFormConfigBox = this.toolbar.querySelector('.form-config-box');
    this.clearFieldsData(toolbarFormConfigBox);

    if (!this.isEl(form)) {
      return;
    }

    const formConfig = this._getFormConfig(form);
    const submitBtn = this._getNowSubmitBtn(form);

    this.setFieldsData(toolbarFormConfigBox, formConfig);
    this._setSubmitConfig(submitBtn);

    return this;
  }

  _toggleDisabledSubmitBtn(form, isDisabled = true) {
    if (!this.isEl(form)) {
      console.warn('element form does not exist!');
      return this;
    }

    const submitBtn = this._getNowSubmitBtn(form);

    if (isDisabled) {
      submitBtn?.setAttribute('disabled', 'disabled');
    } else {
      submitBtn?.removeAttribute('disabled');
    }

    return this;
  }

  _toggleEditMode(isEditing = true) {
    if (!this._initState) {
      this.init();
    }

    const forms = this.container.querySelectorAll('[data-design="form"]');

    this._toggleEvent(isEditing);
    this._toggleFormsFieldSortable(isEditing);

    // force to stop form's readonly mode and toggle submit button disabled state.
    for (const form of forms) {
      this.toggleFormReadOnly(form, false);
      this._toggleDisabledSubmitBtn(form, isEditing);
    }

    return this;
  }

  _toggleEvent(bind = true) {
    const { bodyClick } = this._eventHandler;
    bind === true
      ? document.body.addEventListener('click', bodyClick)
      : document.body.removeEventListener('click', bodyClick);

    return this;
  }

  _toggleFormsFieldSortable(isSortable = true) {
    if (isSortable) {
      this._sortableInstances = [];
      const forms = this.container.querySelectorAll('[data-design="form"]');

      for (const form of forms) {
        const sortableInstance = new Sortable(form, {
          handle: '.field-box',
          group: 'form',
          animation: 150,
          ghostClass: 'moving',
          onEnd: (e) => {
            const targetEl = e.to;
            const idBadge = targetEl.querySelector('.id-badge');

            if (targetEl.firstChild !== idBadge) {
              targetEl.insertBefore(idBadge, targetEl.firstChild);
            }
          }
        });

        this._sortableInstances.push(sortableInstance);
      }
    } else {
      for (const sortableInstance of this._sortableInstances) {
        sortableInstance.destroy();
      }
    }

    return this;
  }

  _toggleNowFieldBox(newFieldBox) {
    const lastFieldBox = this.nowFieldBox;
    lastFieldBox?.classList.remove('editing');

    this.nowFieldBox = newFieldBox;
    this.nowFieldBox?.classList.add('editing');
    this.setFieldToolbarData(this.nowFieldBox);

    return this;
  }

  _toggleNowForm(newForm) {
    const lastForm = this.nowForm;
    lastForm?.classList.remove('editing');

    this.nowForm = newForm;
    this.nowForm?.classList.add('editing');
    this._setFormToolbarData(this.nowForm);

    return this;
  }
}

class Form extends Core {
  constructor(config = {}) {
    super();

    this.el = config.el;
    this.id = config.id;
    this.source = config.source;
    this.dataIdKey = config.dataIdKey;
    this.designItems = config.designItems || {};
    this._eventHandler = {};

    this._init();
  }

  clean() {
    this.clearFieldsData(this.el);
    return this;
  }

  dispose() {
    this._toggleEvent(false);

    for (const attrName in this) {
      if (this.hasOwnProperty(attrName)) {
        this[attrName] = null;
      }
    }

    return null;
  }

  getData() {
    return this.getFieldsData(this.el);
  }

  getSubformData() {
    const formDataset = this.el.dataset;
    const subformsId = formDataset.subform?.split(',');

    if (!subformsId) {
      return [];
    }

    const subformsDatas = subformsId.map((subformId) => {
      const subformInstance = this.designItems[subformId];
      const subformData =
        subformInstance?.getData() || super.getSubformData(subformId);

      // sql need this, every rowData should have it's form's id, but the key name maybe need change*****
      return subformData.map((rowData) => {
        return { ...rowData, form: this.el.getAttribute('id') };
      });
    });

    return subformsDatas;
  }

  refreshInstance() {
    this.el = this.el || this.getEl(this.id, 'form');

    if (!this.isEl(this.el)) {
      throw new Error('Invalid form element!');
    }

    this.id = this.el.getAttribute('id');
    this.source = this.el.dataset.source;
    this.dataIdKey = this.el.dataset.idkey || 'idno';

    for (const designName in this.designItems) {
      if (this.designItems[designName] === this) {
        delete this.designItems[designName];
        this.designItems[this.id] = this;
      }
    }

    return this;
  }

  setData(data = []) {
    this.clean().setFieldsData(this.el, data);
    return this;
  }

  async load() {
    if (!this.source) {
      console.warn('source does not exist!');
      return this;
    }

    const datas = await super.getData(this.source, this.getUrlParams());
    this.setData(datas[0]);

    return this;
  }

  _toggleReadonlyBtnEvent(bind = true) {
    const { toggleReadonly } = this._eventHandler;
    const toggleEditBtns = this.el.querySelectorAll('.toggle-readonly');

    if (toggleEditBtns.length === 0) {
      return this;
    }

    for (const toggleEditBtn of toggleEditBtns) {
      bind === true
        ? toggleEditBtn.addEventListener('click', toggleReadonly)
        : toggleEditBtn.removeEventListener('click', toggleReadonly);
    }

    if (bind) {
      this.toggleFormReadOnly(this.el);
    }

    return this;
  }

  _initEventHandler() {
    this._eventHandler.submit = async (e) => {
      e.preventDefault();

      const formDataset = this.el.dataset;
      const data = this.getData();
      const subformDatas = this.getSubformData(); // if it has subform, but how subformDatas send to back side?*****

      if (this.source) {
        // if data[this.dataIdKey] exists, it is in the editing state.
        const source = data[this.dataIdKey]
          ? `${this.source}?${this.dataIdKey}=${data[this.dataIdKey]}`
          : this.source;
        const response = data[this.dataIdKey]
          ? await this.putData(source, data)
          : await this.postData(source, data);

        if (response) {
          alert('Success');

          const submitBtn = e.submitter;
          const submitHref = submitBtn.getAttribute('href');

          if (submitHref) {
            location.href = submitHref;
          }
        } else {
          alert('Fail');
        }
      } else {
        // without source
        alert(`${JSON.stringify(data)}, ${JSON.stringify(subformDatas)}`);
      }

      // If the form has a connection to a table
      if (formDataset.tableid) {
        const tableInstance = this.designItems[formDataset.tableid];
        tableInstance?.refresh();
      }
    };

    this._eventHandler.toggleReadonly = (e) => {
      e.preventDefault();
      this.toggleFormReadOnly(this.el);
    };

    return this;
  }

  _toggleEvent(bind = true) {
    const { submit } = this._eventHandler;

    bind === true
      ? this.el.addEventListener('submit', submit)
      : this.el.removeEventListener('submit', submit);

    this._toggleReadonlyBtnEvent(bind);

    return this;
  }

  async _init() {
    this.el = this.el || this.getEl(this.id, 'form');

    if (!this.isEl(this.el)) {
      throw new Error('Invalid form element!');
    }

    this.id = this.id || this.el.getAttribute('id');
    this.source = this.source || this.el.dataset.source;
    this.dataIdKey = this.dataIdKey || this.el.dataset.idkey || 'idno';
    this.treeSelects = await this.buildTreeselects(this.el);

    this._initEventHandler();
    this._toggleEvent(true);

    return this;
  }
}

class TableEditor extends Core {
  constructor(config = {}) {
    super();

    this.container = this.getEl(config.container);
    this.nowTable = null;
    this.nowTdBox = null;
    this.nowFieldBox = null;
    this.toolbar = null;
    this.designItems = config.designItems || {};
    this._eventHandler = {};
    this._sortableInstances = [];
    this._initState = 0; // 0: not init yet, 1: init complete

    if (!this.isEl(this.container)) {
      throw new Error('element container does not exist!');
    }
  }

  addTable(target) {
    target = target || this.container.querySelector('.layout-item.editing');

    if (!this.isEl(target)) {
      return this;
    }

    const tableBox = this._createTableBox();
    target.append(tableBox);

    // trigger focus on the new table and it's first field
    setTimeout(() => {
      tableBox.querySelector('.field').click();
    }, 0);

    return this;
  }

  deleteTableBox(table = this.nowTable) {
    if (!this.isEl(table)) {
      return this;
    }

    const tableBox = table.closest('.table-box');
    tableBox?.remove();

    return this;
  }

  init() {
    this._initEventHandler();
    this._initToolbar();
    this._toggleEvent();
    this._initState = 1;

    return this;
  }

  toggleToolbar(isShow = true) {
    this.setToolbarPosition(this.nowTable);
    this.toolbar.classList.toggle('d-none', !isShow);
    return this;
  }

  _bindtoolbarEvent() {
    const toolbar = this.toolbar;
    const bindSwitchAndInputDateset = (switchName, inputName, datasetName) => {
      const targetInput = toolbar.querySelector(
        `[name="table-${inputName}-config"]`
      );
      targetInput.addEventListener('input', () => {
        if (!this.nowTable) {
          return;
        }

        this.nowTable.dataset[datasetName] = targetInput.value;
      });

      const targetSwitch = toolbar.querySelector(
        `[name="table-${switchName}-config"]`
      );
      targetSwitch.addEventListener('change', () => {
        if (!this.nowTable) {
          return;
        }

        if (targetSwitch.checked !== true) {
          delete this.nowTable.dataset[datasetName];
          targetInput.value = '';
        }

        this._toggleBtnFieldConfig();
      });
    };

    this.bindFieldConfigEvent(toolbar);

    const typeConfigSelect = toolbar.querySelector(
      '[name="table-type-config"]'
    );
    typeConfigSelect.addEventListener('change', () => {
      if (!this.nowTable) {
        return;
      }

      this.nowTable.dataset.design = typeConfigSelect.value;
      this._toggleTableConfig();
      this._toggleTableFeature(this.nowTable);
    });

    const idConfigInput = toolbar.querySelector('[name="table-id-config"]');
    idConfigInput.addEventListener('input', () => {
      if (!this.nowTable) {
        return;
      }

      this.nowTable.id = idConfigInput.value;
      const idBadge = this.nowTable.parentNode.querySelector('.id-badge');

      if (idBadge) {
        idBadge.textContent = idConfigInput.value;
      }
    });

    const sourceConfigInput = toolbar.querySelector(
      '[name="table-source-config"]'
    );
    sourceConfigInput.addEventListener('input', () => {
      if (!this.nowTable) {
        return;
      }

      this.nowTable.dataset.source = sourceConfigInput.value;
    });

    const classConfigInput = toolbar.querySelector(
      '[name="table-class-config"]'
    );
    classConfigInput.addEventListener('input', () => {
      this.nowTable?.setAttribute(
        'class',
        `talbe w-100 editing ${classConfigInput.value}`
      );
    });

    const colsConfigInput = toolbar.querySelector('[name="table-cols-config"]');
    colsConfigInput.addEventListener('input', () => {
      colsConfigInput.value =
        colsConfigInput.value > 0 ? colsConfigInput.value : 1; // Minimum col length is limited to 1

      if (!this.nowTable) {
        return;
      }

      this._setColRowLength(this.nowTable, colsConfigInput.value, 'col');
    });

    const rowsConfigInput = toolbar.querySelector('[name="table-rows-config"]');
    rowsConfigInput.addEventListener('input', () => {
      rowsConfigInput.value =
        rowsConfigInput.value > 0 ? rowsConfigInput.value : 1; // Minimum row length is limited to 1

      if (!this.nowTable) {
        return;
      }

      this._setColRowLength(this.nowTable, rowsConfigInput.value, 'row');
    });

    // switch part
    const tableFilterSwitch = toolbar.querySelector(
      '[name="table-filter-config"]'
    );
    const tablePaginationSwitch = toolbar.querySelector(
      '[name="table-pagination-config"]'
    );
    const autoBuildSwitch = toolbar.querySelector(
      '[name="table-autobuild-config"]'
    );

    const switchObj = {
      filter: tableFilterSwitch,
      pagination: tablePaginationSwitch,
      autobuild: autoBuildSwitch
    };

    for (const datasetName in switchObj) {
      const switchEl = switchObj[datasetName];

      switchEl.addEventListener('change', () => {
        if (!this.nowTable) {
          return;
        }

        this.nowTable.dataset[datasetName] = switchEl.checked;
      });
    }

    bindSwitchAndInputDateset('addBtn', 'addLink', 'add');
    bindSwitchAndInputDateset('addByModal', 'addModalId', 'modaladd');
    bindSwitchAndInputDateset('editBtn', 'editLink', 'edit');
    bindSwitchAndInputDateset('editByModal', 'editModalId', 'modaledit');

    const addFieldBtn = toolbar.querySelector('[name="add-field-btn"]');
    addFieldBtn.addEventListener('click', (e) => {
      e.preventDefault();

      if (!this.nowTdBox) {
        return;
      }

      const typeConfigSelect = toolbar.querySelector(
        '[name="field-type-config"]'
      );
      const type = typeConfigSelect.value;
      const newFieldBox = this.addFieldBox(type, this.nowTdBox);

      newFieldBox.click();
    });

    const deleteFieldBtn = toolbar.querySelector('[name="delete-field-btn"]');
    deleteFieldBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.deleteFieldBox();
    });

    const deleteTableBtn = toolbar.querySelector('[name="delete-table-btn"]');
    deleteTableBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.deleteTableBox();
    });

    return this;
  }

  _createAddRowBox() {
    const addRowBtn = this.createEl(
      'button',
      { class: 'add-row btn btn-secondary btn-sm w-100', disabled: 'disabled' },
      ['Add']
    );
    const addRowTd = this.createEl(
      'td',
      { class: 'text-center', colspan: '100%' },
      [addRowBtn]
    );
    const addRowTr = this.createEl('tr', {}, [addRowTd]);
    const addRowBox = this.createEl('tfoot', { class: 'add-row-box' }, [
      addRowTr
    ]);

    return addRowBox;
  }

  _createBtnConfigBox() {
    const btnConfigLabel = this.createEl(
      'small',
      { class: 'text-muted mb-1' },
      ['Button Config']
    );

    const addNewBtnSwitchBox = this.createSwitchBox(
      'table-addBtn-config',
      'Add By Page'
    );
    const addNewLinkInputBox = this.createFloatFieldBox(
      'text',
      'table-addLink-config',
      'Add Page Link'
    );
    addNewLinkInputBox.classList.add('d-none');

    const addByModalBtnSwitchBox = this.createSwitchBox(
      'table-addByModal-config',
      'Add By Modal'
    );
    const addByModalIdInputBox = this.createFloatFieldBox(
      'text',
      'table-addModalId-config',
      'Add Modal ID'
    );
    addByModalIdInputBox.classList.add('d-none');

    const editBtnSwitchBox = this.createSwitchBox(
      'table-editBtn-config',
      'Edit By Page'
    );
    const editLinkInputBox = this.createFloatFieldBox(
      'text',
      'table-editLink-config',
      'Edit Page Link'
    );
    editLinkInputBox.classList.add('d-none');

    const editByModalBtnSwitchBox = this.createSwitchBox(
      'table-editByModal-config',
      'Edit By Modal'
    );
    const editByModalIdInputBox = this.createFloatFieldBox(
      'text',
      'table-editModalId-config',
      'Edit Modal ID'
    );
    editByModalIdInputBox.classList.add('d-none');

    const btnConfigBox = this.createEl(
      'div',
      { class: 'd-flex flex-column mt-3 btn-config-box' },
      [
        btnConfigLabel,
        addNewBtnSwitchBox,
        addNewLinkInputBox,
        addByModalBtnSwitchBox,
        addByModalIdInputBox,
        editBtnSwitchBox,
        editLinkInputBox,
        editByModalBtnSwitchBox,
        editByModalIdInputBox
      ]
    );

    return btnConfigBox;
  }

  _createDeleteRowTd() {
    const deleteRowBtn = this.createEl(
      'button',
      { class: 'delete-row btn btn-danger', disabled: 'disabled' },
      ['Delete']
    );
    const deleteRowBox = this.createEl(
      'td',
      { class: 'delete-row-box td-center' },
      [deleteRowBtn]
    );

    return deleteRowBox;
  }

  _createDeleteRowTh() {
    const deleteRowTh = this.createEl('th', { class: 'delete-row-th' });
    return deleteRowTh;
  }

  _createTableBody() {
    const tbodyEls = [];
    const repeatCount = 4;

    for (let i = 0; i < repeatCount; i++) {
      const td = this._createTableCell('td');
      tbodyEls.push(td);
    }

    const row = this._createTableCell('tr', {}, [...tbodyEls]);
    const tbody = this.createEl('tbody', {}, [row]);

    return tbody;
  }

  _createTableBox() {
    const id = this.getOrderId('table');
    const tableHeader = this._createTableHeader();
    const tableBody = this._createTableBody();
    const table = this.createEl(
      'table',
      {
        id,
        class: 'table w-100',
        'data-design': 'table',
        'data-idKey': 'idno',
        'data-filter': true,
        'data-pagination': true,
        'data-autobuild': false,
        'data-type': 'table',
        'data-source': ''
      },
      [tableHeader, tableBody]
    );

    const idBadge = this.createIdBadge(id);
    const wrapper = this.createEl('div', { class: 'resize-wrapper' }, [
      table,
      idBadge
    ]);
    const tableBox = this.createEl('div', { class: 'table-box' }, [wrapper]);

    return tableBox;
  }

  _createTableCell(type = 'td', attrs = {}, children = []) {
    switch (type) {
      case 'th':
        const thAttrs = { contentEditable: true };
        const thChildren = ['New Header'];
        attrs = { ...thAttrs, ...attrs };
        children = [...thChildren, ...children];
        break;

      case 'td':
        const tdFormEl = this.createEl('form', { class: 'td-box row g-0' });
        const tdChildren = [tdFormEl];
        this.addFieldBox('text', tdFormEl);
        // set td's content sortable
        this._sortableInstances.push(
          new Sortable(tdFormEl, {
            handle: '.field-box',
            group: 'form',
            animation: 150,
            ghostClass: 'moving'
          })
        );

        children = [...tdChildren, ...children];
        break;
    }

    const cell = this.createEl(type, attrs, children);
    return cell;
  }

  _createTableConfigBox() {
    const tableLabel = this.createEl('small', { class: 'text-muted mb-1' }, [
      'Table Config'
    ]);
    const typeSelectBox = this.createFloatFieldBox(
      'select',
      'table-type-config',
      'Table Type',
      [
        {
          Table: 'table'
        },
        {
          'Sub Form': 'subform'
        }
      ]
    );
    const idInputBox = this.createFloatFieldBox(
      'text',
      'table-id-config',
      'Table ID'
    );
    const sourceInputBox = this.createFloatFieldBox(
      'text',
      'table-source-config',
      'Source'
    );
    const classInputBox = this.createFloatFieldBox(
      'text',
      'table-class-config',
      'Class Name'
    );
    const colCountInputBox = this.createFloatFieldBox(
      'number',
      'table-cols-config',
      'Cols'
    );
    const rowCountInputBox = this.createFloatFieldBox(
      'number',
      'table-rows-config',
      'Rows'
    );
    const rowColBox = this.createEl(
      'div',
      { class: 'd-flex justify-content-between row-col-box' },
      [colCountInputBox, rowCountInputBox]
    );

    const filterSwitchBox = this.createSwitchBox(
      'table-filter-config',
      'Filter'
    );
    const paginationSwitchBox = this.createSwitchBox(
      'table-pagination-config',
      'Pagination'
    );
    const autoBuildSwitchBox = this.createSwitchBox(
      'table-autobuild-config',
      'Auto Build'
    );

    const deleteTableBtn = this.createEl(
      'button',
      {
        class: 'btn btn-danger mx-1 mt-2',
        name: 'delete-table-btn'
      },
      ['Delete Table']
    );

    const tableConfigBox = this.createEl(
      'div',
      { class: 'd-flex flex-column mt-3 table-config-box' },
      [
        tableLabel,
        typeSelectBox,
        idInputBox,
        sourceInputBox,
        classInputBox,
        rowColBox,
        filterSwitchBox,
        paginationSwitchBox,
        autoBuildSwitchBox,
        deleteTableBtn
      ]
    );

    return tableConfigBox;
  }

  _createTableHeader() {
    const theaderEls = [];
    const repeatCount = 4;

    for (let i = 0; i < repeatCount; i++) {
      theaderEls.push(this._createTableCell('th'));
    }

    const row = this._createTableCell('tr', {}, theaderEls);
    const theader = this._createTableCell('thead', {}, [row]);

    return theader;
  }

  _getBtnConfig(table = this.nowTable) {
    const btnConfig = {};

    if (!this.isEl(table)) {
      console.warn('element table does not exist!');
      return btnConfig;
    }

    const addLink = table.dataset.add;
    const addModalId = table.dataset.modaladd;
    const editLink = table.dataset.edit;
    const editModalId = table.dataset.modaledit;

    btnConfig['table-addBtn-config'] = addLink ? true : false;
    btnConfig['table-addLink-config'] = addLink;
    btnConfig['table-addByModal-config'] = addModalId ? true : false;
    btnConfig['table-addModalId-config'] = addModalId;
    btnConfig['table-editBtn-config'] = editLink ? true : false;
    btnConfig['table-editLink-config'] = editLink;
    btnConfig['table-editByModal-config'] = editModalId ? true : false;
    btnConfig['table-editModalId-config'] = editModalId;

    return btnConfig;
  }

  _getTableModifiedClass(elOrString) {
    let classString = elOrString || '';

    if (this.isEl(elOrString)) {
      classString = elOrString.classList.value;
    }

    return classString
      .replace('table', '')
      .replace('w-100', '')
      .replace('editing', '')
      .trim();
  }

  _getTableConfig(table = this.nowTable) {
    if (!this.isEl(table)) {
      console.warn('element table does not exist!');
      return {};
    }

    const tableConfig = {};
    const tbody = table.querySelector('tbody');
    const firstRow = tbody.querySelector('tr');
    const tableType = table.dataset.design;
    const id = table.id;
    const source = table.dataset.source;
    const classString = this._getTableModifiedClass(table);
    const filterSwitchValue = table.dataset.filter == 'true' ? true : false;
    const paginationSwitchValue =
      table.dataset.pagination == 'true' ? true : false;
    const autoBuildSwitchValue =
      table.dataset.autobuild == 'true' ? true : false;
    const colLength = firstRow.querySelectorAll(
      'td:not(.delete-row-box)'
    ).length;
    const rowLength = tbody.querySelectorAll('tr').length;

    tableConfig['table-type-config'] = tableType;
    tableConfig['table-id-config'] = id;
    tableConfig['table-source-config'] = source;
    tableConfig['table-class-config'] = classString;
    tableConfig['table-cols-config'] = colLength;
    tableConfig['table-rows-config'] = rowLength;
    tableConfig['table-filter-config'] = filterSwitchValue;
    tableConfig['table-pagination-config'] = paginationSwitchValue;
    tableConfig['table-autobuild-config'] = autoBuildSwitchValue;

    return tableConfig;
  }

  _initEventHandler() {
    this._eventHandler.bodyClick = (e) => {
      const clickedTable = e.target.closest(
        '[data-design="table"],[data-design="subform"]'
      );
      const clickedTdBox = e.target.closest('.td-box');
      const clickedFieldBox = e.target.closest('.field-box');
      const clickedToolbar = e.target.closest('.config-toolbar');

      if (clickedTable) {
        this._toggleNowTable(clickedTable);
        this._toggleNowTdBox(clickedTdBox);
        this._toggleNowFieldBox(clickedFieldBox);
        this.toggleToolbar(true);
      } else if (!clickedToolbar) {
        this._toggleNowTable(null);
        this._toggleNowTdBox(null);
        this._toggleNowFieldBox(null);
        this.toggleToolbar(false);
      }
    };

    return this;
  }

  _initToolbar() {
    const fieldConfigBox = this.createFieldConfigBox();
    const tableConfigBox = this._createTableConfigBox();
    const btnConfigBox = this._createBtnConfigBox();

    const addFieldBtn = this.createEl(
      'button',
      {
        class: 'btn btn-primary mx-1 mt-2',
        name: 'add-field-btn'
      },
      ['Add']
    );
    const deleteFieldBtn = this.createEl(
      'button',
      {
        class: 'delete-btn btn btn-danger mx-1 mt-2',
        name: 'delete-field-btn'
      },
      ['Delete']
    );

    const tabElObj = {
      Field: [fieldConfigBox, addFieldBtn, deleteFieldBtn],
      Table: tableConfigBox,
      Buttons: btnConfigBox
    };
    const tabPaneBox = this.createTabpaneBox(tabElObj);
    const tabNav = tabPaneBox.querySelector('.nav-tabs');
    tabNav.classList.add('flex-warp');
    tabNav.style.width = '160px';

    const toolbar = this.createEl(
      'div',
      {
        class: 'config-toolbar card table-toolbar d-none'
      },
      [tabPaneBox]
    );

    document.body.append(toolbar);
    this.toolbar = toolbar;
    this._bindtoolbarEvent();

    return this;
  }

  _setColRowLength(table = this.nowTable, value = 1, type = 'col') {
    const tbody = table?.querySelector('tbody');

    if (!tbody) {
      console.warn('elelment table or tablebody does not exist!');
      return this;
    }

    const rows = tbody.querySelectorAll('tr');

    if (type === 'col') {
      const theadTr = table.querySelector('thead>tr');
      const cols = theadTr.querySelectorAll('th:not(.delete-row-th)');
      const deleteRowTh = theadTr.querySelectorAll('.delete-row-th')[0];

      for (let i = 0; i < +value; i++) {
        if (i === value - 1 && cols[value]) {
          let exceedIndex = i + 1;

          while (cols[exceedIndex]) {
            cols[exceedIndex]?.remove();

            for (const row of rows) {
              const tds = row.querySelectorAll('td:not(.delete-row-box)');
              tds[exceedIndex]?.remove();
            }

            exceedIndex += 1;
          }
        }

        if (cols[i]) {
          continue;
        }

        const newTh = this._createTableCell('th');
        theadTr.insertBefore(newTh, deleteRowTh);

        for (const row of rows) {
          const deleteRowTd = row.querySelectorAll('.delete-row-box')[0];
          const newTd = this._createTableCell('td');
          row.insertBefore(newTd, deleteRowTd);
        }
      }
    } else if (type === 'row') {
      const firstRow = tbody.querySelector('tr');

      for (let i = 0; i < +value; i++) {
        if (i === value - 1 && rows[value]) {
          let exceedIndex = i + 1;

          while (rows[exceedIndex]) {
            rows[exceedIndex].remove();
            exceedIndex += 1;
          }
        }

        if (rows[i]) {
          continue;
        }

        const newRow = firstRow.cloneNode(true);
        const rowEditingItems = newRow.querySelectorAll('.editing');

        for (const editingItem of rowEditingItems)
          editingItem.classList.remove('editing');
        tbody.append(newRow);
      }
    }

    this._toggleTdContentSortable(true);

    return this;
  }

  _setTableToolBarData(table = this.nowTable) {
    const tableConfigBox = this.toolbar.querySelector('.table-config-box');
    const btnConfigBox = this.toolbar.querySelector('.btn-config-box');
    this.clearFieldsData(tableConfigBox);
    this.clearFieldsData(btnConfigBox);

    if (!this.isEl(table)) {
      return this;
    }

    const tableConfig = this._getTableConfig(table);
    const btnConfig = this._getBtnConfig(table);

    this.setFieldsData(tableConfigBox, tableConfig);
    this.setFieldsData(btnConfigBox, btnConfig);
    this._toggleTableConfig();
    this._toggleBtnFieldConfig();

    return this;
  }

  _toggleBtnFieldConfig() {
    const switchAndInputNameObj = {
      addBtn: 'addLink',
      addByModal: 'addModalId',
      editBtn: 'editLink',
      editByModal: 'editModalId'
    };

    for (const switchName in switchAndInputNameObj) {
      const targetSwitch = this.toolbar.querySelector(
        `[name="table-${switchName}-config"]`
      );
      const targetInput = this.toolbar.querySelector(
        `[name="table-${switchAndInputNameObj[switchName]}-config"]`
      );
      const targetConfigField = targetInput.closest('.form-floating');

      targetConfigField.classList.toggle('d-none', !targetSwitch.checked);
    }

    return this;
  }

  _toggleDatatableToTable(toTable = true) {
    const tableInstances = Object.values(this.designItems).filter(
      (designItem) => designItem instanceof Table
    );

    for (const tableInstance of tableInstances) {
      tableInstance._toggleDatatableToTable(toTable);
    }

    return this;
  }

  _toggleDisabledSubformBtn(isDisabled = true) {
    const subformInstances = Object.values(this.designItems).filter(
      (designItem) => designItem instanceof Subform
    );

    for (const subformInstance of subformInstances) {
      subformInstance._toggleDisabledSubformBtn(isDisabled);
    }

    return this;
  }

  _toggleEditMode(isEditing = true) {
    if (!this._initState) {
      this.init();
    }

    this._toggleDatatableToTable(isEditing);
    this._toggleEvent(isEditing);
    this._toggleTdContentSortable(isEditing);
    this._toggleDisabledSubformBtn(isEditing);
    this._toggleThEditable(isEditing);

    return this;
  }

  _toggleEvent(bind = true) {
    const { bodyClick } = this._eventHandler;
    bind === true
      ? document.body.addEventListener('click', bodyClick)
      : document.body.removeEventListener('click', bodyClick);

    return this;
  }

  _toggleNowTable(newTable) {
    const lastTable = this.nowTable;
    lastTable?.classList.remove('editing');

    this.nowTable = newTable;
    this.nowTable?.classList.add('editing');
    this._setTableToolBarData(this.nowTable);

    return this;
  }

  _toggleNowTdBox(newTdBox) {
    const lastTdBox = this.nowTdBox;
    lastTdBox?.classList.remove('editing');

    this.nowTdBox = newTdBox;
    this.nowTdBox?.classList.add('editing');

    return this;
  }

  _toggleNowFieldBox(newFieldBox) {
    const lastFieldBox = this.nowFieldBox;
    lastFieldBox?.classList.remove('editing');

    this.nowFieldBox = newFieldBox;
    this.nowFieldBox?.classList.add('editing');
    this.setFieldToolbarData(this.nowFieldBox);

    return this;
  }

  _toggleTableConfig() {
    const tableType = this.toolbar.querySelector(
      '[name="table-type-config"]'
    ).value;
    const tableConfigBox = this.toolbar.querySelector('.table-config-box');
    const tableConfigNames = [
      'source',
      'rows',
      'filter',
      'pagination',
      'autobuild'
    ];
    const isHidden = tableType === 'table';

    for (const configName of tableConfigNames) {
      const field = tableConfigBox.querySelector(
        `[name="table-${configName}-config"]`
      );
      const fieldBox = field.closest('.form-switch, .form-floating');
      fieldBox?.classList.toggle('d-none', !isHidden);
    }

    return this;
  }

  _toggleTableFeature(table = this.nowTable) {
    const tableType = table.dataset.design;
    const addRowBoxes = table.querySelectorAll('.add-row-box');
    const deleteRowBoxes = table.querySelectorAll(
      '.delete-row-box, .delete-row-th'
    );

    if (tableType === 'table') {
      for (const btnRowBox of [...addRowBoxes, ...deleteRowBoxes]) {
        btnRowBox.remove();
      }
    } else if (tableType === 'subform') {
      if (!addRowBoxes.length) {
        const addRowBox = this._createAddRowBox();
        table.append(addRowBox);
      }

      if (!deleteRowBoxes.length) {
        const deleteRowTd = this._createDeleteRowTd();
        const deleteRowTh = this._createDeleteRowTh();

        table.querySelector('thead>tr')?.append(deleteRowTh);
        table.querySelector('tbody>tr')?.append(deleteRowTd);
      }

      this._setColRowLength(table, 1, 'row');
    }

    return this;
  }

  _toggleTdContentSortable(isSortable = true) {
    if (isSortable) {
      this._sortableInstances = [];
      const tdBoxes = this.container.querySelectorAll('.td-box');

      for (const tdBox of tdBoxes) {
        const sortableInstance = new Sortable(tdBox, {
          handle: '.field-box',
          group: 'form',
          animation: 150,
          ghostClass: 'moving'
        });

        this._sortableInstances.push(sortableInstance);
      }
    } else {
      for (const sortableInstance of this._sortableInstances) {
        sortableInstance.destroy();
      }
    }

    return this;
  }

  _toggleThEditable(isEditable = true) {
    const subformInstances = Object.values(this.designItems).filter(
      (designItem) => designItem instanceof Subform
    );

    for (const subformInstance of subformInstances) {
      subformInstance._toggleThEditable(isEditable);
    }

    return this;
  }
}

class Table extends Core {
  constructor(config = {}) {
    super();

    this.el = config.el;
    this.id = config.id;
    this.data = [];
    this.source = config.source;
    this.dataIdKey = config.dataIdKey;
    this.isAutoBuild = null;
    this.tableBackup = null;
    this.dataTable = null;
    this.designItems = config.designItems || {};

    this._init();
  }

  dispose() {
    this.tableBackup?.remove();
    this.dataTable?.destroy();

    for (const attrName in this) {
      if (this.hasOwnProperty(attrName)) {
        this[attrName] = null;
      }
    }

    return null;
  }

  getDataTableConfig() {
    const columnsConfig = this.isAutoBuild
      ? this._getAutoBuildColumns()
      : this._getColumnsConfig();
    const tableDomConfig = this._getTableDomConfig();
    const tableBtnConfig = this._getTableBtnConfig();

    const dataTableConfig = {
      data: this.data,
      columns: columnsConfig,
      dom: tableDomConfig,
      buttons: tableBtnConfig,
      pageResize: true
    };

    return dataTableConfig;
  }

  getPreviewData(dataLength = 20) {
    const dataFormat = this._getDataFormat();
    const data = [];

    for (let i = 0; i < dataLength; i++) {
      const rowData = {};

      for (const dataName in dataFormat) {
        rowData[dataName] = this.getRandomValueByType(dataFormat[dataName]);
      }

      rowData[this.dataIdKey] = i + 1;
      data.push(rowData);
    }

    return data;
  }

  restoreTable() {
    const table = this.tableBackup;
    table.id = table.dataset.id;
    table.removeAttribute('data-id');
    table.classList.remove('d-none');
    this.el = table;
    this.tableBackup = null;

    return this;
  }

  renderDataTable() {
    const dataTableConfig = this.getDataTableConfig();
    this._backupTable();

    if (this.isAutoBuild) {
      this.el.innerHTML = '';
    }

    this.dataTable?.destroy();
    this.dataTable = new DataTable(`#${this.id}`, dataTableConfig);
    this.buildTreeselects(this.el);

    // When the datatable's page changes, ensure that the new page's treeselect works correctly.
    this.dataTable.on('page.dt', (e, settings) => {
      const newPageDom = settings.nTBody;

      setTimeout(() => {
        this.buildTreeselects(newPageDom);
      }, 0);
    });

    return this;
  }

  async refresh(rePullData = true) {
    if (rePullData && this.source) {
      this.data = await this.getData(this.source);
    } else {
      this.data = this.getPreviewData(this.data.length + 1);
    }

    this.dataTable.clear().rows.add(this.data).draw();

    return this;
  }

  async refreshInstance() {
    this.el = this.el || this.getEl(this.id);

    if (!this.isEl(this.el)) {
      throw new Error('Invalid table element!');
    }

    this.id = this.el.id;
    this.source = this.el.dataset.source;
    this.dataIdKey = this.el.dataset.idkey || 'idno';
    this.data = this.source
      ? await this.getData(this.source)
      : this.getPreviewData();
    this.isAutoBuild = this.el.dataset.autobuild === 'true' ? true : false;

    for (const designName in this.designItems) {
      if (this.designItems[designName] === this) {
        delete this.designItems[designName];
        this.designItems[this.id] = this;
      }
    }

    return this;
  }

  _backupTable() {
    const tableParentNode = this.el.parentNode;
    const oldTableBackup = this.tableBackup;
    const newTableBackup = this.el.cloneNode(true);

    if (newTableBackup.dataset.edit || newTableBackup.dataset.modaledit) {
      // Addressing issues arising from button column
      const thead = newTableBackup.querySelector('thead');
      const theadRow = thead.querySelector('tr');
      theadRow.lastChild.remove();
    }

    oldTableBackup?.remove();
    newTableBackup.dataset.id = newTableBackup.id;
    newTableBackup.id = '';
    newTableBackup.classList.add('d-none');
    this.tableBackup = newTableBackup;
    tableParentNode.insertBefore(this.tableBackup, tableParentNode.firstChild);

    return this;
  }

  _createBtnColumn() {
    const tableDatset = this.el.dataset;

    if (!tableDatset.edit || !tableDatset.modaledit) {
      return null;
    }

    const _this = this;
    const theadRow = this.el.querySelector('thead').querySelector('tr');
    const btnTh = this.createEl('th');
    const btnColumn = {
      title: '',
      render(data, type, rowData) {
        const idKeyName = tableDatset.idkey;
        const idKey = rowData[idKeyName];
        const editBtn = tableDatset.edit
          ? _this.createEl(
              'a',
              {
                class: 'btn btn-warning mx-1',
                href: `${tableDatset.edit}?${idKeyName}=${idKey}`
              },
              ['Edit']
            )
          : '';

        const editByModalBtn = tableDatset.modaledit
          ? _this.createEl(
              'button',
              {
                class: 'btn btn-warning mx-1',
                'data-bs-toggle': 'modal',
                'data-bs-target': `#${tableDatset.modaledit}`,
                'data-key': idKey
              },
              ['Edit By Modal']
            )
          : '';

        const renderBox = document.createElement('div');

        renderBox.append(editBtn);
        renderBox.append(editByModalBtn);

        return renderBox.innerHTML;
      }
    };

    theadRow.append(btnTh);
    return btnColumn;
  }

  _createColumn(thead, tableCell) {
    const _this = this;

    return {
      title: thead.textContent,
      render(data, type, rowData) {
        const renderHtml = tableCell.innerHTML;
        const renderBox = document.createElement('div');
        renderBox.innerHTML = renderHtml;

        _this.setFieldsData(renderBox, rowData);
        _this._handleRowEditBtn(renderBox, rowData);

        return renderBox.innerHTML;
      }
    };
  }

  _getAutoBuildColumns(data = this.data) {
    const columns = [];
    const dataObj = data[0];

    if (!dataObj) {
      return columns;
    }

    for (const name of Object.keys(dataObj)) {
      const column = { title: name, data: name };
      columns.push(column);
    }

    return columns;
  }

  _getColumnsConfig() {
    const columns = [];
    const theadRow = this.el.querySelector('thead').querySelector('tr');
    const theadCells = theadRow.querySelectorAll('th');
    const tableRow = this.el.querySelector('tbody').querySelector('tr');

    if (tableRow) {
      const tableCells = tableRow.querySelectorAll('td');

      for (let i = 0; i < theadCells.length; i++) {
        const column = this._createColumn(theadCells[i], tableCells[i]);
        columns.push(column);
      }
    }

    const btnColumn = this._createBtnColumn();

    if (btnColumn) {
      columns.push(btnColumn);
    }

    return columns;
  }

  _getDataFormat() {
    const dataFormat = {};
    const tbody = this.el.querySelector('tbody') || this.el;
    const row = tbody.querySelector('tr');

    if (!this.isEl(row)) {
      return dataFormat;
    }

    const rowFields = row.querySelectorAll('[name]');

    for (const field of rowFields) {
      const fieldName = field.getAttribute('name');
      const fieldType = this.getFieldType(field);

      if (Array.isArray(dataFormat[fieldName])) {
        dataFormat[fieldName].push(field.value);
      } else {
        if (fieldType === 'radios' || fieldType === 'checks') {
          dataFormat[fieldName] = [field.value];
        } else {
          dataFormat[fieldName] = fieldType;
        }
      }
    }

    return dataFormat;
  }

  _getTableDomConfig() {
    const tableDataset = this.el.dataset;
    const filterEnabled = tableDataset.filter !== 'false';
    const paginationEnabled = tableDataset.pagination !== 'false';

    const filterPart = filterEnabled ? 'f' : '';
    const paginationPart = paginationEnabled ? 'ip' : '';

    return `Bl${filterPart}t${paginationPart}r`;
  }

  _getTableBtnConfig() {
    const tableDataset = this.el.dataset;
    const btnConfig = [];

    if (tableDataset.add) {
      const addBtn = {
        text: 'Add',
        className: 'btn btn-primary mb-3',
        action: () => {
          location.href = tableDataset.add;
        }
      };
      btnConfig.push(addBtn);
    }

    if (tableDataset.modaladd) {
      const modalAddBtn = {
        text: 'Add By Modal',
        className: 'btn btn-primary mb-3',
        action: () => {
          const modal = new bootstrap.Modal(`#${tableDataset.modaladd}`);
          modal.show();
        }
      };
      btnConfig.push(modalAddBtn);
    }

    return btnConfig;
  }

  _handleRowEditBtn(renderBox, rowData) {
    const editBtns = renderBox.querySelectorAll('.edit-btn');

    for (const editBtn of editBtns) {
      const dataIdKey = this.dataIdKey;
      const dataIdValue = rowData[dataIdKey];

      if (editBtn.classList.contains('modal-edit')) {
        // for edit by modal***********(where is modal?)
        editBtn.dataset.idvalue = dataIdValue;
      } else {
        // for edit by other page
        editBtn.href = `${editBtn.href}?${dataIdKey}=${dataIdValue}`;
      }
    }
  }

  _toggleDatatableToTable(toTable = true) {
    if (toTable) {
      this.dataTable.destroy();
      this.el.remove();
      this.restoreTable();
    } else {
      this.renderDataTable();
    }

    return this;
  }

  async _init() {
    this.el = this.el || this.getEl(this.id);

    if (!this.isEl(this.el)) {
      throw new Error('Invalid table element!');
    }

    this.id = this.id || this.el.id;
    this.source = this.source || this.el.dataset.source;
    this.dataIdKey = this.dataIdKey || this.el.dataset.idkey || 'idno';
    this.isAutoBuild = this.el.dataset.autobuild === 'true' ? true : false;
    this.data = this.source
      ? await this.getData(this.source)
      : this.getPreviewData();
    this.renderDataTable(this.el, this.data);

    return this;
  }
}

class Subform extends Core {
  constructor(config = {}) {
    super();

    this.el = config.el;
    this.id = config.id;
    this.tableBody = null;
    this.row = null;
    this.rowCreated = config.rowCreated || null; // function triggered when row is created
    this.rowDelete = config.rowDelete || null; // function triggered when row is delete
    this.observer = null; // for MutationObserver
    this.designItems = config.designItems || {};
    this._eventHandler = {};

    this._init();
  }

  clearRow(row) {
    this.clearFieldsData(row);
    return this;
  }

  deleteRow(rowOrRowIndex) {
    const rows = this.tableBody.querySelectorAll('tr');

    if (rows.length <= 1) {
      console.log('Keep at least one row');
      return this;
    }

    const row = this.isEl(rowOrRowIndex) ? rowOrRowIndex : rows[+rowOrRowIndex];
    row?.remove();

    return row;
  }

  dispose() {
    this._toggleEvent(false);
    this.observer?.disconnect();

    return null;
  }

  getData() {
    return this.getSubformData(this.el);
  }

  refreshInstance() {
    this.el = this.el || this.getEl(this.id);

    if (!this.isEl(this.el)) {
      throw new Error('Invalid table element!');
    }

    this.id = this.el.id;
    this.tableBody = this.el.querySelector('tbody');
    this.row = this.tableBody?.querySelector('tr');

    for (const designName in this.designItems) {
      if (this.designItems[designName] === this) {
        delete this.designItems[designName];
        this.designItems[this.id] = this;
      }
    }

    return this;
  }

  setData(data = []) {
    this.setSubformData(this.el, data, async () => {
      await this.addRow();
    });
  }

  async addRow() {
    const newRow = this.row.cloneNode(true);
    this.tableBody.append(newRow);
    this._handleNewRdoAndChk(newRow);
    this.clearRow(newRow);

    return newRow;
  }

  _handleNewRdoAndChk(row) {
    const completeArray = [];
    const choiceEls = row.querySelectorAll('[type="radio"], [type="checkbox"]');

    for (const choiceEl of choiceEls) {
      const elName = choiceEl.name;

      if (completeArray.includes(elName)) {
        continue;
      } else {
        const random = this.getRandom();
        const newName = `${elName}_${random}`;
        const nowChoiceElGroup = row.querySelectorAll(`[name="${elName}"]`);

        for (const [index, nowChoiceEl] of nowChoiceElGroup.entries()) {
          const label = nowChoiceEl.closest('div').querySelector('label');
          nowChoiceEl.name = newName;
          nowChoiceEl.id = `${newName}_${index}`;
          label.setAttribute('for', nowChoiceEl.id);
        }

        completeArray.push(newName);
      }
    }

    return this;
  }

  _init() {
    this.el = this.el || this.getEl(this.id);

    if (!this.isEl(this.el)) {
      throw new Error('Invalid table element!');
    }

    this.id = this.id || this.el.id;
    this.tableBody = this.el.querySelector('tbody');
    this.row = this.tableBody?.querySelector('tr');

    if (!this.isEl(this.row)) {
      throw new Error('Invalid row element!');
    }

    this._initEventHandler();
    this._toggleEvent(true);
    this._registerLifeCycle();

    return this;
  }

  _initEventHandler() {
    this._eventHandler.addRowClick = (e) => {
      if (e.target.closest('.add-row')) {
        this.addRow();
      }
    };

    this._eventHandler.deleteRowClick = (e) => {
      if (e.target.closest('.delete-row')) {
        const row = e.target.closest('tr');
        this.deleteRow(row);
      }
    };

    return this;
  }

  _registerLifeCycle() {
    this.observer?.disconnect();

    this.observer = new MutationObserver((mutations) => {
      if (mutations[0].addedNodes[0]) {
        const newRow = mutations[0].addedNodes[0];

        if (newRow) {
          if (typeof this.rowCreated === 'function') {
            this.rowCreated(newRow);
          }
        }
      } else {
        const deleteRow = mutations[0].removedNodes[0];

        if (deleteRow && typeof this.rowDelete === 'function') {
          this.rowDelete(deleteRow);
        }
      }
    });

    this.observer.observe(this.tableBody, {
      childList: true
    });

    return this;
  }

  _toggleAddRowBtnEvent(bind = true) {
    const { addRowClick } = this._eventHandler;

    bind === true
      ? this.el.addEventListener('click', addRowClick)
      : this.el.removeEventListener('click', addRowClick);

    return this;
  }

  _toggleDeleteRowBtnEvent(bind = true) {
    const { deleteRowClick } = this._eventHandler;

    bind === true
      ? this.el.addEventListener('click', deleteRowClick)
      : this.el.removeEventListener('click', deleteRowClick);

    return this;
  }

  _toggleDisabledSubformBtn(isDisabled = true) {
    const subformBtns = this.el.querySelectorAll('.add-row, .delete-row');

    for (const subformBtn of subformBtns) {
      if (isDisabled) {
        subformBtn.setAttribute('disabled', 'disabled');
      } else {
        subformBtn.removeAttribute('disabled');
      }
    }

    return this;
  }

  _toggleEvent(bind = true) {
    this._toggleAddRowBtnEvent(bind);
    this._toggleDeleteRowBtnEvent(bind);

    return this;
  }

  _toggleThEditable(isEditable = true) {
    const theadTr = this.el.querySelector('thead>tr');
    const ths = theadTr.querySelectorAll('th');

    for (const th of ths) {
      th.setAttribute('contenteditable', isEditable);
    }

    return this;
  }
}

class Chart extends Core {
  constructor(config = {}) {
    super();

    this.el = config.el;
    this.id = config.id;
    this.source = config.source;
    this.chart = null;
    this.designItems = config.designItems || {};

    this._init();
  }

  dispose() {
    this.chart?.dispose();

    for (const attrName in this) {
      if (this.hasOwnProperty(attrName)) {
        this[attrName] = null;
      }
    }

    return null;
  }

  async refreshInstance() {
    this.el = this.el || this.getEl(this.id);

    if (!this.isEl(this.el)) {
      throw new Error('Invalid chart element!');
    }

    this.id = this.el.id;
    this.source = this.el.dataset.source;
    this.chart?.dispose();
    this.chart = await this.renderChart(this.el);

    for (const designName in this.designItems) {
      if (this.designItems[designName] === this) {
        delete this.designItems[designName];
        this.designItems[this.id] = this;
      }
    }

    return this;
  }

  async _init() {
    this.el = this.el || this.getEl(this.id);

    if (!this.isEl(this.el)) {
      throw new Error('Invalid chart element!');
    }

    this.id = this.id || this.el.id;
    this.source = this.source || this.el.dataset.source;
    this.chart = await this.renderChart(this.el);

    return this;
  }
}

class ChartEditor extends Core {
  constructor(config = {}) {
    super();

    this.container = this.getEl(config.container);
    this.nowChartBox = null;
    this.toolbar = null;
    this.designItems = config.designItems || {};
    this._eventHandler = {};
    this._initState = 0; // 0: not init yet, 1: init complete

    if (!this.isEl(this.container)) {
      throw new Error('element container does not exist!');
    }
  }

  addChart(target) {
    target = target || this.container.querySelector('.layout-item.editing');

    if (!this.isEl(target)) {
      return this;
    }

    const chartBox = this._createChartBox();
    target.append(chartBox);
    this.renderChart(chartBox);

    // trigger focus on the new Chart
    setTimeout(() => {
      chartBox.click();
    }, 0);

    return this;
  }

  deleteChartBox(chartBox = this.nowChartBox) {
    if (!this.isEl(chartBox)) {
      return this;
    }

    chartBox.remove();

    return this;
  }

  getChartElByBox(chartBox = this.nowChartBox) {
    if (!this.isEl(chartBox)) {
      return null;
    }

    return chartBox.classList.contains('echart')
      ? chartBox
      : chartBox.querySelector('.echart');
  }

  init() {
    this._initEventHandler();
    this._initToolbar();
    this._toggleEvent(true);
    this._initState = 1;

    return this;
  }

  toggleToolbar(isShow = true) {
    this.toolbar.classList.toggle('d-none', !isShow);
    return this;
  }

  _bindToolbarEvent() {
    const toolbar = this.toolbar;
    const inputConfigNames = ['name', 'subname', 'size'];
    const selectConfigNames = ['source', 'category', 'catename', 'valuename'];
    const configNames = [...inputConfigNames, ...selectConfigNames];

    for (const configName of configNames) {
      const configField = toolbar.querySelector(
        `[name="chart-${configName}-config"]`
      );
      const eventType = inputConfigNames.includes(configName)
        ? 'input'
        : 'change';

      configField?.addEventListener(eventType, () => {
        if (!this.nowChartBox) {
          return;
        }

        const nowChartEl = this.getChartElByBox(this.nowChartBox);
        nowChartEl.dataset[configName] = configField.value;
        this.renderChart(nowChartEl);
      });
    }

    // The above are related to dataset only.
    const typeConfigSelect = toolbar.querySelector(
      '[name="chart-type-config"]'
    );
    typeConfigSelect.addEventListener('change', () => {
      if (!this.nowChartBox) {
        return;
      }

      const nowChartEl = this.getChartElByBox(this.nowChartBox);
      nowChartEl.dataset.chart = typeConfigSelect.value;
      this._toggleChartConfig();
      this.renderChart(nowChartEl);
    });

    const idConfigInput = toolbar.querySelector('[name="chart-id-config"]');
    idConfigInput.addEventListener('input', () => {
      if (!this.nowChartBox) {
        return;
      }

      const nowChartEl = this.getChartElByBox(this.nowChartBox);
      const idBadge = this.nowChartBox.querySelector('.id-badge');
      nowChartEl.id = idConfigInput.value;

      if (idBadge) {
        idBadge.textContent = idConfigInput.value;
      }
    });

    const classConfigInput = toolbar.querySelector(
      '[name="chart-class-config"]'
    );
    classConfigInput.addEventListener('input', () => {
      if (!this.nowChartBox) {
        return;
      }

      const nowChartEl = this.getChartElByBox(this.nowChartBox);
      nowChartEl.setAttribute(
        'class',
        `echart editing ${classConfigInput.value}`
      );
    });

    const deleteChartBtn = toolbar.querySelector('[name="delete-chart-btn"]');
    deleteChartBtn.addEventListener('click', () => {
      this.deleteChartBox();
    });

    return this;
  }

  _createChartBox(config = {}) {
    const chartId = config.id || this.getOrderId('chart');
    const idBadge = this.createIdBadge(chartId);
    const chartAttrs = {
      id: chartId,
      class: `echart ${config.class || ''}`,
      style: `min-height: 400px;height: ${config.height || 400}px;`,
      'data-design': 'chart',
      'data-chart': config.type || 'line',
      'data-catename': config.catename || 'name',
      'data-valuename': config.valuename || 'value',
      'data-category': config.category || 'x',
      'data-source': config.source || '',
      'data-name': config.name || '',
      'data-subname': config.subname || '',
      'data-size': config.size || 50
    };

    const chartEl = this.createEl('div', chartAttrs);
    const chartBox = this.createEl('div', { class: 'chart-box' }, [
      idBadge,
      chartEl
    ]);

    return chartBox;
  }

  _getChartConfig(chartBox = this.nowChartBox) {
    if (!this.isEl(chartBox)) {
      console.warn('element chartBox does not exist!');
      return {};
    }

    const chartEl = this.getChartElByBox(this.nowChartBox);
    const chartConfig = {};
    const chartClass = this._getChartModifiedClass(chartEl);
    const chartDataset = chartEl.dataset;
    const chartId = chartEl.id;

    for (const configName in chartDataset) {
      if (configName === 'chart') {
        // dataset.chart is irregular, it's mean chart's type.
        chartConfig['chart-type-config'] = chartDataset[configName];
      } else {
        chartConfig[`chart-${configName}-config`] = chartDataset[configName];
      }
    }

    chartConfig['chart-class-config'] = chartClass;
    chartConfig['chart-id-config'] = chartId;

    return chartConfig;
  }

  _getChartModifiedClass(elOrString) {
    let classString = elOrString || '';

    if (this.isEl(elOrString)) {
      classString = elOrString.classList.value;
    }

    return classString.replace('echart', '').replace('editing', '').trim();
  }

  _initEventHandler() {
    this._eventHandler.bodyClick = (e) => {
      if (e.target.closest('.chart-toolbar')) {
        return;
      }

      const cilckChartBox = e.target.closest('.chart-box');
      const needToggle = cilckChartBox && cilckChartBox !== this.nowChartBox;

      this.toggleToolbar(needToggle);
      this._toggleNowChartBox(needToggle ? cilckChartBox : null);
      this.setToolbarPosition(this.nowChartBox);
    };

    return this;
  }

  _initToolbar() {
    const chartIdInputBox = this.createFloatFieldBox(
      'text',
      'chart-id-config',
      'Chart ID'
    );
    const typeSelectBox = this.createFloatFieldBox(
      'select',
      'chart-type-config',
      'Chart Type',
      ['line', 'bar', 'area', 'pie']
    );
    const sourceSelectBox = this.createFloatFieldBox(
      'select',
      'chart-source-config',
      'Source',
      [] // ***********
    );
    const categorySelectBox = this.createFloatFieldBox(
      'select',
      'chart-category-config',
      'Category Axis',
      ['x', 'y']
    );
    const cateNameSelectBox = this.createFloatFieldBox(
      'select',
      'chart-catename-config',
      'Category Name',
      []
    );
    const valuenameSelectBox = this.createFloatFieldBox(
      'select',
      'chart-valuename-config',
      'Value Name',
      []
    );
    const chartNameInputBox = this.createFloatFieldBox(
      'text',
      'chart-name-config',
      'Chart Name'
    );
    const subNameInputBox = this.createFloatFieldBox(
      'text',
      'chart-subname-config',
      'Sub Name'
    );
    const sizeInputBox = this.createFloatFieldBox(
      'number',
      'chart-size-config',
      'Size'
    );
    const chartClassInputBox = this.createFloatFieldBox(
      'text',
      'chart-class-config',
      'Class Name'
    );
    const deleteChartBtn = this.createEl(
      'button',
      { class: 'btn btn-danger mx-1 mt-2', name: 'delete-chart-btn' },
      ['Delete Chart']
    );

    const tabElObj = {
      Chart: [
        chartIdInputBox,
        typeSelectBox,
        sourceSelectBox,
        categorySelectBox,
        cateNameSelectBox,
        valuenameSelectBox,
        chartNameInputBox,
        subNameInputBox,
        sizeInputBox,
        chartClassInputBox,
        deleteChartBtn
      ]
    };
    const tabPaneBox = this.createTabpaneBox(tabElObj);

    const toolbar = this.createEl(
      'div',
      { class: 'config-toolbar card chart-toolbar d-none' },
      [tabPaneBox]
    );

    document.body.append(toolbar);
    this.toolbar = toolbar;
    this._bindToolbarEvent();

    return this;
  }

  _setChartToolbarData(chartBox = this.nowChartBox) {
    this.clearFieldsData(this.toolbar);

    if (!this.isEl(chartBox)) {
      return;
    }

    const chartConfig = this._getChartConfig(chartBox);
    this.setFieldsData(this.toolbar, chartConfig);
    this._toggleChartConfig();

    return this;
  }

  _toggleEditMode(isEditing = true) {
    if (this._initState === 0) {
      this.init();
    }

    this._toggleEvent(isEditing);

    return this;
  }

  _toggleEvent(bind = true) {
    const { bodyClick } = this._eventHandler;

    bind === true
      ? document.body.addEventListener('click', bodyClick)
      : document.body.removeEventListener('click', bodyClick);

    return this;
  }

  _toggleNowChartBox(newChartBox) {
    const lastChartBox = this.nowChartBox;
    lastChartBox?.classList.remove('editing');

    this.nowChartBox = newChartBox;
    this.nowChartBox?.classList.add('editing');
    this._setChartToolbarData(this.nowChartBox);

    return this;
  }

  _toggleChartConfig() {
    const toogleFieldsByNames = (names, isShow) => {
      for (const name of names) {
        const field = this.toolbar.querySelector(`[name="${name}"]`);
        const fieldBox = field?.closest('.form-floating');

        fieldBox?.classList.toggle('d-none', !isShow);
      }
    };

    const fieldeNames = [
      'chart-name-config',
      'chart-subname-config',
      'chart-size-config',
      'chart-catename-config',
      'chart-valuename-config',
      'chart-category-config'
    ];

    toogleFieldsByNames(fieldeNames, false);

    const type = this.toolbar.querySelector('[name="chart-type-config"]').value;
    const fieldShowNames = [];

    switch (type) {
      case 'line':
      case 'bar':
      case 'area':
        fieldShowNames.push(
          'chart-catename-config',
          'chart-valuename-config',
          'chart-category-config'
        );
        break;
      case 'pie':
        fieldShowNames.push(
          'chart-name-config',
          'chart-subname-config',
          'chart-size-config'
        );
        break;
    }

    toogleFieldsByNames(fieldShowNames, true);

    return this;
  }
}

class Menu extends Core {
  constructor(config = {}) {
    super();

    this.data = config.data || [];
    this.editMode = config.editMode;
    this.el = config.el;
    this.id = config.id;
    this.menuEditor = null;
    this.nowMenuItem = null;
    this.saveCallback = config.saveCallback;
    this.source = config.source;
    this.toolbar = null;
    this._eventHandler = {};

    this._init();
  }

  click(indexOrHash = 0) {
    const navLinks = this.el.querySelectorAll('.nav-link');

    if (!isNaN(indexOrHash)) {
      navLinks[indexOrHash]?.click();
    } else {
      for (const navLink of navLinks) {
        const link = navLink
          .getAttribute('href')
          .replace('#', '')
          .toLowerCase();
        const hash = indexOrHash?.toLowerCase();

        if (hash === link) {
          navLink.click();
        }
      }
    }

    return this;
  }

  initEditor() {
    this.menuEditor.empty();
    this.menuEditor.setArray(this.data);
    this.menuEditor.mount();

    if (this.editMode === true) {
      this._initMenuEditSwitch(true);
    }

    this.toggleToolbar(true);

    return this;
  }

  render() {
    const sidebar = this._convertDataToDom(this.data);
    this.el.innerHTML = '';
    this.el.append(sidebar);

    if (this.editMode === true) {
      this._initMenuEditSwitch(false);
    }

    this.toggleToolbar(false);

    return this;
  }

  saveMenu() {
    if (!this.source) {
      return this;
    }

    this.postData(this.source, this.data).then(() => {
      if (typeof this.saveCallback === 'function') {
        this.saveCallback(this.data);
      }
    });

    return this;
  }

  toggleToolbar(isShow = true) {
    this.toolbar.classList.toggle('d-none', !isShow);
    return this;
  }

  _bindToolbarEvent() {
    const toolbar = this.toolbar;

    const configInputNames = [
      'menu-text-config',
      'menu-icon-config',
      'menu-link-config'
    ];

    for (const name of configInputNames) {
      const configInput = this.toolbar.querySelector(`[name="${name}"]`);

      configInput?.addEventListener('input', () => {
        this._updateMenuData();
      });
    }

    const addBtn = toolbar.querySelector('[name="add-menu"]');
    addBtn.addEventListener('click', () => {
      const data = this.getFieldsData(toolbar);
      const itemData = this._convertDataFormat(data);

      this.menuEditor.add(itemData);
      const menuItems = this.el.querySelectorAll('.list-group-item');
      const newItem = menuItems[menuItems.length - 1];

      newItem.querySelector('.btn').click(); // trigger editing
    });
  }

  _convertDataFormat(data = {}) {
    if ('text' in data) {
      return {
        'menu-text-config': data.text,
        'menu-icon-config': data.icon,
        'menu-link-config': data.href,
        'menu-tooltip-config': data.tooltip
      };
    } else {
      return {
        text: data['menu-text-config'],
        icon: data['menu-icon-config'],
        href: data['menu-link-config'],
        tooltip: data['menu-tooltip-config']
      };
    }
  }

  _convertDataToDom(data = this.data) {
    const sidebar = this.createEl('ul', {
      class: 'sidebar-nav',
      id: 'sidebar-nav'
    });

    for (const item of data) {
      const childUlid = `nav-${this.getRandom()}`;
      const iconEl = this.createEl('i', { class: item.icon });
      const textEl = this.createEl('span', {}, [item.text]);
      const aEl = this.createEl(
        'a',
        {
          class: 'nav-link collapsed',
          href: item.href,
          'data-bs-target': `#${childUlid}`,
          'data-bs-toggle': 'collapse'
        },
        [iconEl, textEl]
      );

      if (item.children.length === 0) {
        delete aEl.dataset.bsTarget;
        delete aEl.dataset.bsToggle;
      }

      const liEl = this.createEl('li', { class: 'nav-item' }, [aEl]);

      if (item.children?.length) {
        const downIconEl = this.createEl('i', {
          class: 'bi bi-chevron-right ms-auto'
        });
        const childUlEl = this.createEl('ul', {
          id: childUlid,
          class: 'nav-content collapse',
          'data-bs-parent': '#sidebar-nav'
        });

        aEl.append(downIconEl);
        liEl.append(childUlEl);

        for (const childItem of item.children) {
          const childIconEl = this.createEl('i', { class: childItem.icon });
          const childTextEl = this.createEl('span', {}, [childItem.text]);
          const childAEl = this.createEl(
            'a',
            {
              class: 'nav-link',
              href: childItem.href
            },
            [childIconEl, childTextEl]
          );
          const childLiEl = this.createEl('li', { class: 'nav-item' }, [
            childAEl
          ]);

          childUlEl.append(childLiEl);
        }
      }

      sidebar.append(liEl);
    }

    return sidebar;
  }

  _init() {
    this.el = this.el || this.getEl(this.id);

    if (!this.isEl(this.el)) {
      throw new Error('Invalid menu element!');
    }

    this.id = this.id || this.el.getAttribute('id');
    this._initMenuEditor();
    this._initToolbar();
    this.render();

    return this;
  }

  _initMenuEditor() {
    this.menuEditor = new MenuEditor('sidebar', { maxLevel: 1 });

    this.menuEditor.onClickDelete((event) => {
      if (
        confirm(
          'Do you want to delete the item ' + event.item.getDataset().text
        )
      ) {
        event.item.remove();
      }
    });

    this.menuEditor.onClickEdit((event) => {
      const menuItem = event.item;
      const itemData = menuItem.getDataset();
      this._setToolbarData(itemData);
      this.nowMenuItem = menuItem;
      this.menuEditor.edit(this.nowMenuItem); // set the item in edit mode
      this._toggleNowMenuItemClass();
    });
  }

  _initMenuEditSwitch(isChecked = false) {
    const menuEditSwitchBox = this.createSwitchBox(
      'menu-edit-config',
      'Edit Menu'
    );
    const menuEditSwitch = menuEditSwitchBox.querySelector('input');
    menuEditSwitch.checked = isChecked;

    menuEditSwitchBox.classList.add(
      'position-absolute',
      'bottom-0',
      'end-0',
      'm-3'
    );
    menuEditSwitch.addEventListener('change', () => {
      if (menuEditSwitch.checked === true) {
        this.initEditor();
      } else {
        menuEditSwitchBox.remove(); // Prevent it from being included in the menu editor.
        this.data = JSON.parse(this.menuEditor.getString());
        this.saveMenu();
        this.render();
      }
    });

    this.el.append(menuEditSwitchBox);

    return this;
  }

  _initToolbar() {
    const textInputBox = this.createFloatFieldBox(
      'text',
      'menu-text-config',
      'Text'
    );
    const iconInputBox = this.createFloatFieldBox(
      'text',
      'menu-icon-config',
      'Icon'
    );
    const linkInputBox = this.createFloatFieldBox(
      'text',
      'menu-link-config',
      'Link'
    );
    const tooltipInputBox = this.createFloatFieldBox(
      'text',
      'menu-tooltip-config',
      'Tooltip'
    );
    const addBtn = this.createEl(
      'button',
      {
        class: 'btn btn-primary mb-1',
        name: 'add-menu'
      },
      ['Add']
    );

    const toolbar = this.createEl(
      'div',
      { class: 'config-toolbar card menu-toolbar position-fixed d-none' },
      [
        textInputBox,
        iconInputBox,
        linkInputBox,
        // tooltipInputBox, // When needed, open it *****
        addBtn
      ]
    );

    document.body.append(toolbar);
    this.toolbar = toolbar;
    this.setToolbarPosition(this.el);
    toolbar.style.top = `${parseInt(toolbar.style.top) + 20}px`;
    this._bindToolbarEvent();

    return this;
  }

  _setToolbarData(itemData = {}) {
    const data = this._convertDataFormat(itemData);

    this.clearFieldsData(this.toolbar);
    this.setFieldsData(this.toolbar, data);

    return this;
  }

  _toggleNowMenuItemClass(menuItem = this.nowMenuItem) {
    const lastEditingItem = this.el.querySelector('.editing');
    lastEditingItem?.classList.remove('editing');

    if (!menuItem) {
      return;
    }

    const menuItemEl = menuItem.element;
    menuItemEl.firstChild.classList.add('editing');

    return this;
  }

  _updateMenuData() {
    const data = this.getFieldsData(this.toolbar);
    const itemData = this._convertDataFormat(data);

    this.menuEditor.update(itemData);
    this.menuEditor.edit(this.nowMenuItem); // set the item in edit mode

    return this;
  }
}

class Title extends Core {
  constructor(config) {
    super();

    this.container = config.container;
    this.el = config.el;
    this.nowBreadItem = null;
    this.toolbar = null;
    this._eventHandler = {};
    this._sortableInstence = null;

    if (!this.isEl(this.container)) {
      throw new Error('element container does not exist!');
    }

    this._init();
  }

  addBreadItem() {
    const newBreadItem = this._createBreadcrumbItem();
    const breadItemBox = this.toolbar.parentNode;

    breadItemBox.insertBefore(newBreadItem, this.toolbar);
    newBreadItem.click();

    return this;
  }

  deleteBreadItem(breadItem = this.nowBreadItem) {
    const nearBreadItem =
      breadItem?.previousElementSibling || breadItem?.nextElementSibling;

    breadItem?.remove();
    nearBreadItem?.click();

    return this;
  }

  _createBreadcrumbItem() {
    const aEl = this.createEl('a', { contenteditable: true }, ['New Item']);
    const breadcrumbItem = this.createEl('li', { class: 'breadcrumb-item' }, [
      aEl
    ]);

    return breadcrumbItem;
  }

  _createPageTitleEl() {
    const bigTitle = this.createEl('h1', {}, ['New Title']);
    const breadcrumbItem = this._createBreadcrumbItem();
    const breadcrumbBox = this.createEl('div', { class: 'breadcrumb' }, [
      breadcrumbItem
    ]);
    const navEl = this.createEl('nav', {}, [breadcrumbBox]);
    const pageTitleEl = this.createEl('div', { class: 'pagetitle w-100' }, [
      bigTitle,
      navEl
    ]);

    return pageTitleEl;
  }

  _getBreadItemConfig(breadItem = this.nowBreadItem) {
    const breadItemConfig = {};

    if (!breadItem) {
      return breadItemConfig;
    }

    const aEl = breadItem.querySelector('a');
    const isActive = breadItem.classList.contains('active') ? 'active' : null;
    const link = aEl.getAttribute('href') || '';

    breadItemConfig['title-active-config'] = isActive;
    breadItemConfig['title-link-config'] = link;

    return breadItemConfig;
  }

  _init() {
    this.el = this.el || this.getEl(this.id);

    if (!this.isEl(this.el)) {
      const pageTitleEl = this._createPageTitleEl();
      this.el = pageTitleEl;
      this.container.insertBefore(pageTitleEl, this.container.firstChild);
    }

    this._initEventHandler();
    this._initToolbar();

    return this;
  }

  _initEventHandler() {
    this._eventHandler.elClick = (e) => {
      const clickedBreadItem = e.target.closest('.breadcrumb-item');
      const clickedToolbar = e.target.closest('.title-toolbar');
      const addBreadItemBtn = e.target.closest('.add-bread-item');
      const deleteBreadItemBtn = e.target.closest('.delete-bread-item');

      if (addBreadItemBtn) {
        this.addBreadItem();
      }

      if (deleteBreadItemBtn) {
        this.deleteBreadItem();
      }

      if (!clickedToolbar) {
        this._toggleNowBreadItem(clickedBreadItem);
        this._setToolbarData(clickedBreadItem);
      }
    };

    this._eventHandler.elInput = (e) => {
      if (!this.nowBreadItem) {
        return;
      }

      const field = e.target;

      if (field.name === 'title-active-config') {
        this.nowBreadItem.classList.toggle('active', field.checked);
      }

      if (field.name === 'title-link-config') {
        const aEl = this.nowBreadItem.querySelector('a');
        aEl.href = field.value;
      }
    };
  }

  _initToolbar() {
    this.toolbar = this.el.querySelector('.title-toolbar');

    if (this.toolbar) {
      return;
    }

    const linkLabel = this.createEl('small', { class: 'text-muted mx-1' }, [
      'Link:'
    ]);
    const linkInput = this.createFieldByType('text', 'title-link-config');
    linkInput.style.width = '100px';
    linkInput.style.height = '1.4rem';
    linkInput.classList.add('mx-1');

    const activeCheckbox = this.createFieldByType(
      'checkbox',
      'title-active-config',
      ['active']
    );

    const addItemBtn = this.createEl(
      'button',
      { class: 'btn btn-primary btn-exsm add-bread-item mx-1' },
      ['Add']
    );
    const deleteItemBtn = this.createEl(
      'button',
      { class: 'btn btn-danger btn-exsm delete-bread-item mx-1' },
      ['Delete']
    );

    const toolbar = this.createEl(
      'div',
      { class: 'title-toolbar d-flex d-none mx-3' },
      [linkLabel, linkInput, activeCheckbox, addItemBtn, deleteItemBtn]
    );

    this.toolbar = toolbar;
    this.el.querySelector('.breadcrumb').append(toolbar);

    return this;
  }

  _setToolbarData(breadItem = this.nowBreadItem) {
    const toolbar = this.toolbar;
    this.clearFieldsData(toolbar);

    if (!breadItem) {
      return;
    }

    const breadItemConfig = this._getBreadItemConfig(breadItem);
    this.setFieldsData(toolbar, breadItemConfig);

    return this;
  }

  _toggleBreadItemSortable(isSortable) {
    const breadItemBox = this.el.querySelector('.breadcrumb');
    this._sortableInstence?.destroy();
    this._sortableInstence = null;

    if (isSortable) {
      this._sortableInstence = new Sortable(breadItemBox, {
        animation: 150,
        ghostClass: 'moving'
      });
    }

    return this;
  }

  _toggleContentEditAble(isEditing) {
    const bigTitle = this.el.querySelector('h1');
    const aEls = this.el.querySelectorAll('a');

    isEditing
      ? bigTitle?.setAttribute('contenteditable', true)
      : bigTitle?.removeAttribute('contenteditable');

    for (const aEl of aEls) {
      isEditing
        ? aEl.setAttribute('contenteditable', true)
        : aEl.removeAttribute('contenteditable');
    }

    return this;
  }

  toggleToolbar(isShow = true) {
    this.toolbar.classList.toggle('d-none', !isShow);
    return this;
  }

  _toggleEditMode(isEditing) {
    this.toggleToolbar(isEditing);
    this._toggleEvent(isEditing);
    this._toggleContentEditAble(isEditing);
    this._toggleBreadItemSortable(isEditing);

    const editingItems = this.el.querySelectorAll('.editing');

    for (const editItem of editingItems) {
      editItem.classList.remove('editing');
    }

    return this;
  }

  _toggleEvent(bind) {
    const { elClick, elInput } = this._eventHandler;

    bind === true
      ? this.el.addEventListener('click', elClick)
      : this.el.removeEventListener('click', elClick);

    bind === true
      ? this.el.addEventListener('input', elInput)
      : this.el.removeEventListener('input', elInput);

    return this;
  }

  _toggleNowBreadItem(newBreadItem) {
    const lastBreadItem = this.nowBreadItem;
    lastBreadItem?.classList.remove('editing');

    this.nowBreadItem = newBreadItem;
    this.nowBreadItem?.classList.add('editing');

    return this;
  }
}
