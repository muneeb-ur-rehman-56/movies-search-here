const $ = (s) => document.querySelector(s);
const IMG = 'https://image.tmdb.org/t/p/';

const SECTIONS = [
  { id: 'hi', name: 'Hindi / Bollywood' },
  { id: 'pa', name: 'Punjabi' },
  { id: 'en', name: 'English / Hollywood' },
  { id: 'ta', name: 'Tamil' },
  { id: 'te', name: 'Telugu' },
  { id: 'ur', name: 'Urdu' },
  { id: 'ko', name: 'Korean' },
  { id: 'ja', name: 'Japanese' },
  { id: 'es', name: 'Spanish' },
  { id: 'fr', name: 'French' },
];
const LANG_NAMES = Object.fromEntries(SECTIONS.map((s) => [s.id, s.name.split(' /')[0]]));
const state = { mode: 'home', q: '', lang: '', sort: 'popular', page: 1, total: 1, items: [] };

async function api(path, params = {}) {
  const r = await fetch('/api' + path + '?' + new URLSearchParams(params));
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Something went wrong. Please try again.');
  return d;
}
function showError(msg) {
  const box = $('#error');
  box.classList.toggle('hidden', !msg);
  if (msg) box.querySelector('p').textContent = msg;
}
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const year = (d) => (d ? d.slice(0, 4) : 'TBA');

function card(m) {
  const poster = m.poster_path
    ? `<img loading="lazy" src="${IMG}w342${m.poster_path}" alt="Poster of ${esc(m.title)}">`
    : `<div class="noimg">${esc(m.title)}</div>`;
  const rating = m.vote_average ? `<span class="rating">&#9733; ${m.vote_average.toFixed(1)}</span>` : '';
  const lang = m.original_language ? `<span class="lang">${esc(m.original_language.toUpperCase())}</span>` : '';
  return `<button class="card" data-id="${m.id}" aria-label="${esc(m.title)}, ${year(m.release_date)}">
    <div class="poster">${poster}${rating}${lang}</div>
    <h3>${esc(m.title)}</h3><p>${year(m.release_date)}</p></button>`;
}
const skeletons = (n, cls = '') => Array.from({ length: n }, () => `<div class="skeleton aspect-[2/3] ${cls}"></div>`).join('');

/* ---------- Hero ---------- */
let heroItems = [], heroIdx = 0;
async function loadHero() {
  try {
    const d = await api('/trending');
    heroItems = d.results.filter((m) => m.backdrop_path).slice(0, 6);
    renderHero();
    setInterval(() => { if (state.mode === 'home' && heroItems.length) { heroIdx = (heroIdx + 1) % heroItems.length; renderHero(); } }, 8000);
  } catch (e) { showError(e.message); }
}
function renderHero() {
  const m = heroItems[heroIdx];
  if (!m) return;
  $('#heroBg').style.backgroundImage = `url(${IMG}w1280${m.backdrop_path})`;
  $('#heroTitle').textContent = m.title;
  $('#heroText').textContent = m.overview;
  const b = $('#heroBtn');
  b.classList.remove('hidden');
  b.onclick = () => openModal(m.id);
}

/* ---------- Language sections ---------- */
function buildSections() {
  $('#topNav').innerHTML = SECTIONS.slice(0, 6).map((s) => `<a class="nav-link" href="#sec-${s.id}">${esc(s.name.split(' /')[0])}</a>`).join('');
  $('#sections').innerHTML = SECTIONS.map((s) => `
    <section id="sec-${s.id}" data-lang="${s.id}" data-sort="popular" class="scroll-mt-24">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 class="font-display font-bold text-xl md:text-2xl">${esc(s.name)} movies</h2>
        <div class="flex items-center gap-2">
          <button class="chip" data-sort="popular" aria-pressed="true">Popular</button>
          <button class="chip" data-sort="new" aria-pressed="false">New releases</button>
          <button class="btn-ghost !py-1.5 !px-4 !text-xs" data-seeall="${s.id}">See all</button>
        </div>
      </div>
      <div class="row" data-row>${skeletons(8, 'flex-none w-[148px] md:w-[170px]')}</div>
    </section>`).join('');
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { io.unobserve(e.target); fillRow(e.target); }
  }), { rootMargin: '300px' });
  document.querySelectorAll('#sections section').forEach((s) => io.observe(s));
}
async function fillRow(sec) {
  const row = sec.querySelector('[data-row]');
  try {
    const d = await api('/discover', { lang: sec.dataset.lang, sort: sec.dataset.sort });
    row.innerHTML = d.results.length ? d.results.map(card).join('') : '<p class="text-mist text-sm py-6">No movies found in this section right now.</p>';
  } catch (e) { row.innerHTML = ''; showError(e.message); }
}

/* ---------- Results grid (search and "See all") ---------- */
function setMode(mode) {
  state.mode = mode;
  const home = mode === 'home';
  $('#hero').classList.toggle('hidden', !home);
  $('#sections').classList.toggle('hidden', !home);
  $('#results').classList.toggle('hidden', home);
  window.scrollTo({ top: 0 });
}
function fillLangFilter() {
  $('#langFilter').innerHTML = '<option value="">All languages</option>' +
    SECTIONS.map((s) => `<option value="${s.id}">${esc(LANG_NAMES[s.id])}</option>`).join('');
  $('#langFilter').value = '';
}
async function loadGrid(reset) {
  showError('');
  if (reset) { state.page = 1; state.items = []; $('#grid').innerHTML = skeletons(12); $('#empty').classList.add('hidden'); }
  $('#loadMore').classList.add('hidden');
  try {
    const d = state.mode === 'search'
      ? await api('/search', { q: state.q, page: state.page })
      : await api('/discover', { lang: state.lang, sort: state.sort, page: state.page });
    state.total = d.total_pages;
    state.items = state.items.concat(d.results);
    if (reset) $('#resultsCount').textContent = `${d.total_results.toLocaleString()} movies found`;
    renderGrid();
  } catch (e) { $('#grid').innerHTML = ''; showError(e.message); }
}
function renderGrid() {
  const f = $('#langFilter').value;
  const list = state.mode === 'search' && f ? state.items.filter((m) => m.original_language === f) : state.items;
  $('#grid').innerHTML = list.map(card).join('');
  $('#empty').classList.toggle('hidden', list.length > 0);
  $('#loadMore').classList.toggle('hidden', state.page >= state.total);
}
function startSearch(q) {
  state.q = q;
  setMode('search');
  $('#resultsTitle').textContent = `Results for "${q}"`;
  $('#langFilter').classList.remove('hidden'); $('#langLabel').classList.remove('hidden');
  fillLangFilter();
  loadGrid(true);
}
function startSeeAll(lang, sort) {
  state.lang = lang; state.sort = sort;
  setMode('lang');
  $('#resultsTitle').textContent = `${LANG_NAMES[lang]} movies - ${sort === 'new' ? 'new releases' : 'popular'}`;
  $('#langFilter').value = '';
  $('#langFilter').classList.add('hidden'); $('#langLabel').classList.add('hidden');
  loadGrid(true);
}

/* ---------- Details modal ---------- */
async function openModal(id) {
  const modal = $('#modal');
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  $('#modalBody').innerHTML = '<div class="p-16 text-center text-mist">Loading movie details...</div>';
  try {
    const m = await api('/movie/' + id);
    const back = m.backdrop_path ? `<div class="h-48 md:h-64 bg-cover bg-center" style="background-image:url(${IMG}w780${m.backdrop_path})"><div class="h-full hero-fade"></div></div>` : '<div class="h-16"></div>';
    const poster = m.poster_path ? `<img class="w-32 md:w-44 rounded-xl border border-line shrink-0 -mt-20 md:-mt-28 relative" src="${IMG}w342${m.poster_path}" alt="Poster of ${esc(m.title)}">` : '';
    const meta = [year(m.release_date), m.runtime ? `${Math.floor(m.runtime / 60)}h ${m.runtime % 60}m` : '', LANG_NAMES[m.original_language] || (m.original_language || '').toUpperCase()].filter(Boolean).join(' | ');
    $('#modalBody').innerHTML = `${back}
      <div class="p-5 md:p-8 flex gap-5 md:gap-8">${poster}
        <div class="min-w-0">
          <h2 class="font-display font-bold text-2xl md:text-3xl">${esc(m.title)}</h2>
          ${m.tagline ? `<p class="text-mist italic mt-1">${esc(m.tagline)}</p>` : ''}
          <p class="mt-3 text-sm text-mist">${esc(meta)}${m.vote_average ? ` | <span class="text-gold font-bold">&#9733; ${m.vote_average.toFixed(1)}</span>/10` : ''}</p>
          <div class="mt-3 flex flex-wrap gap-2">${(m.genres || []).map((g) => `<span class="tag">${esc(g.name)}</span>`).join('')}</div>
        </div>
      </div>
      <div class="px-5 md:px-8 pb-8">
        <p class="text-sm leading-relaxed max-w-prose">${esc(m.overview) || 'No description is available for this movie yet.'}</p>
        ${m.director ? `<p class="mt-4 text-sm"><span class="text-mist">Director:</span> ${esc(m.director)}</p>` : ''}
        ${m.cast.length ? `<p class="mt-1 text-sm"><span class="text-mist">Cast:</span> ${m.cast.map(esc).join(', ')}</p>` : ''}
        <div id="trailerBox" class="mt-6">${m.trailer ? '<button id="trailerBtn" class="btn-main">Watch trailer</button>' : '<p class="text-sm text-mist">No trailer is available for this movie.</p>'}</div>
        <a class="btn-ghost mt-4 !text-xs" href="${window.ADS_SMARTLINK}" target="_blank" rel="noopener sponsored">Sponsored link</a>
      </div>`;
    const tb = $('#trailerBtn');
    if (tb) tb.onclick = () => {
      $('#trailerBox').innerHTML = `<div class="aspect-video rounded-xl overflow-hidden border border-line"><iframe class="w-full h-full" src="https://www.youtube.com/embed/${m.trailer}?autoplay=1" title="Trailer for ${esc(m.title)}" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe></div>`;
    };
  } catch (e) { $('#modalBody').innerHTML = `<div class="p-12 text-center text-rose">${esc(e.message)}</div>`; }
}
function closeModal() {
  $('#modal').classList.add('hidden');
  $('#modalBody').innerHTML = ''; // also stops any playing trailer
  document.body.style.overflow = '';
}

/* ---------- Events ---------- */
document.addEventListener('click', (e) => {
  const c = e.target.closest('.card');
  if (c) return openModal(c.dataset.id);
  const chip = e.target.closest('.chip');
  if (chip) {
    const sec = chip.closest('section');
    sec.dataset.sort = chip.dataset.sort;
    sec.querySelectorAll('.chip').forEach((x) => x.setAttribute('aria-pressed', x === chip));
    sec.querySelector('[data-row]').innerHTML = skeletons(8, 'flex-none w-[148px] md:w-[170px]');
    return fillRow(sec);
  }
  const all = e.target.closest('[data-seeall]');
  if (all) return startSeeAll(all.dataset.seeall, all.closest('section').dataset.sort);
});
$('#closeModal').onclick = closeModal;
$('#modal').addEventListener('click', (e) => { if (!$('#modalBox').contains(e.target)) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

$('#searchForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const q = $('#searchInput').value.trim();
  if (q) startSearch(q);
});
let t;
$('#searchInput').addEventListener('input', (e) => {
  clearTimeout(t);
  const q = e.target.value.trim();
  if (q.length >= 3) t = setTimeout(() => startSearch(q), 500);
});
$('#loadMore').onclick = () => { state.page++; loadGrid(false); };
$('#langFilter').onchange = renderGrid;
function goHome() { $('#searchInput').value = ''; showError(''); setMode('home'); }
$('#backHome').onclick = goHome;
$('#logo').onclick = (e) => { e.preventDefault(); goHome(); };

buildSections();
loadHero();
// Put the native banner between the 4th and 5th language sections
const nativeSlot = $('#nativeSlot'), secs = document.querySelectorAll('#sections > section');
if (nativeSlot && secs[3]) secs[3].after(nativeSlot);
