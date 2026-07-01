(function () {
  'use strict';

  var PROJECTS = [
    { name: 'Spec to Repo', href: 'https://github.com/davidlifschitz/spec-to-repo', desc: 'spec to repo scaffolds' },
    { name: 'Finance Sankey', href: 'https://github.com/davidlifschitz/finance-sankey', desc: 'cash-flow Sankey diagrams' },
    { name: 'NFA', href: 'https://github.com/davidlifschitz/NFA', desc: 'LLM finance advisor experiment' },
    { name: 'Agent Ops Registry', href: 'https://github.com/davidlifschitz/agent-ops-registry', desc: 'agent infrastructure dataset' },
    { name: 'Fastest-Growing Finance Repos', href: 'https://github.com/davidlifschitz/fastest-growing-finance-repos', desc: 'daily star-growth feed' },
    { name: 'Jewish Link Ad Studio', href: 'https://github.com/davidlifschitz/jewish-link-ad-studio', desc: 'generative print pipeline' },
    { name: 'Children of Israel Agent Swarm', href: 'https://github.com/davidlifschitz/children-of-israel-agent-swarm', desc: 'multi-agent research' },
    { name: 'SaVr', href: 'https://github.com/davidlifschitz/SaVr', desc: 'credit-card perks optimizer' },
    { name: 'Team Gold', href: 'https://github.com/davidlifschitz/team-gold', desc: 'quant research workflow' },
    { name: 'Clinically Slim', href: 'https://github.com/davidlifschitz/ClinicallySlim', desc: 'appointment scheduling app' },
    { name: 'Safer Web Redirector', href: 'https://github.com/davidlifschitz/RedirectForSafeBrowsing', desc: 'Chrome extension' },
    { name: 'Email Style Wrapper', href: 'https://github.com/davidlifschitz/email-style-wrapper', desc: 'email styling utility' },
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
          '<a class="surface-row" href="' + project.href + '" target="_blank" rel="noopener noreferrer" ' +
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
