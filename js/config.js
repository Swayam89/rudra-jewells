/* ==========================================================================
   Rudra Jewells — site settings
   EDIT THIS FILE to change contact details. Every [data-wa] button, every
   [data-bind="key"] text and every [data-href="key"] link updates from here.
   ========================================================================== */
window.RUDRA = {
  name: "Rudra Jewells Pvt. Ltd.",
  tagline: "Curated just for you",
  director: "Sudarshan Mundhra",

  // WhatsApp: country code + number, digits only
  whatsapp: "919831070282",
  phoneDisplay: "+91 98310 70282",
  bookingMessage: "Hello Rudra Jewells, I would like to book an appointment.",

  email: "rjpl@mundhragroup.in",
  instagram: "rudrajewels_",

  address: "29 Muktaram Babu Street, Kolkata 700007",
  maps: "https://www.google.com/maps/search/?api=1&query=29+Muktaram+Babu+Street+Kolkata+700007",

  // Small "Sample image" labels on every stock photo.
  // Set to false once all photos are replaced with Rudra's own product shots.
  showSampleTags: true
};

(function (R) {
  R.waLink = function (message) {
    return "https://wa.me/" + R.whatsapp + "?text=" + encodeURIComponent(message || R.bookingMessage);
  };
  R.mailto = "mailto:" + R.email;
  R.instagramUrl = "https://www.instagram.com/" + R.instagram + "/";
  R.instagramHandle = "@" + R.instagram;
  R.tel = "tel:+" + R.whatsapp;
})(window.RUDRA);
