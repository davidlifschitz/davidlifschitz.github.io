(function () {
  'use strict';

  var selectedCard = null;

  function selectSession(card) {
    document.querySelectorAll('.session-card').forEach(function (c) {
      c.classList.remove('active');
      c.setAttribute('aria-pressed', 'false');
    });
    card.classList.add('active');
    card.setAttribute('aria-pressed', 'true');
    selectedCard = card;
    var hint = document.getElementById('hint-text');
    hint.textContent = '← Click to pick a time';
    hint.style.color = '';
  }

  function openCalEmbed() {
    if (!selectedCard) {
      document.getElementById('hint-text').textContent = '← Please select a session type first';
      document.getElementById('hint-text').style.color = '#8b0000';
      return;
    }
    var calLink = selectedCard.getAttribute('data-cal-link');
    var container = document.getElementById('cal-embed-container');
    container.innerHTML = '';
    container.classList.add('visible');
    setTimeout(function () {
      container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    Cal('inline', {
      elementOrSelector: '#cal-embed-container',
      calLink: calLink,
      layout: 'month_view',
      config: { theme: 'light', hideEventTypeDetails: '0', layout: 'month_view' }
    });
  }

  function init() {
    document.querySelectorAll('.session-card[data-cal-link]').forEach(function (card) {
      card.addEventListener('click', function () {
        selectSession(card);
      });
      card.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectSession(card);
        }
      });
    });

    var bookBtn = document.querySelector('[data-book-session]');
    if (bookBtn) {
      bookBtn.addEventListener('click', openCalEmbed);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
