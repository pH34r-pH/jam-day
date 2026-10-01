# Jam Day browser surface map

## Ownership

`index.html`, `styles.css`, and `app.js` are the public event page and RSVP
client. `admin/` is a separate private-facing browser surface for the admin
contract. There is no build step or bundler, and the files are served as-is.

## Flow and invariants

The public form validates the small RSVP payload in the browser, then sends it
to `POST /api/rsvp`; production supplies the private location only after a
successful response. The admin page requests `GET /api/admin/rsvps` only
through an authenticated production boundary. Do not add secrets, private
addresses, attendee records, storage details, or production configuration to
these files.

## Validation

Run `python3 -m http.server 8000 --directory site` and inspect `/` plus
`/admin/`. The repository workflow also runs the privacy guard and desktop /
mobile Chromium smoke render. Change the API contract in [`../docs/`](../docs/),
not by silently widening browser payloads.
