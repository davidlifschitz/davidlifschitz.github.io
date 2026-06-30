(function () {
  'use strict';

  var GITHUB_URL = 'https://github.com/davidlifschitz';

  var NAV_ITEMS = [
    { id: 'home', label: 'Home', href: 'index.html' },
    { id: 'ecosystem', label: 'Ecosystem', href: 'ecosystem.html' },
    { id: 'dashboard', label: 'Dashboard', href: 'dashboard.html' },
    { id: 'shortcutforge', label: 'ShortcutForge', href: 'shortcutforge/index.html' },
    { id: 'writing', label: 'Writing', href: 'blog/index.html' },
    { id: 'github', label: 'GitHub', href: GITHUB_URL, external: true },
    { id: 'booking', label: 'Book a Call', href: 'booking.html', cta: true },
  ];

  function buildLink(item, base, active) {
    var href = item.external ? item.href : base + item.href;
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
    var links = NAV_ITEMS.map(function (item) {
      return buildLink(item, base, active);
    }).join('\n        ');
    if (includeSpaceToggle) {
      links += '\n        ' + spaceToggleMarkup();
    }

    placeholder.outerHTML =
      '<header class="site-header">\n' +
      '  <div class="wrap nav-inner">\n' +
      '    <a class="brand" href="' + base + 'index.html">David Lifschitz</a>\n' +
      '    <nav class="nav-links" aria-label="Primary">\n' +
      '        ' + links + '\n' +
      '    </nav>\n' +
      '  </div>\n' +
      '</header>';
  }

  function initSiteNav() {
    var placeholders = document.querySelectorAll('[data-site-nav]');
    for (var i = 0; i < placeholders.length; i++) {
      renderNav(placeholders[i]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSiteNav);
  } else {
    initSiteNav();
  }
})();
