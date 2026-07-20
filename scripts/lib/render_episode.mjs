// Pure render module: episode.mjs → full HTML page string.
// No network/CDN imports. Reuses the approved mockup's <style> block verbatim.
// Design reference: docs/superpowers/plans/assets/episode-mockup.html

const SHOW_URL = 'https://open.spotify.com/show/6bib0887ucySx51e49M3tp';
const SHOW_EMBED_URL = 'https://open.spotify.com/embed/show/6bib0887ucySx51e49M3tp';
const SITE_URL = 'https://thepharmacloseout.com';

// The mockup's <style> block, copied verbatim (minus the mock-only .mock-note
// rule comment header, which is harmless to keep but we drop the ribbon markup
// itself further down — the CSS rule for .mock-note is left in place since the
// instructions say to reuse the block verbatim).
const STYLE_BLOCK = `<style>
  :root{
    --black:#0a0a0a; --ink:#0c0d0f; --gold:#c49332; --gold-2:#dcae54; --gold-dim:rgba(196,147,50,.1);
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

  /* ── annotation ribbon (mockup only — not part of the real page) ── */
  .mock-note{background:#14110a;border-bottom:1px solid var(--rule);color:var(--gold-2);font-size:.74rem;letter-spacing:.04em;text-align:center;padding:8px 16px}
  .mock-note b{color:var(--gold)}

  /* ── nav (matches live site) ── */
  header.nav{border-bottom:1px solid var(--rule);position:sticky;top:0;background:rgba(10,10,10,.86);backdrop-filter:blur(10px);z-index:50}
  .nav-inner{display:flex;align-items:center;justify-content:space-between;height:66px}
  .logo{font-family:var(--font-display);font-weight:600;font-size:1.1rem;letter-spacing:.01em}
  .logo b{color:var(--gold);font-weight:600}
  .nav-links{display:flex;align-items:center;gap:26px;font-size:.82rem}
  .nav-links a{opacity:.72;transition:.18s}
  .nav-links a:hover,.nav-links a.active{opacity:1;color:var(--gold)}
  .nav-links a.sub{color:var(--gold);border:1px solid rgba(196,147,50,.42);padding:8px 17px;border-radius:2px;opacity:1}
  .nav-links a.sub:hover{background:var(--gold-dim)}

  /* ── breadcrumb ── */
  .crumb{font-size:.72rem;letter-spacing:.06em;color:var(--gray-light);padding:26px 0 0}
  .crumb a:hover{color:var(--gold)}
  .crumb span{color:var(--gray)}

  /* ── episode header ── */
  .ep-head{padding:20px 0 30px}
  .eyebrow{font-size:.7rem;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);display:flex;align-items:center;gap:8px;margin-bottom:18px}
  .eyebrow .dot{width:6px;height:6px;border-radius:50%;background:var(--gold)}
  .ep-head h1{font-family:var(--font-display);font-weight:700;font-size:clamp(2.1rem,5vw,3.3rem);line-height:1.05;letter-spacing:-.02em;margin-bottom:20px}
  .ep-meta{display:flex;flex-wrap:wrap;gap:18px;font-size:.8rem;color:var(--gray-light);align-items:center}
  .ep-meta .pill{border:1px solid var(--rule);border-radius:2px;padding:4px 10px;color:var(--white)}

  /* ── listen bar (Spotify first — listener never loses out) ── */
  .listen{margin:14px 0 6px}
  .listen-label{font-size:.68rem;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);margin-bottom:12px}
  .listen iframe{width:100%;border:0;border-radius:12px}
  .listen-alt{margin-top:14px;font-size:.8rem;color:var(--gray-light)}
  .listen-alt a{color:var(--gold);border-bottom:1px solid var(--rule);padding-bottom:1px}

  /* ── summary ── */
  .summary{border-left:2px solid var(--gold);padding:6px 0 6px 22px;margin:30px 0 8px;font-family:var(--font-display);font-size:1.22rem;line-height:1.5;color:#d6d0c6;font-style:italic}

  /* ── the transcript ── */
  .tx-header{display:flex;align-items:center;justify-content:space-between;margin:46px 0 6px;border-top:1px solid var(--rule);padding-top:28px}
  .tx-header h2{font-family:var(--font-display);font-weight:600;font-size:1.5rem}
  .tx-toggle{font-size:.74rem;color:var(--gray-light)}
  .tx-sub{font-size:.8rem;color:var(--gray-light);margin-bottom:26px}

  .seg{font-size:.64rem;letter-spacing:.16em;text-transform:uppercase;color:var(--gold);margin:34px 0 16px;padding-bottom:8px;border-bottom:1px solid var(--rule)}
  .turn{margin-bottom:18px;font-size:1.02rem;line-height:1.72}
  .spk{font-family:var(--font-body);font-weight:500;font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:var(--gold);display:inline-block;min-width:64px}
  .turn.guest .spk{color:var(--gold-2)}
  .turn p{display:inline;color:#cfcabf}

  /* the payoff: deal mentions become links into the DB */
  a.deal{color:var(--gold);border-bottom:1px solid rgba(196,147,50,.42);padding-bottom:1px;transition:.15s;font-weight:500}
  a.deal:hover{background:var(--gold-dim)}
  a.deal::after{content:"\\2197";font-size:.7em;vertical-align:super;margin-left:1px;opacity:.7}

  /* ── related deals rail ── */
  .related{margin:44px 0;border:1px solid var(--rule);border-radius:6px;padding:24px 26px;background:linear-gradient(180deg,rgba(196,147,50,.04),transparent)}
  .related h3{font-family:var(--font-display);font-size:1.15rem;margin-bottom:6px}
  .related .rk{font-size:.72rem;color:var(--gray-light);margin-bottom:18px}
  .related ul{list-style:none;display:grid;gap:10px}
  .related li a{display:flex;justify-content:space-between;gap:14px;font-size:.9rem;padding:10px 0;border-bottom:1px solid var(--rule)}
  .related li a:hover .rn{color:var(--gold)}
  .related .rn{color:var(--white);transition:.15s}
  .related .rv{color:var(--gold);font-variant-numeric:tabular-nums;white-space:nowrap}

  /* ── subscribe CTA ── */
  .cta{margin:50px 0;text-align:center;border:1px solid var(--rule);border-radius:6px;padding:40px 26px}
  .cta .lm-tag{font-size:.66rem;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:12px}
  .cta h3{font-family:var(--font-display);font-weight:600;font-size:1.5rem;margin-bottom:10px}
  .cta p{color:var(--gray-light);font-size:.92rem;max-width:460px;margin:0 auto 22px}
  .cta a.btn{display:inline-block;background:var(--gold);color:#0a0a0a;font-weight:500;font-size:.9rem;padding:13px 28px;border-radius:2px;transition:.18s}
  .cta a.btn:hover{background:var(--gold-2);transform:translateY(-2px)}

  footer{border-top:1px solid var(--rule);margin-top:40px;padding:30px 0;font-size:.78rem;color:var(--gray)}
  footer .wrap{display:flex;justify-content:space-between;flex-wrap:wrap;gap:14px}
  footer a:hover{color:var(--gold)}
  @media(max-width:640px){.nav-links a:not(.sub){display:none}}
</style>`;

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
 * Escape a string for safe use inside a RegExp constructor.
 * @param {string} value
 * @returns {string}
 */
function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
 * Inject a deal link at the first whole-word, case-insensitive occurrence of
 * `entity` within already-escaped HTML text, wrapping it in an anchor. Never
 * injects inside an existing anchor. No-ops if not found.
 * @param {string} html - already-escaped HTML fragment to search within
 * @param {string} entity - raw (unescaped) entity name to find
 * @param {string} href
 * @returns {{ html: string, injected: boolean }}
 */
function injectFirstMention(html, entity, href) {
  const escapedEntity = esc(entity);
  if (!escapedEntity) return { html, injected: false };

  const pattern = new RegExp(`\\b${escapeRegExp(escapedEntity)}\\b`, 'i');
  const match = pattern.exec(html);
  if (!match) return { html, injected: false };

  // Guard: don't inject if the match sits inside an existing <a ...>...</a>.
  const before = html.slice(0, match.index);
  const lastOpenAnchor = before.lastIndexOf('<a ');
  const lastCloseAnchor = before.lastIndexOf('</a>');
  const insideAnchor = lastOpenAnchor !== -1 && lastOpenAnchor > lastCloseAnchor;
  if (insideAnchor) return { html, injected: false };

  const matchedText = match[0];
  const replaced =
    html.slice(0, match.index) +
    `<a class="deal" href="${esc(href)}">${matchedText}</a>` +
    html.slice(match.index + matchedText.length);

  return { html: replaced, injected: true };
}

/**
 * Render a single episode page to a full HTML string.
 * @param {{slug:string,title:string,date:string,description:string,spotifyEpisodeUrl:string,segments:Array<{title:string,turns:Array<{speaker:string,role:string,text:string}>}>}} episode
 * @param {{links:Array<{entity:string,dealId:string,href:string,state:string}>,pending:string[]}} resolved
 * @returns {string}
 */
export function renderEpisode(episode, resolved) {
  const { slug, title, date, description, spotifyEpisodeUrl = '' } = episode;
  const segments = episode.segments ?? [];
  // Episode pages live one level deep (/episodes/), so deal links must be
  // root-absolute ("/deals/..") — a bare "deals/.." would resolve to
  // /episodes/deals/.. and 404.
  const links = (resolved?.links ?? []).map((l) => ({
    ...l,
    href: /^(https?:|\/)/.test(l.href) ? l.href : `/${l.href}`,
  }));

  const canonicalUrl = `${SITE_URL}/episodes/${slug}.html`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'PodcastEpisode',
    url: canonicalUrl,
    name: title,
    datePublished: date,
    timeRequired: 'PT15M',
    description,
    partOfSeries: {
      '@type': 'PodcastSeries',
      name: 'The Pharma Closeout',
      url: SITE_URL,
    },
    associatedMedia: {
      '@type': 'MediaObject',
      contentUrl: spotifyEpisodeUrl || SHOW_URL,
    },
  };

  // --- transcript rendering with best-effort deal-link injection ---
  const injectedDealIds = new Set();
  let transcriptHtml = '';
  if (segments.length > 0) {
    const segmentHtmlParts = segments.map((segment) => {
      const turnsHtml = (segment.turns ?? [])
        .map((turn) => {
          let textHtml = esc(turn.text);

          for (const link of links) {
            if (injectedDealIds.has(link.dealId)) continue;
            const { html: newHtml, injected } = injectFirstMention(textHtml, link.entity, link.href);
            if (injected) {
              textHtml = newHtml;
              injectedDealIds.add(link.dealId);
            }
          }

          const guestClass = turn.role === 'guest' ? ' guest' : '';
          return `  <div class="turn${guestClass}"><span class="spk">${esc(turn.speaker)}</span><p>${textHtml}</p></div>`;
        })
        .join('\n');

      return `  <div class="seg">${esc(segment.title)}</div>\n${turnsHtml}`;
    });

    transcriptHtml = `
  <div class="tx-header">
    <h2>Transcript</h2>
    <span class="tx-toggle">Read along &middot; ~15 min</span>
  </div>
  <p class="tx-sub">Auto-generated from the episode script. Deal names link to their scorecard in the database.</p>

${segmentHtmlParts.join('\n\n')}`;
  }

  // --- "Deals mentioned" rail: safety net, lists EVERY resolved link ---
  let railHtml = '';
  if (links.length > 0) {
    const items = links
      .map((link) => {
        const label = link.buyer && link.target
          ? `${esc(link.buyer)} <span style="color:var(--gray-light)">&rarr;</span> ${esc(link.target)}`
          : esc(link.entity);
        return `      <li><a href="${esc(link.href)}"><span class="rn">${label}</span></a></li>`;
      })
      .join('\n');

    railHtml = `
  <div class="related">
    <h3>Deals mentioned in this episode</h3>
    <div class="rk">Each links to its graded scorecard &mdash; consensus vs. outcome.</div>
    <ul>
${items}
    </ul>
  </div>`;
  }

  const listenAlt = spotifyEpisodeUrl
    ? `\n    <div class="listen-alt">Or listen on <a href="${esc(spotifyEpisodeUrl)}">Spotify</a></div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)} — The Pharma Closeout</title>
<meta name="description" content="${esc(description)}">

<script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
</script>

<link rel="canonical" href="${esc(canonicalUrl)}">
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
${STYLE_BLOCK}
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

<div class="wrap">
  <div class="crumb"><a href="/">Home</a> <span>/</span> <a href="/episodes/index.html">Episodes</a> <span>/</span> ${esc(formatDatePill(date))}</div>
</div>

<div class="read">
  <div class="ep-head">
    <h1>${esc(title)}</h1>
    <div class="ep-meta">
      <span class="pill">${esc(formatDatePill(date))}</span>
      <span>15 min</span>
      <span>Hosts: Alex Mercer &amp; Maya Patel</span>
    </div>
  </div>

  <div class="listen">
    <div class="listen-label">&#9654; Listen</div>
    <iframe src="${esc(SHOW_EMBED_URL)}?utm_source=generator&theme=0" height="152" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title="Spotify player"></iframe>${listenAlt}
  </div>

  <p class="summary">${esc(description)}</p>
${transcriptHtml}
${railHtml}

  <div class="cta">
    <div class="lm-tag">Close out your day</div>
    <h3>The whole read, every morning</h3>
    <p>The daily Closeout in under 15 minutes &mdash; trial readouts, FDA decisions, and the deal math behind them. Free.</p>
    <a href="https://thepharmacloseout.substack.com/subscribe" class="btn">Subscribe &rarr;</a>
  </div>
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
