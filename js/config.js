/* =============================================================================
   config.js · Rudra Jewells. EDIT THIS FILE to change contact details.

   Everything that names a phone number, an address or a handle is read from
   here at load time, so each detail lives in exactly one place:
     - every element with [data-wa] becomes a WhatsApp "Book an appointment" link
     - every element with [data-bind="key"] gets its text from RUDRA[key]
     - every element with [data-href="key"] gets its href from RUDRA[key]
   ========================================================================== */
window.RUDRA = {
  // WhatsApp number: country code + number, digits only (no +, spaces or dashes).
  whatsapp: '919831070282',
  // Shown on the page next to the button. Keep it in step with `whatsapp` above.
  phoneDisplay: '+91 98310 70282',
  // Pre-filled WhatsApp message. Use '' for none.
  whatsappMessage: 'Hello Rudra Jewells, I would like to book an appointment.',

  email: 'rjpl@mundhragroup.in',
  instagram: 'rudrajewels_',
  director: 'Sudarshan Mundhra',
  addressLine1: '29 Muktaram Babu Street',
  addressLine2: 'Kolkata 700007',
  // Opens Google Maps search for the address (no embed, no tracking).
  mapUrl: 'https://www.google.com/maps/search/?api=1&query=29+Muktaram+Babu+Street+Kolkata+700007'
};

(function (win, doc) {
  'use strict';
  var R = win.RUDRA;
  R.waUrl = 'https://wa.me/' + String(R.whatsapp).replace(/\D/g, '') +
    (R.whatsappMessage ? '?text=' + encodeURIComponent(R.whatsappMessage) : '');
  R.emailUrl = 'mailto:' + R.email;
  R.instagramUrl = 'https://www.instagram.com/' + R.instagram + '/';
  R.instagramHandle = '@' + R.instagram;

  function apply() {
    Array.prototype.forEach.call(doc.querySelectorAll('[data-wa]'), function (a) {
      a.setAttribute('href', R.waUrl);
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
    });
    Array.prototype.forEach.call(doc.querySelectorAll('[data-bind]'), function (el) {
      var v = R[el.getAttribute('data-bind')];
      if (v != null) el.textContent = v;
    });
    Array.prototype.forEach.call(doc.querySelectorAll('[data-href]'), function (a) {
      var v = R[a.getAttribute('data-href')];
      if (v != null) a.setAttribute('href', v);
    });
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', apply);
  else apply();
})(window, document);
