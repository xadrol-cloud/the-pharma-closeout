// assets/nav.js
// Shared hamburger nav toggle. Loaded by all pages via <script defer src="...">.
// Markup contract (must exist on each page):
//   <button class="nav-toggle" aria-expanded="false" aria-controls="nav-links">...</button>
//   <ul id="nav-links" class="nav-links" data-collapsed="true">...</ul>

(function () {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.getElementById('nav-links');
  if (!toggle || !links) return;

  function open() {
    toggle.setAttribute('aria-expanded', 'true');
    links.setAttribute('data-collapsed', 'false');
  }
  function close() {
    toggle.setAttribute('aria-expanded', 'false');
    links.setAttribute('data-collapsed', 'true');
  }
  function isOpen() {
    return toggle.getAttribute('aria-expanded') === 'true';
  }

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    isOpen() ? close() : open();
  });

  // Close on link tap (lets navigation proceed naturally)
  links.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => close());
  });

  // Close on click outside
  document.addEventListener('click', (e) => {
    if (!isOpen()) return;
    if (toggle.contains(e.target) || links.contains(e.target)) return;
    close();
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) close();
  });
})();
