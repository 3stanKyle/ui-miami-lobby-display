/* Lobby display app. Content below comes from context/01-knowledge-graph.md; change the graph first. */
(function () {
  'use strict';

  var params = new URLSearchParams(location.search);

  var CONFIG = {
    video: { src: 'assets/video/miami-reel.mp4' },
    idleMs: Number(params.get('idle')) || 90000,   // close overlays after this long without a touch
    reloadMs: 6 * 60 * 60 * 1000                   // pick up new content every 6 hours, only while idle on home
  };

  var COPY = {
    eligibility: 'Leader resellers only. Only Ubiquiti purchased through Leader qualifies.',          // RULE-ELIGIBILITY
    finePrint: 'T&Cs apply. *Launch viewing is subject to schedules, weather and operator requirements. Destination imagery is illustrative.', // LEGAL-FINE-PRINT
    period: '1 September – 10 December 2026',                                                          // TIME-PROMO-PERIOD
    order: 'Order through the Leader Dealer Shop or speak to your account manager for more info.'
  };

  var EVENT = {
    name: 'UniFi World Conference Miami',  // EVT-UWC-2027
    date: '12 January 2027',               // TIME-EVENT-DATE
    venue: 'Loews Miami Beach Hotel',      // LOC-LOEWS
    room: 'Americana Ballroom'             // LOC-LOEWS
  };

  var ICON = {
    lens: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>',
    motion: '<path d="M11 3l1.8 5.2L18 10l-5.2 1.8L11 17l-1.8-5.2L4 10l5.2-1.8L11 3Z"/><path d="M18 16v4M16 18h4"/>',
    night: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 7 7 0 0 0 20 14.5Z"/>',
    floorplan: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 12h8M12 4v16M16 12h4"/>',
    wide_angle: '<path d="M12 20 3.5 8.5a14 14 0 0 1 17 0L12 20Z"/>',
    data_uplink: '<path d="M12 21V8M7 13l5-5 5 5M5 3h14"/>',
    zoom: '<circle cx="11" cy="11" r="7"/><path d="m21 21-5-5M11 8v6M8 11h6"/>',
    doors: '<path d="M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M3 21h18M14 12v.01"/>',
    add: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
    art_show: '<rect x="3" y="7" width="18" height="10" rx="1.5"/><path d="M7 11v2M11 11v2M15 11v2"/>',
    waterdrop: '<path d="M12 3s7 7 7 12a7 7 0 0 1-14 0c0-5 7-12 7-12Z"/>',
    poe_outlined: '<path d="M13 2 5 14h6l-1 8 8-12h-6l1-8Z"/>',
    poe_plus_plus_outlined: '<path d="M13 2 5 14h6l-1 8 8-12h-6l1-8Z"/>',
    cameras: '<rect x="3" y="7" width="12" height="10" rx="2"/><path d="m15 11 6-4v10l-6-4"/>',
    sound: '<path d="M4 9v6h4l5 4V5L8 9H4Z"/><path d="M17 9a4 4 0 0 1 0 6"/>',
    apps: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18h2"/>',
    hammer: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z"/><path d="M9 12h6"/>',
    streams: '<path d="M3 8c3-3 6 3 9 0s6 3 9 0M3 16c3-3 6 3 9 0s6 3 9 0"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    security: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z"/>',
    human: '<circle cx="12" cy="7" r="4"/><path d="M4 21c1-5 4-7 8-7s7 2 8 7"/>',
    hdd: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 14h.01M11 14h6"/>',
    radios: '<path d="M5 12a7 7 0 0 1 14 0M8.5 12a3.5 3.5 0 0 1 7 0M12 12v9"/>',
    '5ghz_radio': '<path d="M5 12a7 7 0 0 1 14 0M8.5 12a3.5 3.5 0 0 1 7 0M12 12v9"/>',
    beam: '<path d="M5 12a7 7 0 0 1 14 0M8.5 12a3.5 3.5 0 0 1 7 0M12 12v9"/>',
    rj45_port_v2: '<path d="M5 4h14v12h-3v4H8v-4H5V4Z"/><path d="M9 8v3M12 8v3M15 8v3"/>',
    frame: '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/>',
    playback: '<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4V8Z"/>',
    display: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
    // Prizes
    stage: '<path d="M3 4h18M5 4v10h14V4M12 14v4M8 21l4-3 4 3"/>',
    helicopter: '<path d="M3 4h16M11 4v4M3 9l3 3M6 12h3"/><path d="M9 8h6a5 5 0 0 1 5 5 3 3 0 0 1-3 3h-5a4 4 0 0 1-3-1.4L6 12"/><path d="M11 20h8M13 16l-1 4M17 16l1 4"/>',
    fish: '<path d="M3 12c3-5 9-6 13-3l5-3v12l-5-3c-4 3-10 2-13-3Z"/><path d="M8 11v.01"/>',
    boat: '<path d="M3 16h18l-2 4H5l-2-4Z"/><path d="M6 16V9h9l4 7M9 9V5h3l2 4"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"/>',
    // Event
    calendar: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/>',
    pin: '<path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
    // Ways to win
    growth: '<path d="M4 20V14M10 20v-9M16 20v-5M3 8l6-4 5 3 7-5M17 2h4v4"/>',
    tickets: '<path d="M3 8h12v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4V8Z"/><path d="M8 6V5h13v3a2 2 0 0 0 0 4v3h-3"/>',
    handshake: '<path d="M2 8l4-2 6 2 6-2 4 2v7l-4 1-6 4-6-4-4-1V8Z"/><path d="M8 13l3 2.5M11 11l4 3.5M12 8l-3 3 1.5 1"/>'
  };
  function icon(name) {
    return '<svg class="i" viewBox="0 0 24 24" aria-hidden="true">' + (ICON[name] || ICON.add) + '</svg>';
  }
  var CLOSE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';

  var PRIZES = [
    { icon: 'stage', label: 'Attend UniFi World Conference' },
    { icon: 'helicopter', label: 'Helicopter / Space-Launch Experience*' },
    { icon: 'fish', label: 'Offshore Fishing' },
    { icon: 'boat', label: 'Everglades Airboat Tour' },
    { icon: 'sun', label: 'Miami Experience' }
  ];

  // Order and wording follow the lobby layout. Differences from the WIN-* nodes are logged against CH-LOBBY in the graph.
  var WAYS = [
    { id: 'spin', icon: 'tickets', winners: '2 Winners', title: 'Spend & Spin', text: '1 entry for every $2,500 spent on Ubiquiti gets you in the draw.' },
    { id: 'growth', icon: 'growth', winners: '1 Winner', title: 'Revenue Growth', text: 'Highest UniFi revenue growth Year-on-Year.' },
    { id: 'enterprise', icon: 'handshake', winners: '1 Winner', title: 'UniFi Enterprise', text: 'Highest total value of UniFi Enterprise deal registrations.' },
    { id: 'access', icon: 'doors', winners: '1 Winner', title: 'UniFi Access', text: 'Highest UniFi Access sales.' },
    { id: 'protect', icon: 'cameras', winners: '1 Winner', title: 'UniFi Protect', text: 'Highest UniFi Protect sales.' }
  ];

  var RANGES = {
    access: { cta: 'View Access Range', legend: 'Available for deal registration' },
    enterprise: { cta: 'View Enterprise Range', legend: 'Deal registration required. UniFi Partner Program.' },
    protect: { cta: 'View Protect Range', legend: 'Available for deal registration' }
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function $(id) { return document.getElementById(id); }
  function way(id) { return WAYS.filter(function (w) { return w.id === id; })[0]; }

  /* ---------- Stage scaling: designed at 1920 x 1080. The stage takes the player's exact shape, so
     there are never bars: the spare width or height goes to the layout (see the Home rules in app.css). ---------- */
  function fit() {
    var w = window.innerWidth, h = window.innerHeight;
    var s = Math.min(w / 1920, h / 1080);
    var stage = $('stage');
    stage.style.width = Math.ceil(w / s) + 'px';   // whole pixels, so no hairline of the page shows at the edges
    stage.style.height = Math.ceil(h / s) + 'px';
    stage.style.transform = 'scale(' + s + ')';
  }
  window.addEventListener('resize', fit);
  fit();

  /* ---------- Home ---------- */
  function prizeList() {
    return PRIZES.map(function (p) {
      return '<li>' + icon(p.icon) + '<span>' + esc(p.label) + '</span></li>';
    }).join('');
  }

  function eventList() {
    return '<li>' + icon('stage') + '<span class="lead">' + esc(EVENT.name) + '</span></li>' +
      [['calendar', EVENT.date], ['pin', EVENT.venue], ['doors', EVENT.room]].map(function (row) {
        return '<li>' + icon(row[0]) + '<span>' + esc(row[1]) + '</span></li>';
      }).join('');
  }

  function wayAction(w) {
    return RANGES[w.id]
      ? '<button class="way-link" type="button" data-open-range="' + w.id + '">' + esc(RANGES[w.id].cta) + '</button>'
      : '';
  }

  // Home row: plain columns on the black stage.
  function wayColumn(w) {
    return '<article class="way"><span class="winner">' + esc(w.winners) + '</span><h3>' + esc(w.title) + '</h3><p>' + esc(w.text) + '</p>' + wayAction(w) + '</article>';
  }

  // How It Works overlay: cards with icons.
  function wayCard(w) {
    return '<article class="way-card">' + icon(w.icon) + '<span class="winner">' + esc(w.winners.toUpperCase()) + '</span><h3>' + esc(w.title) + '</h3><p>' + esc(w.text) + '</p>' + wayAction(w) + '</article>';
  }

  function setPromoTab(name) {
    ['prize', 'event'].forEach(function (n) {
      $('promoTab-' + n).setAttribute('aria-selected', n === name ? 'true' : 'false');
      $('promoPanel-' + n).hidden = n !== name;
    });
  }

  function renderHome() {
    $('promoPeriod').textContent = 'Promo Period: ' + COPY.period;
    $('prizes').innerHTML = prizeList();
    $('eventList').innerHTML = eventList();
    $('waysRow').innerHTML = WAYS.map(wayColumn).join('');

    $('homeLegal').innerHTML =
      esc(COPY.eligibility) + ' ' + esc(COPY.finePrint) + ' ' + esc(COPY.order);
  }

  /* ---------- Overlays ---------- */
  var scrim = $('scrim'), sheet = $('sheet');
  var state = { range: null, tab: 'All', lastFocus: null };

  function openSheet(html) {
    sheet.innerHTML = html;
    if (scrim.hidden) {
      state.lastFocus = document.activeElement;
      scrim.hidden = false;
      setVideo(false);
    }
    sheet.setAttribute('tabindex', '-1');
    sheet.focus();
  }

  function closeSheet() {
    if (scrim.hidden) return;
    scrim.hidden = true;
    sheet.innerHTML = '';
    state.range = null;
    setVideo(true);
    if (state.lastFocus && state.lastFocus.focus) state.lastFocus.focus();
  }

  function head(title, sub) {
    return '<header class="sheet-head"><div><h2 id="sheetTitle">' + title + '</h2>' +
      '<div class="sheet-sub">' + sub + '</div></div>' +
      '<button class="close" type="button" data-close>' + CLOSE_ICON + 'Close</button></header>';
  }

  function foot() {
    return '<footer class="sheet-foot"><strong>' + COPY.period + '.</strong> ' + esc(COPY.eligibility) + ' ' +
      esc(COPY.finePrint) + ' ' + esc(COPY.order) + '</footer>';
  }

  function productCard(p) {
    var specs = (p.specs || []).map(function (s) {
      return '<li>' + icon(s.i) + '<span>' + esc(s.v) + '</span></li>';
    }).join('');
    return '<article class="product">' +
      '<div class="product-img"><img src="assets/products/' + esc(p.slug) + '.webp" alt="' + esc(p.title) + '" loading="lazy">' +
      (p.badge ? '<img class="product-badge" src="assets/logos/partner-program.png" alt="UniFi Partner Program">' : '') + '</div>' +
      '<h3>' + esc(p.title) + '</h3><div class="sku">' + esc(p.sku) + '</div>' +
      '<p class="desc">' + esc(p.desc) + '</p>' +
      (specs ? '<ul class="specs">' + specs + '</ul>' : '') +
      '</article>';
  }

  function rangeProducts(id) {
    return window.CATALOG.products.filter(function (p) { return p.range === id; });
  }

  function renderGrid() {
    var all = rangeProducts(state.range);
    var rows = state.tab === 'All' ? all : all.filter(function (p) { return p.tab === state.tab; });
    var scroller = sheet.querySelector('.grid-scroll');
    scroller.innerHTML = '<div class="grid">' + rows.map(productCard).join('') + '</div>';
    scroller.scrollTop = 0;
    [].forEach.call(sheet.querySelectorAll('.tab'), function (t) {
      t.setAttribute('aria-selected', t.dataset.tab === state.tab ? 'true' : 'false');
    });
  }

  function openRange(id) {
    var w = way(id), r = RANGES[id], all = rangeProducts(id);
    state.range = id;
    state.tab = 'All';
    var tabs = [{ t: 'All', n: all.length }].concat(window.CATALOG.tabs[id].map(function (t) {
      return { t: t, n: all.filter(function (p) { return p.tab === t; }).length };
    }).filter(function (x) { return x.n > 0; }));
    var hasBadge = all.some(function (p) { return p.badge; });
    openSheet(
      head(esc(w.title) + ' Range', '<span class="winner">' + esc(w.winners.toUpperCase()) + '</span><span>' + esc(w.text) + '</span>') +
      '<div class="sheet-bar"><div class="tabs" role="tablist">' + tabs.map(function (x) {
        return '<button class="tab" type="button" role="tab" data-tab="' + esc(x.t) + '">' + esc(x.t) + ' (' + x.n + ')</button>';
      }).join('') + '</div>' +
      (hasBadge ? '<div class="legend"><img src="assets/logos/partner-program.png" alt="">' + esc(r.legend) + '</div>' : '') +
      '</div><div class="grid-wrap"><div class="grid-scroll"></div></div>' + foot()
    );
    renderGrid();
  }

  function openHow() {
    state.range = null;
    openSheet(
      head('Five Ways. Six Winners.', '<span>' + COPY.period + '. ' + esc(COPY.eligibility) + '</span>') +
      '<div class="how"><div class="how-ways">' + WAYS.map(wayCard).join('') + '</div>' +
      '<div class="how-lower">' +
      '<div class="how-panel"><h3>The Prize</h3><ul class="prizes">' + prizeList() + '</ul></div>' +
      '<div class="how-panel"><h3>The Event</h3><p><strong>' + esc(EVENT.name) + '</strong><br>' + EVENT.date + '<br>' + esc(EVENT.venue) + '<br>' + esc(EVENT.room) + '</p></div>' +
      '<div class="how-panel value"><div class="big">$15,000</div><div class="big-label">Package Value Per Winner</div></div>' +
      '</div></div>' + foot()
    );
  }

  /* ---------- Touch handling. One delegated listener, so re-rendering never loses a handler ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target;
    var promoTab = t.closest('[data-promo-tab]');
    if (promoTab) return setPromoTab(promoTab.dataset.promoTab);
    if (t.closest('[data-close]')) return closeSheet();
    var link = t.closest('[data-open-range]');
    if (link) return openRange(link.dataset.openRange);
    var tab = t.closest('.tab');
    if (tab) { state.tab = tab.dataset.tab; return renderGrid(); }
    if (t === scrim) closeSheet();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeSheet();
  });
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  document.addEventListener('dragstart', function (e) { e.preventDefault(); });

  /* ---------- Video ---------- */
  var video = $('heroVideo');
  function setVideo(play) {
    if (play) {
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    } else {
      video.pause();
    }
  }
  video.src = CONFIG.video.src;
  setVideo(true);
  // Keep the hero moving on home. play() alone can't recover a failed or hung video, so reload the
  // source if it errored or made no progress since the last check.
  var lastVideoTime = -1;
  setInterval(function () {
    if (!scrim.hidden) { lastVideoTime = -1; return; }
    var stuck = lastVideoTime >= 0 && !video.paused && video.currentTime === lastVideoTime;
    if (video.error || stuck) {
      lastVideoTime = -1;
      video.load();
      setVideo(true);
      return;
    }
    if (video.paused) setVideo(true);
    lastVideoTime = video.currentTime;
  }, 10000);

  /* ---------- Idle reset ---------- */
  var idleTimer = null, lastTouch = Date.now();
  function resetHome() {
    closeSheet();
    setPromoTab('prize');
  }
  function touched() {
    lastTouch = Date.now();
    clearTimeout(idleTimer);
    idleTimer = setTimeout(resetHome, CONFIG.idleMs);
  }
  ['pointerdown', 'touchstart', 'wheel', 'keydown'].forEach(function (ev) {
    document.addEventListener(ev, touched, { passive: true, capture: true });
  });
  // The scroller catches its own scroll events, so listen in the capture phase.
  document.addEventListener('scroll', touched, { passive: true, capture: true });
  touched();

  var loadedAt = Date.now();
  setInterval(function () {
    if (!scrim.hidden || Date.now() - loadedAt <= CONFIG.reloadMs || Date.now() - lastTouch <= CONFIG.idleMs) return;
    // Only reload if the server answers. Otherwise keep this page running and try again next minute.
    fetch(location.href, { cache: 'no-store' }).then(function (r) {
      if (r.ok && scrim.hidden) location.reload();
    }).catch(function () {});
  }, 60000);

  /* ---------- Start ---------- */
  renderHome();

  // Decode product renders in the background so tab changes never pop in.
  (function preload() {
    var seen = {}, queue = window.CATALOG.products.filter(function (p) {
      if (seen[p.slug]) return false;
      seen[p.slug] = 1;
      return true;
    });
    (function next() {
      var p = queue.shift();
      if (!p) return;
      var img = new Image();
      img.onload = img.onerror = function () { setTimeout(next, 30); };
      img.src = 'assets/products/' + p.slug + '.webp';
    })();
  })();

  // Deep links for testing: ?tab=event, ?open=access | enterprise | protect | how
  if (params.get('tab') === 'event') setPromoTab('event');
  var open = params.get('open');
  if (open === 'how') openHow();
  else if (RANGES[open]) openRange(open);
})();
