(function () {
  'use strict';

  var PROJECTS = [
    { name: 'Graphify', href: 'https://github.com/davidlifschitz/graphify', desc: 'context & architecture mapping' },
    { name: 'ScheduleOS', href: 'https://github.com/davidlifschitz/ScheduleOS', desc: 'operator shell' },
    { name: 'spec-to-repo', href: 'https://github.com/davidlifschitz/spec-to-repo', desc: 'spec to repo scaffolds' },
    { name: 'ShortcutForge', href: 'https://github.com/davidlifschitz/ShortcutForge', desc: 'mobile capture & trigger flows' },
    { name: 'agentic-os', href: 'https://github.com/davidlifschitz/agentic-os', desc: 'ecosystem control plane' },
  ];

  var HYPERFRAMES_SRC = '@hyperframes/player';
  var PLAYER_TAG = 'hyperframes-player';
  var FALLBACK_DELAY_MS = 3000;

  var shown = false;
  var timerId = null;

  function playerReady() {
    return typeof customElements !== 'undefined' && customElements.get(PLAYER_TAG) !== undefined;
  }

  function buildLinksHtml() {
    return (
      '<div class="surface-list" style="height:100%;overflow:auto;padding:16px 24px;">' +
      PROJECTS.map(function (project) {
        return (
          '<a class="surface-row" href="' + project.href + '" target="_blank" rel="noreferrer" ' +
          'aria-label="' + project.name + ' (opens in new tab)">' +
          '<span>' + project.name + ' — ' + project.desc + '</span><span class="arrow">→</span></a>'
        );
      }).join('') +
      '</div>'
    );
  }

  function showFallback() {
    if (shown) return;
    shown = true;

    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }

    var frame = document.querySelector('.projects-reel-embed__frame');
    if (!frame) return;

    frame.innerHTML = buildLinksHtml();
  }

  function onScriptError(event) {
    var target = event.target;
    if (!target || target.tagName !== 'SCRIPT') return;
    if ((target.src || '').indexOf(HYPERFRAMES_SRC) === -1) return;
    showFallback();
  }

  function init() {
    window.addEventListener('error', onScriptError, true);

    if (playerReady()) return;

    timerId = setTimeout(function () {
      if (!playerReady()) {
        showFallback();
      }
    }, FALLBACK_DELAY_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
