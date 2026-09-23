# Jam Day

Public source for **Jam Day III** — October 3, 2026 in Snohomish, Washington.

This repository owns the public event page, RSVP client/API contract, calendar helpers, tests, and unprivileged CI. Production Azure resources, RSVP persistence, private event location, DNS, and deployment authority live in the private `pH34r-pH/long-haul-fleet` repository.

## Local development

No build step is required.

```sh
python3 -m http.server 8000 --directory site
```

Open `http://localhost:8000`.

The production RSVP endpoint is `POST /api/rsvp`. For local visual development, the form reports that RSVP is unavailable unless a compatible local endpoint is provided.

## Privacy boundary

The public site intentionally contains only **Snohomish, WA**. Do not commit the event street address, RSVP records, production secrets, or production configuration to this repository.

See issues #1–#3 for the initial product, visual, and API contracts.
