// Wonderelo — page registry for the single-page artboard viewer (View.html).
// Each entry can declare a desktop frame, a mobile frame, and dev toggles.
// Toggle kinds:
//   fn   → calls window[fn](value) inside the target frame(s)
//   attr → clicks .pd-variant-toggle [data-<attr>="<value>"] inside the frame
//   param→ reloads the frame with ?<param>=<value> merged into its src
// target: 'desktop' | 'mobile' | 'both' (default 'both')
window.WPAGES = {
  // ───────── Public site (responsive desktop + mobile) ─────────
  homepage: {
    title: 'Home<em>page</em>', group: 'public',
    desktop: { src: 'home/Homepage Desktop.html', w: 1440 },
    mobile:  { src: 'home/Homepage Mobile v2.html', w: 390 },
    toggles: [ { label: 'Mobile menu', fn: 'setNavMenu', target: 'mobile', options: [{ l: 'Closed', v: 'closed' }, { l: 'Open', v: 'open' }] } ],
  },
  pricing: {
    title: 'Pricing', group: 'public',
    desktop: { src: 'Pricing.html', w: 1280 },
    mobile:  { src: 'Pricing.html', w: 390 },
    toggles: [ { label: 'Mobile menu', fn: 'setNavMenu', target: 'mobile', options: [{ l: 'Closed', v: 'closed' }, { l: 'Open', v: 'open' }] } ],
  },
  story: {
    title: 'Our <em>Story</em>', group: 'public',
    desktop: { src: 'Our Story.html', w: 1280 },
    mobile:  { src: 'Our Story.html', w: 390 },
    toggles: [ { label: 'Mobile menu', fn: 'setNavMenu', target: 'mobile', options: [{ l: 'Closed', v: 'closed' }, { l: 'Open', v: 'open' }] } ],
  },
  blog: {
    title: 'Blog', group: 'public',
    desktop: { src: 'Blog.html', w: 1280 },
    mobile:  { src: 'Blog.html', w: 390 },
    toggles: [ { label: 'Mobile menu', fn: 'setNavMenu', target: 'mobile', options: [{ l: 'Closed', v: 'closed' }, { l: 'Open', v: 'open' }] } ],
  },
  blogpost: {
    title: 'Blog <em>post</em>', group: 'public',
    desktop: { src: 'Blog Post.html', w: 1280 },
    mobile:  { src: 'Blog Post.html', w: 390 },
    toggles: [ { label: 'Mobile menu', fn: 'setNavMenu', target: 'mobile', options: [{ l: 'Closed', v: 'closed' }, { l: 'Open', v: 'open' }] } ],
  },
  usecase: {
    title: 'Use <em>case</em>', group: 'public',
    desktop: { src: 'Use Case.html', w: 1280 },
    mobile:  { src: 'Use Case.html', w: 390 },
    toggles: [ { label: 'Mobile menu', fn: 'setNavMenu', target: 'mobile', options: [{ l: 'Closed', v: 'closed' }, { l: 'Open', v: 'open' }] } ],
  },
  designsys: {
    title: 'Design <em>system</em>', group: 'public',
    desktop: { src: 'Design System.html', w: 1280 },
  },

  // ───────── Participant journey (mobile-first) ─────────
  event: {
    title: 'Event <em>page</em>', group: 'participant',
    desktop: { src: 'Event Page.html', w: 1280 },
    mobile:  { src: 'Event Page.html', w: 432 },
    toggles: [
      { label: 'View as', fn: 'setViewAs', options: [{ l: 'Guest', v: 'guest' }, { l: 'Andy', v: 'signed' }] },
      { label: 'Rounds', fn: 'setRoundsState', options: [{ l: 'With', v: 'with' }, { l: 'Empty', v: 'empty' }] },
    ],
  },
  continuereg: {
    title: 'Continue <em>registration</em>', group: 'participant',
    mobile: { src: 'Continue Registration.html', w: 432, baseParams: { screen: 'contact' } },
    toggles: [
      { label: 'Step', param: 'screen', target: 'mobile', options: [{ l: 'Contact', v: 'contact' }, { l: 'Meeting', v: 'meeting' }] },
      { label: 'View as', fn: 'setViewAs', target: 'mobile', options: [{ l: 'Guest', v: 'guest' }, { l: 'Andy', v: 'signed' }] },
    ],
  },
  confirmemail: {
    title: 'Confirm <em>email</em>', group: 'participant',
    mobile: { src: 'Continue Registration Confirm.html', w: 432 },
  },
  dashboard: {
    title: 'Participant <em>dashboard</em>', group: 'participant',
    mobile: { src: 'Participant Dashboard.html', w: 432, baseParams: { variant: 'default' } },
    toggles: [
      { label: 'State', param: 'variant', target: 'mobile', options: [
        { l: 'Empty', v: 'empty' }, { l: 'Past', v: 'past-only' }, { l: 'Registered', v: 'default' },
        { l: 'Confirm', v: 'window' }, { l: 'Confirmed', v: 'confirmed' }, { l: 'Live', v: 'live' },
      ] },
      { label: 'Meeting', attr: 'mpdisplay', target: 'mobile', options: [{ l: 'Photo', v: 'photo' }, { l: 'No photo', v: 'list' }] },
      { label: 'Topics', attr: 'tg', target: 'mobile', options: [{ l: 'On', v: 'on' }, { l: 'Off', v: 'off' }] },
    ],
  },
  matching: {
    title: 'Matching <em>flow</em>', group: 'participant',
    mobile: { src: 'Participant Matching.html', w: 432, baseParams: { screen: 'meeting-point' } },
    toggles: [
      { label: 'Screen', param: 'screen', target: 'mobile', options: [
        { l: 'Meeting point', v: 'meeting-point' }, { l: 'No match', v: 'no-match' }, { l: 'Find each other', v: 'find-each-other' },
        { l: 'Networking', v: 'networking' }, { l: 'Contact', v: 'contact-sharing' }, { l: 'Feedback', v: 'wonderelo-feedback' }, { l: 'Missed', v: 'missed-round' },
      ] },
    ],
  },
  account: {
    title: 'Participant <em>account</em>', group: 'participant',
    mobile: { src: 'Participant Account.html', w: 432, baseParams: { screen: 'profile' } },
    toggles: [
      { label: 'Page', param: 'screen', target: 'mobile', options: [{ l: 'Profile', v: 'profile' }, { l: 'Address book', v: 'address-book' }] },
    ],
  },

  // ───────── Organizer ─────────
  promo: {
    title: 'Event promo <em>slide</em>', group: 'organizer',
    desktop: { src: 'Event Promo Slide.html', w: 1920 },
  },
};
