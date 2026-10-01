# Admin RSVP API contract

Production infrastructure owns authentication, authorization, storage and routing for this endpoint.

The public admin page is [`../site/admin/index.html`](../site/admin/index.html)
with browser behavior in [`../site/admin/admin.js`](../site/admin/admin.js).
Those files may request the contract, but they do not own organizer identity,
authentication, persistence, or private event configuration.

## `GET /api/admin/rsvps`

The endpoint is **not anonymous**. Production must authenticate the caller and verify the configured organizer allowlist before returning any RSVP data.

Success:

```json
{
  "rsvps": [
    {
      "name": "Example guest",
      "headcount": 2,
      "submittedAt": "2026-09-23T19:00:00Z"
    }
  ]
}
```

Only `name` and `headcount` are required. `submittedAt` is optional operational metadata.

The frontend computes the total expected headcount from returned records.

Unauthorized callers receive 401/403 with no attendee data, totals, storage metadata, private event configuration or organizer identity.

There are no public admin mutation endpoints. No edit/delete/cancel/export operations are part of this contract.
