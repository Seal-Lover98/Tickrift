/* Tickrift runtime configuration.
   The default endpoint is the same-origin Cloudflare Pages Function included in this repository.
   No provider key is exposed to the browser. If no licensed provider key is configured,
   Tickrift stays in clearly labelled SIMULATED mode. */
window.TICKRIFT_CONFIG = {
  marketDataEndpoint: "/api/market",
  marketDataPollMs: 60000
};
