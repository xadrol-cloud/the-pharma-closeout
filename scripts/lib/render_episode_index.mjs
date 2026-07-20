// Pure render module: episode list → full HTML index page string.
// No network/CDN imports.

const SITE_URL = 'https://thepharmacloseout.com';

/**
 * Escape a string for safe inclusion in HTML text/attribute content.
 * @param {string} value
 * @returns {string}
 */
function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Format an ISO date (YYYY-MM-DD) as e.g. "Sun, Jul 19, 2026".
 * @param {string} isoDate
 * @returns {string}
 */
function formatDatePill(isoDate) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Render the episode index page (reverse-chronological listing).
 * @param {Array<{slug:string,title:string,date:string}>} list
 * @returns {string}
 */
export function renderEpisodeIndex(list) {
  const episodes = [...(list ?? [])].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'PodcastSeries',
    name: 'The Pharma Closeout',
    url: SITE_URL,
  };

  const itemsHtml = episodes
    .map(
      (ep) => `      <li class="ep-row">
        <a href="${esc(ep.slug)}.html">
          <span class="ep-title">${esc(ep.title)}</span>
          <span class="ep-date">${esc(formatDatePill(ep.date))}</span>
        </a>
      </li>`
    )
    .join('\n');

  const listHtml =
    episodes.length > 0
      ? `<ul class="ep-list">\n${itemsHtml}\n    </ul>`
      : `<p class="ep-empty">No episodes yet. Check back soon.</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Episodes — The Pharma Closeout</title>
<meta name="description" content="All episodes of The Pharma Closeout, the daily pharma and biotech intelligence podcast.">

<script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
</script>

<link rel="canonical" href="${SITE_URL}/episodes/index.html">
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root{
    --black:#0a0a0a; --gold:#c49332; --gold-2:#dcae54; --gold-dim:rgba(196,147,50,.1);
    --white:#e8e4de; --gray:#6b6b6b; --gray-light:#9a948b; --rule:rgba(196,147,50,.16);
    --font-body:'DM Sans',system-ui,sans-serif;
    --font-display:'Newsreader',Georgia,serif;
    --maxw:1200px;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  html{scroll-behavior:smooth}
  body{background:var(--black);color:var(--white);font-family:var(--font-body);-webkit-font-smoothing:antialiased;line-height:1.6;overflow-x:hidden}
  a{color:inherit;text-decoration:none}
  .wrap{max-width:var(--maxw);margin:0 auto;padding:0 32px}
  .read{max-width:760px;margin:0 auto;padding:0 32px}

  header.nav{border-bottom:1px solid var(--rule);position:sticky;top:0;background:rgba(10,10,10,.86);backdrop-filter:blur(10px);z-index:50}
  .nav-inner{display:flex;align-items:center;justify-content:space-between;height:66px}
  .logo{font-family:var(--font-display);font-weight:600;font-size:1.1rem;letter-spacing:.01em}
  .logo b{color:var(--gold);font-weight:600}
  .nav-links{display:flex;align-items:center;gap:26px;font-size:.82rem}
  .nav-links a{opacity:.72;transition:.18s}
  .nav-links a:hover,.nav-links a.active{opacity:1;color:var(--gold)}
  .nav-links a.sub{color:var(--gold);border:1px solid rgba(196,147,50,.42);padding:8px 17px;border-radius:2px;opacity:1}
  .nav-links a.sub:hover{background:var(--gold-dim)}

  .page-head{padding:40px 0 20px}
  .page-head h1{font-family:var(--font-display);font-weight:700;font-size:clamp(2.1rem,5vw,3.3rem);line-height:1.05;letter-spacing:-.02em}

  .ep-list{list-style:none;display:grid;gap:2px;margin:20px 0 60px}
  .ep-row a{display:flex;justify-content:space-between;gap:14px;padding:18px 0;border-bottom:1px solid var(--rule);transition:.15s}
  .ep-row a:hover .ep-title{color:var(--gold)}
  .ep-title{font-family:var(--font-display);font-size:1.1rem;color:var(--white);transition:.15s}
  .ep-date{font-size:.8rem;color:var(--gray-light);white-space:nowrap;padding-top:4px}
  .ep-empty{color:var(--gray-light);padding:40px 0}

  footer{border-top:1px solid var(--rule);margin-top:40px;padding:30px 0;font-size:.78rem;color:var(--gray)}
  footer .wrap{display:flex;justify-content:space-between;flex-wrap:wrap;gap:14px}
  footer a:hover{color:var(--gold)}
  @media(max-width:640px){.nav-links a:not(.sub){display:none}}
</style>
</head>
<body>

<header class="nav">
  <div class="wrap nav-inner">
    <div class="logo">The Pharma <b>Closeout</b></div>
    <nav class="nav-links">
      <a href="/deals.html">Deal Database</a>
      <a href="/ai-research.html">Research</a>
      <a href="/episodes/index.html" class="active">Episodes</a>
      <a href="/about.html">About</a>
      <a href="https://thepharmacloseout.substack.com/subscribe" class="sub">Subscribe</a>
    </nav>
  </div>
</header>

<div class="read">
  <div class="page-head">
    <h1>Episodes</h1>
  </div>

  ${listHtml}
</div>

<footer>
  <div class="wrap">
    <span>The Pharma Closeout &middot; Daily pharma intelligence</span>
    <span><a href="/deals.html">Deal Database</a> &nbsp;&middot;&nbsp; <a href="/episodes/index.html">Episodes</a> &nbsp;&middot;&nbsp; <a href="/ai-research.html">Research</a> &nbsp;&middot;&nbsp; <a href="/about.html">About</a></span>
  </div>
</footer>

</body>
</html>
`;
}
