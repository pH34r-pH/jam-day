# RSVP API contract

## `POST /api/rsvp`

Request:

```json
{"name":"Ada","headcount":2}
```

Rules:
- `name`: trimmed, non-empty string, maximum 120 characters.
- `headcount`: integer from 1 through 30.
- No other attendee fields are part of the contract.

Success:

```json
{
  "ok": true,
  "location": "<private production event location>"
}
```

The public source and static artifact must not contain the production value of `location`. It is supplied only by the production service after successful persistence.

### Retry semantics

The production implementation should accept an idempotency key supplied by the client or otherwise implement a short duplicate-submission guard. The exact persistence mechanism is Fleet-owned; a browser retry must not silently create an additional headcount.

### Errors

Use generic 4xx responses for invalid input/rate limits and 5xx for unavailable persistence. Do not return storage names, connection details, private configuration, or RSVP records.
