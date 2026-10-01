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

## Repository map and status

The living public surface is [`site/`](site/), where `index.html` and
`app.js` collect an RSVP and call the production API. The admin page under
[`site/admin/`](site/admin/) reads the private admin contract; production
authentication, storage, routing, and the private location remain outside
this repository. Contract ownership and data boundaries are mapped in
[`docs/AGENTS.md`](docs/AGENTS.md), while browser-file ownership is mapped in
[`site/AGENTS.md`](site/AGENTS.md).

The existing [`quality.yml`](.github/workflows/quality.yml) workflow owns
privacy/static checks and the visual smoke review. The existing
[`structural-quality-audit.yml`](.github/workflows/structural-quality-audit.yml)
owns the JavaScript structural audit. The added
[`documentation-artifact.yml`](.github/workflows/documentation-artifact.yml)
checks only changed documentation and newly tracked disposable artifacts.
CI-generated `visual-review/` images are temporary evidence, not source.
