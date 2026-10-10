# Component requests

Each `CR-YYYYMMDD-XXXXXXXX.json` file is one source-of-truth request. The CLI owns IDs, validation, lifecycle, and serialization. Other local agents should use `bun <UI_ROOT>/scripts/component-requests.ts submit --file <request.json>` instead of direct file edits. Do not store product business UI here; document the reusable capability and consumer location instead.

See [component request workflow](../../docs/component-requests.md).

No requests are pre-seeded from speculation. Requests are added after a real consumer identifies a concrete gap.
