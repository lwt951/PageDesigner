'use strict';

// toggle side bar button
const toggleSidebarBtn = document.querySelector('.toggle-sidebar-btn');
toggleSidebarBtn?.addEventListener('click', () => {
  document.body.classList.toggle('toggle-sidebar');
  const menuEditorSwitch = document.querySelector('[name="menu-edit-config"]');

  if (menuEditorSwitch.checked) {
    menuEditorSwitch.click();
  }
});

// back to top button
const backtotopBtn = document.querySelector('.back-to-top');

if (backtotopBtn) {
  const toggleBacktotop = () => {
    if (window.scrollY > 100) {
      backtotopBtn.classList.add('active');
    } else {
      backtotopBtn.classList.remove('active');
    }
  };

  window.addEventListener('load', toggleBacktotop);
  document.addEventListener('scroll', toggleBacktotop);
}

// menu
const menuReponse = axios
  .get(`./data/menu.json`)
  .then((result) => {
    const data = JSON.parse(result.data);
    new Menu({ data, editMode: true, id: 'sidebar' });

    return result;
  })
  .catch((err) => {
    console.warn(err);
  });

// page and router
const hashChange = async (hash) => {
  if (!hash) {
    return;
  }

  await menuReponse;
  // now sidebar menu active
  const sidebar = document.getElementById('sidebar');
  const lastActiveLink = sidebar.querySelector('.active');
  const nowHsahLink = sidebar.querySelector(`a[href="#${hash}"]`);

  lastActiveLink?.classList.remove('active');
  nowHsahLink?.classList.add('active');

  const parentUl = nowHsahLink?.closest('ul');
  const parentLink = sidebar.querySelector(
    `[data-bs-target="#${parentUl?.id}"]`
  );

  if (parentLink?.classList.contains('collapsed')) {
    parentLink?.click();
  }

  // render page
  window.page = new Page();

  const response = await axios.get(`./pages/${hash}.html`).catch((err) => {
    console.warn(err);
  });
  const designHtml = response?.data || '<div>No Data!</div>';

  page.loadDesignHtml(designHtml, true);
};

const router = new Router({ hashChange });
