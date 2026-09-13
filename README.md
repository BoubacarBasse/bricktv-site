# Brick TV

Marketing site for Brick TV, a Winnipeg production house of independent artists.
Static HTML, no framework, no build step. Live at https://brick-tv.netlify.app

```
index.html      home
video.html      Dr. JPEG        photo.html    Loic Matabishi
audio.html      Maz the Prod    fashion.html  dystopian
contact.html    faq.html
admin/          Sveltia CMS
content/        the JSON the CMS edits
assets/         css, js, self-hosted fonts, uploads
```

Each craft maps to one artist, so the craft page and the profile page are the
same page. Nav links land on a full page rather than a strip.

Local: `python3 -m http.server` in this folder.

## Adding work

Go to `/admin`, sign in with GitHub, add the item, hit publish. That commits to
this repo, Netlify rebuilds, and the page updates in about a minute.

- **Portfolios** - films, photographs, tracks, looks
- **Feature images** - the wide image at the foot of each artist page, and the
  home hero (up to three frames, they cross-fade)
- **Settings** - phone, email, booking link

Images are resized to 2000px and converted to WebP on upload, so full-res phone
photos will not bloat the site. Films take a YouTube link or a bare ID.

### How the grids work

Each grid declares its content source in the markup:

```html
<div class="grid grid--photo" data-gallery="content/photo.json"
     data-kind="photo" data-slots="6"></div>
```

`assets/js/gallery.js` fetches it and renders the items. **With no entries it
draws designed empty slots instead** - which is why the site looks deliberate
today with no photography in it, and why dropping the real images in requires no
layout change. A slot is just the empty state of a filled grid.

Copy lives in the HTML, not the CMS. Bios and headings are in the page so they
are indexable and work without JS; only the media lists are fetched. If editing
copy is wanted later, the step up is Eleventy and this JSON carries over.

### CMS sign-in

The GitHub backend needs an OAuth relay. Netlify can be one:

1. GitHub → Settings → Developer settings → OAuth Apps → New. Callback URL
   `https://api.netlify.com/auth/done`.
2. Netlify → the `brick-tv` project → Access control → OAuth → install GitHub,
   paste the client ID and secret.

Until that exists, sign in at `/admin` with a GitHub personal access token
(`repo` scope). No setup needed, works immediately.

Sveltia is pinned to 0.211.5 in `admin/index.html`. Bump it deliberately.

## Notes

- Border radius is 0 everywhere except the headshot circles and the play ring.
- One maroon band per page; the checkerboard strip is the only divider.
- No em dashes anywhere, per the client. Regular hyphens only.
- The booking URL lives in `CONFIG` at the top of `assets/js/site.js`. Clearing
  it routes every Book button to the call/email fallback modal.
- Ambient motion is disabled under `prefers-reduced-motion`.
- The ask form posts to Netlify Forms with a honeypot; if it ever fails it falls
  back to showing the crew's email rather than dropping the message.

## Outstanding

- **Photography** - every image slot is empty, waiting on the asset zip.
  "must have 3.jpg" goes on the Dr. JPEG page.
- **Headshots** - the four circles show monograms until real photos land.
- **Social links** - Instagram, Spotify and Apple Music icons render inert; no
  URLs supplied yet.
- **Film titles** - taken from YouTube and lightly tidied. Rename any in the CMS.
- **Netlify badge** - turn off at Project configuration → General → Powered by
  Netlify badge. There is no API for it.
- **Contact details** - phone and email are unverified; the client called the
  email temporary.

## Content guardrails

Binding, from the strategy documents: no testimonials, client logos, project
counts, years in business, or performance claims. No physical address. No prices
anywhere; pricing is always "per project, after a consultation". Maz's legal name
does not appear on the site.
