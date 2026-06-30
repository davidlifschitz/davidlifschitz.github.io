(function () {
  'use strict';

  var GITHUB_URL = 'https://github.com/davidlifschitz';

  var PRIMARY_NAV_ITEMS = [
    { id: 'home', label: 'Home', href: 'index.html' },
    { id: 'ecosystem', label: 'Ecosystem', href: 'ecosystem.html' },
    { id: 'dashboard', label: 'Dashboard', href: 'dashboard.html' },
    { id: 'shortcutforge', label: 'ShortcutForge', href: 'shortcutforge/index.html' },
    { id: 'writing', label: 'Writing', href: 'blog/index.html' },
    { id: 'github', label: 'GitHub', href: GITHUB_URL, external: true },
    { id: 'booking', label: 'Book a Call', href: 'booking.html', cta: true },
  ];

  var SECTION_NAV_ITEMS = [
    { id: 'products', label: 'Products', href: 'index.html#products' },
    { id: 'research', label: 'Research', href: 'index.html#research' },
    { id: 'mobile', label: 'Mobile', href: 'index.html#mobile' },
  ];

  function buildLink(item, base, active) {
    var href;
    if (item.external) {
      href = item.href;
    } else if (active === 'home' && item.href.indexOf('index.html#') === 0) {
      href = item.href.slice('index.html'.length);
    } else {
      href = base + item.href;
    }
    var attrs = ['href="' + href + '"'];

    if (item.external) {
      attrs.push('target="_blank"', 'rel="noreferrer"', 'aria-label="GitHub (opens in new tab)"');
    }

    var classes = [];
    if (item.cta) {
      classes.push('nav-links__cta');
    }
    if (item.id === active) {
      classes.push('nav-links__active');
      attrs.push('aria-current="page"');
    }
    if (classes.length) {
      attrs.unshift('class="' + classes.join(' ') + '"');
    }

    return '<a ' + attrs.join(' ') + '>' + item.label + '</a>';
  }

  function spaceToggleMarkup() {
    return (
      '<button class="space-toggle" type="button" data-space-mode-toggle aria-pressed="false">' +
      '<span class="space-toggle__track" aria-hidden="true"><span class="space-toggle__knob"></span></span>' +
      '<span>Space mode</span>' +
      '</button>'
    );
  }

  function renderNav(placeholder) {
    var active = placeholder.getAttribute('data-active') || '';
    var base = placeholder.getAttribute('data-base') || '';
    var includeSpaceToggle = placeholder.hasAttribute('data-space-toggle');
    var primaryLinks = PRIMARY_NAV_ITEMS.map(function (item) {
      return buildLink(item, base, active);
    }).join('\n        ');
    var sectionLinks = SECTION_NAV_ITEMS.map(function (item) {
      return buildLink(item, base, active);
    }).join('\n          ');
    var sectionsMarkup =
      '<div class="nav-links__sections">\n' +
      '          <span class="nav-links__sections-label">Home sections</span>\n' +
      '          ' + sectionLinks + '\n' +
      '        </div>';
    var links = primaryLinks + '\n        ' + sectionsMarkup;
    if (includeSpaceToggle) {
      links += '\n        ' + spaceToggleMarkup();
    }

    placeholder.outerHTML =
      '<header class="site-header">\n' +
      '  <div class="wrap nav-inner">\n' +
      '    <a class="brand" href="' + base + 'index.html">David Lifschitz</a>\n' +
      '    <button class="nav-menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav-links">Menu</button>\n' +
      '    <nav class="nav-links" id="site-nav-links" aria-label="Primary">\n' +
      '        ' + links + '\n' +
      '    </nav>\n' +
      '  </div>\n' +
      '</header>';
  }

  function injectSkipLink() {
    if (document.querySelector('.skip-link')) {
      return;
    }
    var skip = document.createElement('a');
    skip.className = 'skip-link';
    skip.href = '#main-content';
    skip.textContent = 'Skip to content';
    document.body.insertBefore(skip, document.body.firstChild);
  }

  function setupMobileNav(header) {
    var toggle = header.querySelector('.nav-menu-toggle');
    var navLinks = header.querySelector('#site-nav-links');
    if (!toggle || !navLinks) {
      return;
    }

    function setOpen(open) {
      header.classList.toggle('is-nav-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? 'Close' : 'Menu';
    }

    function closeNav() {
      setOpen(false);
    }

    toggle.addEventListener('click', function () {
      setOpen(!header.classList.contains('is-nav-open'));
    });

    navLinks.addEventListener('click', function (event) {
      if (event.target.closest('a')) {
        closeNav();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && header.classList.contains('is-nav-open')) {
        closeNav();
        toggle.focus();
      }
    });
  }

  function initSiteNav() {
    injectSkipLink();
    var placeholders = document.querySelectorAll('[data-site-nav]');
    for (var i = 0; i < placeholders.length; i++) {
      renderNav(placeholders[i]);
    }
    var headers = document.querySelectorAll('.site-header');
    for (var j = 0; j < headers.length; j++) {
      setupMobileNav(headers[j]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSiteNav);
  } else {
    initSiteNav();
  }
})();
