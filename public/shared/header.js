// Tiny Steps — sticky header shadow on scroll
(() => {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const toggle = () => {
    if (window.scrollY > 2) {
      header.classList.add('is-scrolled');
    } else {
      header.classList.remove('is-scrolled');
    }
  };

  // Run once on load in case page opens mid-scroll
  toggle();

  // Listen for scroll & instant nav jumps
  window.addEventListener('scroll', toggle, { passive: true });
  window.addEventListener('resize', toggle);
  window.addEventListener('orientationchange', toggle);
})();

// Accessible dropdown for the shared nav
(() => {
  const dropdowns = Array.from(document.querySelectorAll('.nav-dropdown'));
  if (!dropdowns.length) return;
  if (window.__tinystepsNavDropdownInit) return;
  window.__tinystepsNavDropdownInit = true;

  const syncDropdownState = (dropdown, open) => {
    if (!dropdown) return;
    dropdown.classList.toggle('open', open);
    const toggle = dropdown.querySelector('.nav-dropdown-toggle');
    const menu = dropdown.querySelector('.nav-dropdown-menu');
    if (toggle) toggle.setAttribute('aria-expanded', String(open));
    if (menu) menu.setAttribute('aria-hidden', String(!open));
  };

  const closeAll = (except = null) => {
    dropdowns.forEach((dropdown) => {
      if (dropdown === except) return;
      syncDropdownState(dropdown, false);
    });
  };

  dropdowns.forEach((dropdown) => {
    const toggle = dropdown.querySelector('.nav-dropdown-toggle');
    const menu = dropdown.querySelector('.nav-dropdown-menu');
    if (!toggle || !menu) return;

    syncDropdownState(dropdown, false);

    const openDropdown = ({ focusFirst = false } = {}) => {
      closeAll(dropdown);
      syncDropdownState(dropdown, true);
      if (focusFirst) {
        const first = menu.querySelector('a');
        if (first && typeof first.focus === 'function') {
          try { first.focus({ preventScroll: true }); }
          catch { first.focus(); }
        }
      }
    };

    const closeDropdown = () => {
      syncDropdownState(dropdown, false);
    };

    toggle.addEventListener('click', (ev) => {
      ev.preventDefault();
      const shouldOpen = !dropdown.classList.contains('open');
      if (shouldOpen) {
        openDropdown({ focusFirst: true });
      } else {
        closeDropdown();
      }
    });

    dropdown.addEventListener('mouseenter', () => {
      openDropdown();
    });

    dropdown.addEventListener('mouseleave', () => {
      closeDropdown();
    });

    dropdown.addEventListener('focusout', (ev) => {
      if (dropdown.contains(ev.relatedTarget)) return;
      closeDropdown();
    });

    dropdown.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') {
        closeAll();
        try { toggle.focus({ preventScroll: true }); }
        catch { toggle.focus(); }
      }
    });
  });

  document.addEventListener('click', (ev) => {
    if (!ev.target.closest('.nav-dropdown')) closeAll();
  });
})();
