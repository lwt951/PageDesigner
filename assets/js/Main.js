"use strict";

// toggle side bar function 
const toggleSidebarBtn = document.querySelector('.toggle-sidebar-btn')
toggleSidebarBtn.addEventListener('click', () => {
  document.body.classList.toggle('toggle-sidebar')
})

// router 
const hashChange = async (hash) => {
  if (!hash) {
    return;
  }

  window.page = new Page();

  const response = await axios.get(`./pages/${hash}.html`).catch((err) => {
    console.warn(err);
  });
  const designHtml = response?.data || '<div>No Data!</div>';

  page.loadDesignHtml(designHtml, true);
};

const router = new Router({ hashChange });

// test menu editor

const menuData = [
  {
    text: 'Forms',
    href: '',
    tooltip: '',
    icon: 'bi bi-journal-text',
    children: [
      {
        text: 'Form Elements',
        href: '#/form',
        tooltip: '',
        icon: 'bi bi-circle',
        children: []
      },
      {
        text: 'Form with table',
        href: '#/formwithtable',
        tooltip: '',
        icon: 'bi bi-circle',
        children: []
      }
    ]
  },
  {
    text: 'Tables',
    href: '',
    tooltip: '',
    icon: 'bi bi-layout-text-window-reverse',
    children: [
      {
        text: 'Data table',
        href: '#/table',
        tooltip: '',
        icon: 'bi bi-circle',
        children: []
      },
      {
        text: 'Subform',
        href: '#/subform',
        tooltip: '',
        icon: 'bi bi-circle',
        children: []
      }
    ]
  },
  {
    text: 'Charts',
    href: '',
    tooltip: '',
    icon: 'bi bi-bar-chart',
    children: [
      {
        text: 'Chart',
        href: '#/chart',
        tooltip: '',
        icon: 'bi bi-circle',
        children: []
      }
    ]
  },
  {
    text: 'Editor',
    href: '#editor',
    tooltip: '',
    icon: 'bi bi-layers',
    children: []
  }
];

const menu = new Menu({data: menuData, editMode: true, id: 'sidebar' })
