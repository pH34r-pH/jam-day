# Jam Day contribution map

## Ownership and living/history classification

This is the public, static event surface and its API contracts. `README.md`,
`docs/`, `site/`, this map, and the GitHub workflows are living sources. The
repository has no retained historical-results tree; CI's `visual-review/`
directory is disposable workflow output and must not become tracked source.
Do not label a future contract or result superseded without source, issue, or
receipt evidence.

| Boundary | Owns | Change here |
| --- | --- | --- |
| [`site/`](site/AGENTS.md) | public page, RSVP browser client, and admin browser surface | HTML/CSS/JS behavior |
| [`docs/`](docs/AGENTS.md) | public RSVP and private-admin contracts | request/response rules and privacy boundary |
| `.github/workflows/` | quality, visual, structural, and documentation checks | CI only; preserve existing runner/admission behavior |
| `scripts/` | changed-path documentation/artifact guard and its regression tests | process checks only |

## Architecture and data flow

```text
site/index.html + site/app.js
        -> POST /api/rsvp
        -> private Fleet handler and RSVP persistence
        -> approximate planning record (name/headcount)

site/admin/*
        -> authenticated GET /api/admin/rsvps
        -> private Fleet host view and summed headcount
```

The public source may contain only Snohomish, WA. It must not contain the
street address, RSVP records, secrets, storage details, or production
configuration. The public RSVP contract intentionally has no attendee
identity, edit, cancel, delete, export, or durable idempotency flow. Admin
responses must contain no attendee data for unauthorized callers.

## Exact validation and change placement

From the repository root:

```bash
python3 -I scripts/check_documentation_artifacts.py --base HEAD^
python3 -m unittest discover -s scripts -p 'test_*.py' -v
NPM_CONFIG_CACHE=/tmp/jam-day-npm-cache npx --yes markdownlint-cli2@0.18.1 README.md AGENTS.md docs/*.md site/AGENTS.md
python3 -m http.server 8000 --directory site
```

Change public layout/content in `site/index.html`, `site/styles.css`, and
`site/app.js`; change admin browser behavior under `site/admin/`; change
contracts in `docs/`. The API implementation and production configuration
belong in Fleet, not here.
