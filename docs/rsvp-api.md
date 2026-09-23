# RSVP API contract

## Purpose

RSVP is deliberately approximate planning data: who is coming and roughly how many people to expect. It is not an attendee account or registration-management system.

## `POST /api/rsvp`

Request:

```json
{"name":"Ada","headcount":2}
```

Rules:
- `name`: trimmed, non-empty string, maximum 120 characters.
- `headcount`: integer from 1 through 30.
- Ignore/reject additional attendee fields; the client sends only these two values.

Persistence needs only `name` and `headcount`. A server-generated record ID and submission timestamp are useful operational metadata but are not part of the attendee-facing contract.

Success:

```json
{
  "ok": true,
  "location": "<private production event location>"
}
```

The public source and static artifact must never contain the production value of `location`. Fleet supplies it from private production configuration only after a successful RSVP.

## Duplicate submissions

Keep this intentionally lightweight. Disable repeat submission in the browser while a request is in flight, and let production apply a short bounded duplicate/double-submit guard if useful. There is no attendee identity, durable idempotency token, edit flow, cancellation flow, or RSVP-management API.

## Host view

The operational requirement is a private list of names/headcounts and a summed total headcount. This view belongs to Fleet/production, not the public site.

## Errors

Use generic 4xx responses for invalid input/rate limits and 5xx for unavailable persistence. Do not return storage names, connection details, private configuration, or other RSVP records.
