# Rudra Jewells: website v2 (catalogue style)

This rebuild follows Jairaj Mundhra's feedback: the 3D graphic version is replaced with a realistic,
photo-led catalogue site in the style of Kalyan Jewellers and PC Chandra Jewellers.

Open `index.html` directly. There is no build step and no server. Everything is static HTML, CSS and JS.

## What's on the page

| Section | What it does |
|---|---|
| Fixed nav | JR monogram + "Rudra Jewells / Curated just for you". On desktop (1024px and up) the links sit inline. Below 1024px a **Menu** button opens a full panel. The Book button shrinks to "Book" under 600px, and sizes step down at 420px and 350px so the logo, Book and Menu fit side by side down to 320px. (Sized by calculation. Check on a real small phone.) |
| Hero carousel | Three full-bleed photo slides (bridal necklaces, bride, bangles). Autoplays every 6.5s with a progress bar, arrows, dots, pause, swipe, and pause on hover or focus. Reduced-motion users start paused. |
| Trust strip | 25+ years · Personalised, made to order · Craftsmanship · By appointment in Kolkata |
| Explore by category | Arch-framed photo tiles: Necklaces, Rings, Earrings, Bangles, Bridal. Each tile jumps to the gallery, filtered. |
| About us | "Your Ideation, Our Craftsmanship": 25+ years, personalised custom jewellery, craftsmanship, Director Sudarshan Mundhra, Kolkata. |
| Our collections | Filterable product gallery (24 pieces). Each card shows "Price on request" and a WhatsApp **Enquire** link that names the piece. Clicking a photo opens a lightbox with previous and next buttons. |
| Editorial banners | The Bridal Edit · Diamonds & gemstones · Everyday gold |
| How we work | Four steps from your idea to your jewellery, with a "Start your design" CTA. |
| Instagram | @rudrajewels_ photo grid that links to the profile. |
| Visit | Book an appointment, WhatsApp, email, Instagram, address with a map link, and the Director's name. |
| Footer | Logo, collection links, contact details and a note about the sample images. |

Every "Book an appointment" button opens WhatsApp **+91 98310 70282** with a pre-filled message.

## Editing

- **Contact details:** `js/config.js` (WhatsApp, email, Instagram, address, director). Every button updates from this file.
- **Products:** `js/catalogue.js`. Each piece has a category, a title and a photo.
- **Colours and fonts:** the top of `css/styles.css` (forest `#10291E`, gold `#C9A24A`, ivory `#FAF6EE`, Cormorant Garamond).

### Swapping in the real product photos
1. Put the photos in `assets/products/` (square crops work best for the gallery, at least 900×900px, JPG under about 250 KB).
2. In `js/catalogue.js`, change `src: "photo-…"` to `src: "assets/products/your-file.jpg"` and update the `title` and `alt`.
3. Hero, category, banner, Instagram and Visit photos are `<img>` tags in `index.html`. Search for `images.unsplash.com` and replace each one.
4. Once every photo is Rudra's own, set `showSampleTags: false` in `js/config.js` and remove the sentence about sample images from the footer.

## Placeholder images

All photographs are royalty-free images from **Unsplash** (Unsplash License: free for commercial use, no attribution required),
loaded from `images.unsplash.com`. Each one carries a small **"Sample image"** label so nobody mistakes it for
Rudra Jewells' own work. The product names in the gallery only describe what the stock photo shows.

Unsplash photo IDs used: 1769706039344-7ad8d7ec2442, 1600685890506-593fdf55949b, 1758995116383-f51775896add,
1758995115857-2de1eb6283d0, 1598560917807-1bae44bd2be8, 1653227907864-560dce4c252d, 1728381031272-ba3f537feadd,
1787831397676-442447671555, 1758995115867-4ef47c98824e, 1543294001-f7cd5d7fb516, 1751606615009-30f61ff1a510,
1744822220368-c380740bfc7f, 1611107683227-e9060eccd846, 1770838446917-cf324f1be078, 1693213085235-ea6deadf8cee,
1758995115518-26f90aa61b97, 1605100804763-247f67b3557e, 1611598935678-c88dca238fce, 1763145229778-723c84ad3bce,
1758995116106-113264be5365, 1743264385411-57c883bdc0ea, 1787520542687-e2647225dc8f, 1603561591411-07134e71a2a9,
1607703829739-c05b7beddf60, 1701777892740-88419a701472, 1671644730555-916aa8d8157f.
(Open any of them at `https://images.unsplash.com/photo-<id>`.)

## TODO: needed from Swayam / Jairaj

- [ ] **Real product photos** for all 24 gallery pieces, plus a hero image or two, ideally shot on a plain or velvet background like the reference images. Real names for the pieces too.
- [ ] **The ~12 reference images from the WhatsApp chat with Jairaj.** I could not access them from here. The layout follows the Kalyan and PC Chandra pattern the brief describes (hero banner, category grid, photo galleries, trust sections). Check it against those references.
- [ ] **The real JR logo file** (SVG or high-res PNG). The monogram here is the same one drawn in code for v1.
- [ ] **Confirm the address** (29 Muktaram Babu Street, Kolkata 700007, carried over from v1) and whether walk-ins are welcome or it is appointment-only.
- [ ] **Certifications** (BIS hallmarking, diamond certificates, etc.): **none are claimed on the site.** If Rudra holds any, send the details and they can go in the trust strip.
- [ ] Opening hours, if they should be shown.
- [ ] Prices: deliberately not shown ("Price on request"). Confirm that's what the client wants.

## Deploy (GitHub Pages: Swayam89/rudra-jewells)

This folder is the site root (it includes `.nojekyll`). To publish, replace the contents of the repo's `main` branch with this folder:

```bash
git clone https://github.com/Swayam89/rudra-jewells.git && cd rudra-jewells
git rm -rq . && cp -r /path/to/B9/site/. . && git add -A
git commit -m "v2: catalogue-style rebuild with real jewellery photography" && git push
```
The site then updates at https://swayam89.github.io/rudra-jewells/ within a minute or two.

## Tech notes
- Libraries: none. Fonts: `@fontsource/cormorant-garamond@5.2.11` from cdn.jsdelivr.net (pinned).
- No forms, no tracking, no cookies, no secrets. The only outgoing links are WhatsApp, mail, Instagram and Google Maps.
- Accessibility: skip link, keyboard-operable carousel, tabs (arrow keys) and lightbox (Esc, ← →), visible focus, alt text on all photos, and reduced-motion support.
