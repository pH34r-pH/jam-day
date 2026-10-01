# Jam Day contract map

## Ownership and relationships

[`rsvp-api.md`](rsvp-api.md) owns the public `POST /api/rsvp` request,
validation, duplicate-submit boundary, generic errors, and the rule that the
production `location` value is private. [`admin-api.md`](admin-api.md) owns the
authenticated `GET /api/admin/rsvps` response and the no-anonymous-data rule.
Fleet owns the actual handler, identity, storage, routing, and host view.

The browser consumers are [`../site/app.js`](../site/app.js) and
[`../site/admin/admin.js`](../site/admin/admin.js). Keep these contracts
consistent with those consumers without moving production authority into this
public repository.

## Validation

Run the changed-path guard and the pinned Markdown/link checks from the root
map in [`../AGENTS.md`](../AGENTS.md). Contract edits should also be checked
against the browser request shape and the existing privacy guard in
`.github/workflows/quality.yml`.
