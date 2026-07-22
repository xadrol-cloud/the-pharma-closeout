/* Homepage "Latest deals" coverflow.
 * Reads assets/latest-deals.json (auto-refreshed nightly by the SSG) and renders
 * the deal-app poster component. Center poster is focused/enlarged and auto-plays
 * the logo-ring animation; arrows / dots / swipe shift focus; each poster links to
 * its detail page. Poster markup mirrors renderPoster('carousel') in deals.js. */
(function () {
  var stage = document.getElementById('dlStage');
  if (!stage) return;
  var dots = document.getElementById('dlDots');
  var wrap = document.querySelector('.dl-cf');
  var section = document.querySelector('.dl-latest');

  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function has(t, x) { return (t || '').toLowerCase().indexOf(x) > -1; }
  function bgClass(t) { if (has(t, 'licens') || has(t, 'option')) return 'bg-lic'; if (has(t, 'co-dev') || has(t, 'codev') || has(t, 'collab')) return 'bg-codev'; if (has(t, 'asset')) return 'bg-asset'; return 'bg-ma'; }
  function ringClass(t) { if (has(t, 'licens') || has(t, 'option')) return 'lic-ring'; if (has(t, 'co-dev') || has(t, 'codev') || has(t, 'collab')) return 'codev-ring'; if (has(t, 'asset')) return 'asset-ring'; return ''; }
  function shortType(t) { if (has(t, 'licens')) return 'LICENSE'; if (has(t, 'co-dev') || has(t, 'collab')) return 'CO-DEV'; if (has(t, 'asset')) return 'ASSET'; if (has(t, 'take-priv')) return 'TAKE-PRIV'; return 'M&A'; }
  function yearOf(d) { return (d || '').slice(0, 4); }
  function logoUrl(lp, dom) { if (lp) return '/assets/' + lp; if (dom) return 'https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://' + dom + '&size=128'; return null; }
  function initials(n) { return (n || '').split(/\s+/).slice(0, 2).map(function (w) { return w[0] || ''; }).join('').toUpperCase(); }
  function fmtVal(v) { if (v == null) return 'Undisclosed'; return v >= 1000 ? ('$' + (v / 1000).toFixed(1) + 'B') : ('$' + v + 'M'); }
  function parseTAs(ta) { try { var a = Array.isArray(ta) ? ta : JSON.parse(ta); return a.slice(0, 2).join(' · '); } catch (e) { return ta || ''; } }
  function logoHtml(lp, dom, name) {
    var u = logoUrl(lp, dom);
    if (u) return '<img src="' + u + '" alt="' + esc(name) + '" onerror="this.parentElement.innerHTML=\'<span class=&quot;c-logo-text&quot;>' + esc(initials(name)) + '</span>\'">';
    return '<span class="c-logo-text">' + esc(initials(name)) + '</span>';
  }
  function chips(cs, os) {
    var csc = '<div class="c-sc ct"><span class="c-sc-label">CS</span>' + cs + '</div>';
    var osc = '<div class="c-sc os"><span class="c-sc-label">OS</span>' + os + '</div>';
    var osl = '<div class="c-sc lk"><span class="c-sc-label">OS</span>&mdash;</div>';
    if (cs != null && os != null) return csc + osc;
    if (cs != null) return csc + osl;
    if (os != null) return osc;
    return '<span class="c-sc pending">Score pending</span>';
  }
  function poster(d) {
    var cs = d.critic_score != null ? Math.round(d.critic_score) : null;
    var os = d.outcome_score != null ? Math.round(d.outcome_score) : null;
    return '<a href="' + esc(d.url) + '" data-deal-id="' + esc(d.deal_id) + '" style="text-decoration:none">'
      + '<div class="c-poster ' + ringClass(d.deal_type) + '">'
      + '<div class="c-bg ' + bgClass(d.deal_type) + '"></div><div class="c-grain"></div><div class="c-vig"></div><div class="c-edge"></div>'
      + '<div class="c-content"><div class="c-top"><span class="c-type">' + esc(shortType(d.deal_type)) + '</span><span class="c-year">' + esc(yearOf(d.announcement_date)) + '</span></div>'
      + '<div class="c-center"><div class="c-logos"><div class="c-logo">' + logoHtml(d.buyer_logo_local_path, d.buyer_domain, d.buyer_name) + '</div><span class="c-times">&times;</span><div class="c-logo">' + logoHtml(d.target_logo_local_path, d.target_domain, d.target_name) + '</div></div>'
      + '<div class="c-buyer">' + esc(d.buyer_name) + '</div><div class="c-target">' + esc(d.target_name) + '</div></div>'
      + '<div class="c-bottom"><span class="c-ta">' + esc(parseTAs(d.therapeutic_areas)) + '</span><span class="c-value">' + esc(fmtVal(d.deal_value_usd_mm)) + '</span></div></div>'
      + '<div class="c-scores">' + chips(cs, os) + '</div></div></a>';
  }

  var DEALS = [], center = 0, slots = [];
  function place() {
    var n = DEALS.length;
    slots.forEach(function (slot, i) {
      var rel = (i - center + n) % n;
      slot.className = 'dl-slot';
      if (rel === 0) { slot.classList.add('center'); slot.style.order = 2; }
      else if (rel === 1) { slot.classList.add('side', 'pos-right'); slot.style.order = 3; }
      else { slot.classList.add('side', 'pos-left'); slot.style.order = 1; }
    });
    if (dots) Array.prototype.forEach.call(dots.children, function (d, i) { d.classList.toggle('on', i === center); });
  }
  function go(delta) { center = (center + delta + DEALS.length) % DEALS.length; place(); }
  function build() {
    stage.innerHTML = '';
    slots = DEALS.map(function (d, i) {
      var slot = document.createElement('div');
      slot.className = 'dl-slot';
      slot.innerHTML = poster(d);
      slot.addEventListener('click', function (e) { if (!slot.classList.contains('center')) { e.preventDefault(); center = i; place(); } }, true);
      stage.appendChild(slot);
      return slot;
    });
    if (dots) {
      dots.innerHTML = '';
      DEALS.forEach(function (_, i) {
        var b = document.createElement('button');
        b.className = 'dl-dot'; b.type = 'button'; b.setAttribute('aria-label', 'Deal ' + (i + 1));
        b.addEventListener('click', function () { center = i; place(); });
        dots.appendChild(b);
      });
    }
    place();
  }

  var la = wrap && wrap.querySelector('.dl-arrow.l'), ra = wrap && wrap.querySelector('.dl-arrow.r');
  if (la) la.addEventListener('click', function () { go(-1); });
  if (ra) ra.addEventListener('click', function () { go(1); });
  var tx = 0;
  stage.addEventListener('touchstart', function (e) { tx = e.changedTouches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); }, { passive: true });

  fetch('assets/latest-deals.json').then(function (r) { return r.json(); }).then(function (j) {
    DEALS = (j && j.deals) || [];
    if (!DEALS.length) { if (section) section.style.display = 'none'; return; }
    center = 0; build();
  }).catch(function () { if (section) section.style.display = 'none'; });
})();
