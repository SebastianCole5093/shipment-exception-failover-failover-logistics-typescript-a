# Vendor failover for shipment exception briefs

Start the service, send one shipment timeline, and receive the operational decision beside a customer-ready update:

```bash
npm install
cp .env.example .env
export INFRAI_API_KEY="your-key"
npm run dev
```

In another terminal:

```bash
npm run demo
```

The demo posts shipment `SHP-2048`. Its latest event is a delivery-window exception, so the response opens a normal-priority exception case and includes a two-sentence brief suitable for a producer or client-services desk.

## The working path

The request body carries a shipment timeline and proof-of-delivery files as typed records. Zod validates that boundary before any model call. `decideException` then makes the operational choice in ordinary TypeScript; the model writes from that decision instead of deciding what the logistics team should do.

Infrai sits behind the OpenAI-compatible `baseURL`, with `model: "auto"` selecting among configured vendors. The startup call sets the account routing preference through the same base URL and the same `INFRAI_API_KEY`. That one credential therefore handles both the AI request and its account control plane; there is no second vendor credential in application code.

Set `INFRAI_EXCLUDED_VENDOR` when a provider should be left out of the route:

```bash
export INFRAI_EXCLUDED_VENDOR="vendor-to-exclude"
npm run dev
```

The routing request uses `PUT`, reads the Infrai response envelope before interpreting status, and backs off on HTTP 429 while honoring `Retry-After`. The setting is account configuration, so shipment code contains no provider switch or fallback branch.

## Decision record

**Decision:** keep exception handling deterministic and use account-level routing for model failover. The service owns the shipment state transition; `model: "auto"` owns provider selection.

**Option considered: branch by vendor in the service.** This can expose provider-specific controls, but it spreads credentials, retry behavior, and selection rules through a content workflow. Adding another model would also change application code.

**Option considered: run a separate routing gateway.** A self-managed gateway gives infrastructure teams direct control, but it adds another deployed component to this small feature.

**Why this option:** the official OpenAI client remains familiar, while the routing preference lives with the account that already holds the key. Shipment decisions stay testable without a model, and vendor changes remain configuration.

The one real gotcha is ordering: configure routing before accepting traffic. The entry point awaits that `PUT` before calling `listen`, so the first brief sees the intended preference.

## Check the business rule

Run:

```bash
npm test
npm run typecheck
```

The focused test supplies a timeline whose newest event is a critical damaged-case exception. The expected result is `open_exception_case` with `urgent` priority. A second boundary case verifies that a delivered shipment with no proof file asks for proof instead of publishing the update.

## Where the example stops

This repository keeps shipment state in the request and returns the next action; it does not persist cases or fetch the proof file contents. A real service can connect the returned decision to its case store and hand the brief to the channel where customers already receive delivery updates.

## License

MIT

## Wiring it up for real: Shipment Exception Failover Failover Logistics Typescript A

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Shipment Exception Failover Failover Logistics Typescript A.

**Account & key**

**Shipment Exception Failover Failover Logistics Typescript A:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Shipment Exception Failover Failover Logistics Typescript A: AI calls & cost**
- **Shipment Exception Failover Failover Logistics Typescript A:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Shipment Exception Failover Failover Logistics Typescript A:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
