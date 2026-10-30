# Rudra Jewells · website

A one-page 3D website for **Rudra Jewells Pvt. Ltd.**, Kolkata. It is built in Swayam's *swaysalyedweb* style: a scroll-driven Three.js stage in forest green, gold and ivory, with layered parallax type and a WhatsApp booking button in every chapter.

## Open it

- Double-click `index.html`. It needs no build step and no server. It does need an internet connection, because the libraries and the font load from jsDelivr.
- Or serve the folder with `python3 -m http.server 8000` and open http://localhost:8000/.

## Change the WhatsApp number (and other contact details)

Every phone, email, Instagram and address detail lives in **one file: `js/config.js`**.

```js
whatsapp: '919831070282',          // country code + number, digits only → wa.me link
phoneDisplay: '+91 98310 70282',   // the number as shown on the page
whatsappMessage: 'Hello Rudra Jewells, I would like to book an appointment.',
email: 'rjpl@mundhragroup.in',
instagram: 'rudrajewels_',
director: 'Sudarshan Mundhra',
addressLine1: '29 Muktaram Babu Street',
addressLine2: 'Kolkata 700007',
```

Every **Book an appointment** button (nav, hero, visit section and the phone button) is tagged `data-wa`. On load, each one gets the link `https://wa.me/<whatsapp>?text=<message>`. The values written in `index.html` are only what shows when JavaScript is off. `config.js` overwrites them.

## What is on the page

| # | Chapter | What happens |
|---|---|---|
| 01 | Hero, *Curated just for you* | A procedural round brilliant diamond turns under a moving light, with gold dust drifting at several depths. The giant outlined "RUDRA" sits behind the stone, and the type layers drift with the pointer. As you scroll, film bars close in and the camera dives into the table facet. |
| 02 | The house | The dive lands on "Your ideation, our craftsmanship." The paragraph is read in word by word as you scroll. |
| 03 | What we make | A horizontal rail, pinned on desktop and stacked on phones. Each piece is a gold line drawing that draws itself in. It is built from three layered planes in depth (halo, drawing, glints) that turn as they pass, and it tilts toward the pointer. |
| 04 | **01 Our Approach** | Pinned. A ring is made in five scrubbed stages: Stage 1 *Your idea* (CAD wireframe), 2 *The design* (gold band), 3 *The setting* (prongs rise), 4 *The stone* (the diamond drops in), 5 *Yours* (a light sweep). |
| 05 | Curated just for you | The ivory "paper" break. The JR monogram turns in 3D, and this chapter names the Director, Sudarshan Mundhra. |
| 06 | Turn it in your hand | Drag the ring (or use the arrow keys) and pick yellow, rose or white gold. |
| 07 | Visit | Book an appointment on WhatsApp, with the address, email, Instagram and Director. The ring settles, and a gold hairline draws across into the footer. |

Accessibility and fallbacks:
- **Reduced motion:** no pins, no smooth scroll, no spinning. The scenes show designed still frames.
- **No WebGL:** a gold diamond drawing takes the hero, and the rest of the page still works.
- **No JavaScript:** the page reads as a normal document.
- **Phones:** lighter particles, a pixel-ratio cap, stacked layouts and a floating **Book** button.

## TODO for Swayam

- [ ] **Company description.** Send the final text. It replaces three placeholders in `index.html`: the statement paragraph (`data-split-words`), the house paragraph (`.house__body`) and the five approach stage lines. Each one is marked `PLACEHOLDER` in an HTML comment.
- [ ] **What we make.** Confirm the five categories (Rings, Necklaces, Earrings, Bangles, Bespoke) and their one-line descriptions. I chose them as tasteful placeholders, not from a source.
- [ ] **Metals.** The preview offers yellow, rose and white gold. Confirm that Rudra Jewells works in all three, or tell me which to remove.
- [ ] **Real photography (optional).** The 3D stone and ring are illustrative and are labelled that way on the page. If you have product photos, they can go into the *What we make* rail.
- [ ] **Logo artwork.** The JR monogram and diamond logo are redrawn in SVG from the brief, using the serif typeface and a diamond outline. For an exact match, send the business-card artwork as SVG or PDF and it will replace the `#i-mono` / `#i-diamond` symbols at the top of `index.html`.
- [ ] **Domain and share image.** `assets/og.svg` is the share card. Some platforms want a PNG, so export one at 1200×630 once the domain is known.

## Files

```
index.html          markup and copy, SVG symbols (diamond logo, JR monogram, WhatsApp icon)
css/tokens.css      colours (forest/gold/ivory), type scale, spacing, motion
css/base.css        chrome: preloader, nav, cursor, buttons, swatches, stage, footer, phone button
css/sections.css    one block per chapter, in page order
js/config.js        ← contact details (WhatsApp number etc.)
js/core.js          runtime: Lenis smooth scroll, ScrollTrigger boot, nav counter, cursor, magnetic buttons, preloader
js/jewel.js         the Three.js stage: diamond shader, ring build, gold dust, scroll poses, drag, metals
js/sections.js      reveals, the horizontal rail, the 3D monogram, the phone booking button
assets/favicon.svg  assets/og.svg
```

## Credits and notes

- Libraries are loaded from jsDelivr at pinned versions: three.js r170 (0.170.0), GSAP 3.13.0 (ScrollTrigger, SplitText), Lenis 1.3.4, and Cormorant Garamond via @fontsource 5.2.6.
- There are no images, no forms, no tracking and no cookies. The only outbound links are WhatsApp (`wa.me`), email, Instagram and Google Maps.
- Business details come from Swayam's brief and business card: the tagline, the Director, Instagram @rudrajewels_, rjpl@mundhragroup.in and 29 Muktaram Babu Street, Kolkata 700007. The page invents no prices, reviews or awards.
