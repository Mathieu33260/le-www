import Slideout from 'slideout';

const slideOutList = {};

// Functions for change icons
function leftIconToClose() {
  window.document.querySelector('.toggle-button-menu .icon-menu-hamburger').classList.add('hide');
  window.document.querySelector('.toggle-button-menu .icon-close').classList.remove('hide');
}
function leftIconToMenu() {
  window.document.querySelector('.toggle-button-menu .icon-close').classList.add('hide');
  window.document.querySelector('.toggle-button-menu .icon-menu-hamburger').classList.remove('hide');
}
function rightIconToClose() {
  const selectorLogin = window.document.querySelector('#enteteMobile .login');
  if (selectorLogin !== null) {
    // User not logged
    selectorLogin.classList.add('hide');
    window.document.querySelector('#enteteMobile .btns-right .toggle-button-menu').classList.remove('hide');
  } else {
    window.document.querySelector('.mobile-user-menu.toggle-button-menu .icon-mon-profil').classList.add('hide');
    window.document.querySelector('.mobile-user-menu.toggle-button-menu .icon-close').classList.remove('hide');
    const badge = window.document.querySelector('.mobile-user-menu.toggle-button-menu .badge');
    if (badge !== null) {
      badge.classList.add('hide');
    }
  }
}
function rightIconToMenu() {
  const selectorLogin = window.document.querySelector('#enteteMobile .login');
  if (selectorLogin !== null) {
    // User not logged
    window.document.querySelector('#enteteMobile .btns-right .toggle-button-menu').classList.add('hide');
    selectorLogin.classList.remove('hide');
  } else {
    window.document.querySelector('.mobile-user-menu.toggle-button-menu .icon-close').classList.add('hide');
    window.document.querySelector('.mobile-user-menu.toggle-button-menu .icon-mon-profil').classList.remove('hide');
    const badge = window.document.querySelector('.mobile-user-menu.toggle-button-menu .badge');
    if (badge !== null) {
      badge.classList.remove('hide');
    }
  }
}
// END Functions for change icons


function initSlides() {
  const hasUserHeaderNav = window.document.getElementById('userHeaderNavMobile');
  const hasMenuMobile = window.document.getElementById('menuMobile');
  const hasFilterBy = window.document.getElementById('formfiltersMobile');
  const hasSortMobile = window.document.getElementById('sortMobile');
  const leWrapItem = window.document.getElementById('le-wrap');
  const headerFixed = document.getElementById('header');
  const navbar = document.getElementById('menu');
  const currentWidth = getWidth();

  /** ******************* */
  /** **** Menu left **** */
  /** ******************* */
  if (hasMenuMobile !== null) {
    if (typeof slideOutList.slideOutLeftMenu !== 'undefined' && currentWidth >= 768) {
      // If we do not need the slide anymore, we delete it
      slideOutList.slideOutLeftMenu.destroy();
      delete slideOutList.slideOutLeftMenu;
    }
    if (currentWidth < 768) {
      const slideOutLeftMenu = new Slideout({
        menu: window.document.getElementById('menuMobile'),
        panel: leWrapItem,
        padding: 256,
        tolerance: 70,
        side: 'left',
        touch: false,
      });

      // Bind Open button
      window.document.querySelector('.toggle-button-menu .icon-menu-hamburger').addEventListener('click', () => {
        slideOutLeftMenu.open();
      });

      // Before open this menu
      slideOutLeftMenu.on('beforeopen', () => {
        // Add css class in #le-wrap
        slideOutLeftMenu.panel.classList.add('panel-open');

        // Remove css class hide on menu
        window.document.getElementById('menuMobile').classList.remove('hide');

        // Clean header style
        headerFixed.style.transition = 'transform 300ms ease';
        headerFixed.style.transform = 'translateX(256px)';

        // Clean navbar style
        navbar.style.transition = 'transform 300ms ease';
        navbar.style.transform = 'translateX(256px)';
      });

      // On open menu
      slideOutLeftMenu.on('open', () => {
        // Change button icon
        leftIconToClose();

        // Clean header style
        headerFixed.style.transition = '';

        // Clean navbar style
        navbar.style.transition = '';

        // Binds close
        // Close menu with #le-wrap
        slideOutLeftMenu.panel.addEventListener('click', (e) => {
          e.preventDefault();
          slideOutLeftMenu.close();
        }, true);
        // Close menu with button
        window.document.querySelector('.toggle-button-menu .icon-close').addEventListener('click', () => {
          slideOutLeftMenu.close();
        }, true);
      });

      // On close menu
      slideOutLeftMenu.on('close', () => {
        // Change button icon
        leftIconToMenu();

        // Add css class hide on menu
        window.document.getElementById('menuMobile').classList.add('hide');

        // Clean header style
        headerFixed.style.transition = '';
        headerFixed.style.transform = '';

        // Clean navbar style
        navbar.style.transition = '';
        navbar.style.transform = '';
      });

      // Header fix
      slideOutLeftMenu.on('translate', (translated) => {
        headerFixed.style.transform = 'translateX(' + translated + 'px)';
        navbar.style.transform = 'translateX(' + translated + 'px)';
      });

      // Before close
      slideOutLeftMenu.on('beforeclose', () => {
        // Header fix
        headerFixed.style.transition = 'transform 300ms ease';
        headerFixed.style.transform = 'translateX(0px)';

        // navbar
        navbar.style.transition = 'transform 300ms ease';
        navbar.style.transform = 'translateX(0px)';

        // Remove css class on #le-wrap
        slideOutLeftMenu.panel.classList.remove('panel-open');

        // Remove events close
        // On #le-wrap
        slideOutLeftMenu.panel.removeEventListener('click', (e) => {
          e.preventDefault();
          slideOutLeftMenu.close();
        }, true);
        window.document.querySelector('.toggle-button-menu .icon-close').removeEventListener('click', () => {
          slideOutLeftMenu.close();
        }, true);
      });

      // Add slide in object listing
      slideOutList.slideOutLeftMenu = slideOutLeftMenu;
    }
  }
  /** END Menu left */


  /** ************************* */
  /** **** START Filter by **** */
  /** ************************* */
  if (hasFilterBy !== null) {
    if (typeof slideOutList.slideOutLeftFilterBy !== 'undefined' && currentWidth >= 992) {
      // If we do not need the slide anymore, we delete it
      slideOutList.slideOutLeftFilterBy.destroy();
      delete slideOutList.slideOutLeftFilterBy;
    }
    if (currentWidth < 992) {
      const slideOutLeftFilterBy = new Slideout({
        menu: window.document.getElementById('formfiltersMobile'),
        panel: leWrapItem,
        padding: 256,
        tolerance: 70,
        side: 'left',
        touch: false,
      });

      // Bind Open button
      window.document.getElementById('le-filter-button').addEventListener('click', () => {
        slideOutLeftFilterBy.open();
      });

      // Before open this menu
      slideOutLeftFilterBy.on('beforeopen', () => {
        // Add css class in #le-wrap
        slideOutLeftFilterBy.panel.classList.add('panel-open');

        // Remove css class hide on menu
        window.document.getElementById('formfiltersMobile').classList.remove('hide');

        // Clean header style
        headerFixed.style.transition = 'transform 300ms ease';
        headerFixed.style.transform = 'translateX(256px)';

        // Clean navbar style
        navbar.style.transition = 'transform 300ms ease';
        navbar.style.transform = 'translateX(256px)';
      });

      // On open menu
      slideOutLeftFilterBy.on('open', () => {
        const width = getWidth();
        // Change button icon
        if (width < 768) {
          leftIconToClose();
        }

        // Clean header style
        headerFixed.style.transition = ''

        // Clean navbar style
        navbar.style.transition = '';

        // Binds close
        // Close menu with #le-wrap
        slideOutLeftFilterBy.panel.addEventListener('click', (e) => {
          e.preventDefault();
          slideOutLeftFilterBy.close();
        }, true);
        // Close menu with button
        window.document.querySelector('.toggle-button-menu .icon-close').addEventListener('click', () => {
          slideOutLeftFilterBy.close();
        });
      });

      // On close menu
      slideOutLeftFilterBy.on('close', () => {
        // Change button icon
        leftIconToMenu();

        // Add css class hide on menu
        window.document.getElementById('formfiltersMobile').classList.add('hide');

        // Clean header style
        headerFixed.style.transition = '';
        headerFixed.style.transform = '';

        // Clean navbar style
        navbar.style.transition = '';
        navbar.style.transform = '';
      });

      // Header fix and navbar
      slideOutLeftFilterBy.on('translate', (translated) => {
        headerFixed.style.transform = 'translateX(' + translated + 'px)';
        navbar.style.transform = 'translateX(' + translated + 'px)';
      });

      // Before close
      slideOutLeftFilterBy.on('beforeclose', () => {
        // Header fix
        headerFixed.style.transition = 'transform 300ms ease';
        headerFixed.style.transform = 'translateX(0px)';

        // navbar fix
        navbar.style.transition = 'transform 300ms ease';
        navbar.style.transform = 'translateX(0px)';

        // Remove css class on #le-wrap
        slideOutLeftFilterBy.panel.classList.remove('panel-open');

        // Remove events close
        // On #le-wrap
        slideOutLeftFilterBy.panel.removeEventListener('click', (e) => {
          e.preventDefault();
          slideOutLeftFilterBy.close();
        }, true);
        window.document.querySelector('.toggle-button-menu .icon-close').removeEventListener('click', () => {
          slideOutLeftFilterBy.close();
        }, true);
      });

      // Add slide in object listing
      slideOutList.slideOutLeftFilterBy = slideOutLeftFilterBy;
    }
  }
  /** END Menu filter by */


  /** *************************** */
  /** **** Menu right (user) **** */
  /** *************************** */
  if (hasUserHeaderNav !== null) {
    if (typeof slideOutList.slideOutRightMenu !== 'undefined' && currentWidth >= 768) {
      // If we do not need the slide anymore, we delete it
      slideOutList.slideOutRightMenu.destroy();
      delete slideOutList.slideOutRightMenu;
    }
    if (currentWidth < 768) {
      const slideOutRightMenu = new Slideout({
        menu: window.document.getElementById('userHeaderNavMobile'),
        panel: leWrapItem,
        padding: 256,
        tolerance: 70,
        side: 'right',
        touch: false,
      });

      // Bind Open button
      window.document.querySelector('.mobile-user-menu').addEventListener('click', () => {
        slideOutRightMenu.open();
      }, true);

      // Before open this menu
      slideOutRightMenu.on('beforeopen', () => {
        // Add css class in #le-wrap
        slideOutRightMenu.panel.classList.add('panel-open');

        // Remove css class hide on menu
        window.document.getElementById('userHeaderNavMobile').classList.remove('hide');

        // Clean header style
        headerFixed.style.transition = 'transform 300ms ease';
        headerFixed.style.transform = 'translateX(-256px)';

        // Clean navbar style
        if (navbar) {
          navbar.style.transition = 'transform 300ms ease';
          navbar.style.transform = 'translateX(-256px)';
        }
      });

      // On open menu
      slideOutRightMenu.on('open', () => {
        // Change button icon
        rightIconToClose();

        // Clean header style
        headerFixed.style.transition = '';

        // Clean navbar style
        if (navbar) {
          navbar.style.transition = '';
        }

        // Binds close
        // Close menu with #le-wrap
        slideOutRightMenu.panel.addEventListener('click', (e) => {
          e.preventDefault();
          slideOutRightMenu.close();
        }, true);
        // Close menu with button
        window.document.querySelector('.mobile-user-menu.toggle-button-menu .icon-close').addEventListener('click', () => {
          slideOutRightMenu.close();
        }, true);
      });

      // On close menu
      slideOutRightMenu.on('close', () => {
        // Change button icon
        rightIconToMenu();

        // Add css class hide on menu
        window.document.getElementById('userHeaderNavMobile').classList.add('hide');

        // Clean header style
        headerFixed.style.transition = '';
        headerFixed.style.transform = '';

        // Clean navbar style
        if (navbar) {
          navbar.style.transition = '';
          navbar.style.transform = '';
        }
      });

      // Header fix and navbar
      slideOutRightMenu.on('translate', (translated) => {
        headerFixed.style.transform = 'translateX(' + translated + 'px)';
        navbar.style.transform = 'translateX(' + translated + 'px)';
      });

      // Before close
      slideOutRightMenu.on('beforeclose', () => {
        // Header fix
        headerFixed.style.transition = 'transform 300ms ease';
        headerFixed.style.transform = 'translateX(0px)';

        // navbar
        if (navbar) {
          navbar.style.transition = 'transform 300ms ease';
          navbar.style.transform = 'translateX(0px)';
        }

        // Remove css class on #le-wrap
        slideOutRightMenu.panel.classList.remove('panel-open');

        // Remove events close
        // On #le-wrap
        slideOutRightMenu.panel.removeEventListener('click', (e) => {
          e.preventDefault();
          slideOutRightMenu.close();
        }, true);
        window.document.querySelector('.mobile-user-menu.toggle-button-menu .icon-close').removeEventListener('click', () => {
          slideOutRightMenu.close();
        }, true);
      });

      // Add slide in object listing
      slideOutList.slideOutRightMenu = slideOutRightMenu;
    }
  }
  /** END Menu right (user) */


  /** *********************** */
  /** **** START Sort by **** */
  /** *********************** */
  if (hasSortMobile !== null) {
    if (typeof slideOutList.slideOutSortMenu !== 'undefined' && currentWidth >= 992) {
      // If we do not need the slide anymore, we delete it
      slideOutList.slideOutSortMenu.destroy();
      delete slideOutList.slideOutSortMenu;
    }
    if (currentWidth < 992) {
      const slideOutSortMenu = new Slideout({
        menu: window.document.getElementById('sortMobile'),
        panel: leWrapItem,
        padding: 256,
        tolerance: 70,
        side: 'right',
        touch: false,
      });

      // Bind Open button
      window.document.getElementById('le-sort-button').addEventListener('click', () => {
        slideOutSortMenu.open();
      }, true);

      // Before open this menu
      slideOutSortMenu.on('beforeopen', () => {
        // Add css class in #le-wrap
        slideOutSortMenu.panel.classList.add('panel-open');

        // Remove css class hide on menu
        window.document.getElementById('sortMobile').classList.remove('hide');
        window.document.querySelector('#sortMobile > div').style = '';

        // Clean header style
        headerFixed.style.transition = 'transform 300ms ease';
        headerFixed.style.transform = 'translateX(-256px)';

        // Clean navbar style
        navbar.style.transition = 'transform 300ms ease';
        navbar.style.transform = 'translateX(-256px)';
      });

      // On open menu
      slideOutSortMenu.on('open', () => {
        // Change button icon
        rightIconToClose();

        // Clean header style
        headerFixed.style.transition = '';

        // Clean navbar style
        navbar.style.transition = '';

        // Binds close
        // Close menu with #le-wrap
        slideOutSortMenu.panel.addEventListener('click', (e) => {
          e.preventDefault();
          slideOutSortMenu.close();
        }, true);
        // Close menu with button
        window.document.querySelector('#enteteMobile .btns-right .toggle-button-menu').addEventListener('click', () => {
          slideOutSortMenu.close();
        }, true);
      });

      // On close menu
      slideOutSortMenu.on('close', () => {
        // Change button icon
        rightIconToMenu();

        // Add css class hide on menu
        window.document.getElementById('sortMobile').classList.add('hide');
        window.document.querySelector('#sortMobile > div').style = 'display: none;';

        // Clean header style
        headerFixed.style.transition = '';
        headerFixed.style.transform = '';

        // Clean navbar style
        navbar.style.transition = '';
        navbar.style.transform = '';
      });

      // Header fix and navbar
      slideOutSortMenu.on('translate', (translated) => {
        headerFixed.style.transform = 'translateX(' + translated + 'px)';
        navbar.style.transform = 'translateX(' + translated + 'px)';
      });

      // Before close
      slideOutSortMenu.on('beforeclose', () => {
        // Header fix
        headerFixed.style.transition = 'transform 300ms ease';
        headerFixed.style.transform = 'translateX(0px)';

        // Header fix
        navbar.style.transition = 'transform 300ms ease';
        navbar.style.transform = 'translateX(0px)';

        // Remove css class on #le-wrap
        slideOutSortMenu.panel.classList.remove('panel-open');

        // Remove events close
        // On #le-wrap
        slideOutSortMenu.panel.removeEventListener('click', (e) => {
          e.preventDefault();
          slideOutSortMenu.close();
        }, true);
        window.document.querySelector('#enteteMobile .btns-right .toggle-button-menu').removeEventListener('click', () => {
          slideOutSortMenu.close();
        }, true);
      });

      // Add slide in object listing
      slideOutList.slideOutSortMenu = slideOutSortMenu;
    }
  }
  /** END Menu right (user) */
}

window.onresize = initSlides; // The screen size change
initSlides();
