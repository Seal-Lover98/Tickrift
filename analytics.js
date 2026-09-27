(function () {
  'use strict';

  const GA_ID = 'G-PK72BHMES7';
  const CONSENT_KEY = 'tickriftAnalyticsConsent';

  function hasConsent() {
    return localStorage.getItem(CONSENT_KEY) === 'granted';
  }

  function loadGoogleAnalytics() {
    if (window.__tickriftGaLoaded) return;
    window.__tickriftGaLoaded = true;

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(script);
  }

  function setConsent(value) {
    localStorage.setItem(CONSENT_KEY, value);
    const banner = document.getElementById('tickrift-analytics-banner');
    if (banner) banner.remove();
    const settings = document.getElementById('tickrift-analytics-settings');
    if (settings) settings.remove();
    if (value === 'granted') loadGoogleAnalytics();
  }

  function showSettings() {
    if (document.getElementById('tickrift-analytics-settings')) return;
    const panel = document.createElement('div');
    panel.id = 'tickrift-analytics-settings';
    panel.className = 'analytics-consent-panel';
    panel.innerHTML = `
      <div class="analytics-consent-card" role="dialog" aria-modal="true" aria-labelledby="analytics-settings-title">
        <div>
          <div class="micro-label">PRIVACY</div>
          <h2 id="analytics-settings-title">Analytics settings</h2>
          <p>Tickrift can use Google Analytics to understand anonymous site usage, such as which pages are visited and which features are used. Analytics is optional.</p>
        </div>
        <div class="analytics-actions">
          <button type="button" class="button secondary" data-analytics-choice="denied">Decline analytics</button>
          <button type="button" class="button primary" data-analytics-choice="granted">Allow analytics</button>
        </div>
      </div>`;
    document.body.appendChild(panel);
    panel.querySelectorAll('[data-analytics-choice]').forEach(function (button) {
      button.addEventListener('click', function () { setConsent(button.dataset.analyticsChoice); });
    });
  }

  function showBanner() {
    if (localStorage.getItem(CONSENT_KEY)) return;
    const banner = document.createElement('div');
    banner.id = 'tickrift-analytics-banner';
    banner.className = 'analytics-consent-banner';
    banner.innerHTML = `
      <div class="analytics-consent-copy">
        <strong>Optional analytics</strong>
        <span>Tickrift uses Google Analytics only with your permission to understand how the site is used. This does not affect your simulator or paper portfolio.</span>
      </div>
      <div class="analytics-actions">
        <button type="button" class="button secondary" data-analytics-choice="denied">Decline</button>
        <button type="button" class="button primary" data-analytics-choice="granted">Allow analytics</button>
        <button type="button" class="analytics-settings-link" id="analyticsSettingsLink">Settings</button>
      </div>`;
    document.body.appendChild(banner);

    banner.querySelector('[data-analytics-choice="denied"]').addEventListener('click', function () { setConsent('denied'); });
    banner.querySelector('[data-analytics-choice="granted"]').addEventListener('click', function () { setConsent('granted'); });
    banner.querySelector('#analyticsSettingsLink').addEventListener('click', showSettings);
  }

  document.addEventListener('click', function (event) {
    const target = event.target.closest('[data-open-analytics-settings]');
    if (target) {
      event.preventDefault();
      showSettings();
    }
  });

  function init() {
    if (hasConsent()) loadGoogleAnalytics();
    showBanner();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
