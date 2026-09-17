# Tickrift publishing checklist

This is a practical product checklist, not legal advice.

## Keep it a simulation

- No deposits or withdrawals.
- No brokerage connection or transmission of real orders.
- Virtual cash has no monetary value.
- No cash prizes tied to trading results.
- Do not describe paper performance as guaranteed real-world performance.
- Keep `SIMULATED`, `MARKET`, and `DELAYED` source labels accurate.

## Market data

- Use only data you have permission to display publicly.
- Keep provider API keys server-side.
- Follow provider attribution requirements.
- Do not call delayed data real-time.
- Check exchange-specific display/redistribution requirements before launch.

## Brand / company references

Tickrift uses company names and ticker symbols to identify simulated instruments. Do not imply sponsorship, endorsement, or affiliation with those companies, exchanges, funds, or crypto projects. Be cautious about copying third-party logos or brand artwork.

## Privacy / monetization

The current build stores simulation state locally in the browser and contains no ad tracker or analytics SDK. If you later add accounts, analytics, advertising, email capture, or payment processing, add the appropriate privacy/cookie/consumer disclosures and consent flows for the jurisdictions in which you operate.

## Before public monetization

Have an adult who can legally enter provider/payment contracts review the account setup and have the final public terms/privacy/data-licensing setup checked for the markets and countries you target.
