require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const KEY = process.env.TMDB_API_KEY;
const PORT = process.env.PORT || 3000;
const cache = new Map(); // simple 10-minute in-memory cache

async function tmdb(endpoint, params = {}) {
  const qs = new URLSearchParams({ api_key: KEY, ...params });
  const url = `https://api.themoviedb.org/3${endpoint}?${qs}`;
  const hit = cache.get(url);
  if (hit && Date.now() - hit.t < 600000) return hit.d;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`TMDB responded with ${r.status}`);
  const d = await r.json();
  cache.set(url, { d, t: Date.now() });
  return d;
}

const route = (fn) => async (req, res) => {
  if (!KEY) return res.status(500).json({ error: 'TMDB_API_KEY is missing. Add it to the .env file and restart the server.' });
  try { res.json(await fn(req)); }
  catch (e) { res.status(502).json({ error: e.message }); }
};

const isoDate = (offsetDays = 0) => new Date(Date.now() + offsetDays * 864e5).toISOString().slice(0, 10);

app.get('/api/trending', route(() => tmdb('/trending/movie/week')));

app.get('/api/search', route((req) =>
  tmdb('/search/movie', { query: req.query.q || '', page: req.query.page || 1, include_adult: false })));

// Movies by original language. sort=popular (default) or sort=new (released in the last 4 months)
app.get('/api/discover', route((req) => {
  const isNew = req.query.sort === 'new';
  const params = {
    with_original_language: req.query.lang || 'en',
    sort_by: 'popularity.desc',
    page: req.query.page || 1,
    include_adult: false,
    'primary_release_date.lte': isoDate(),
  };
  if (isNew) params['primary_release_date.gte'] = isoDate(-120);
  else params['vote_count.gte'] = 30;
  return tmdb('/discover/movie', params);
}));

app.get('/api/movie/:id', route(async (req) => {
  const m = await tmdb(`/movie/${encodeURIComponent(req.params.id)}`, { append_to_response: 'videos,credits' });
  const trailer = (m.videos?.results || []).find((v) => v.site === 'YouTube' && v.type === 'Trailer')
    || (m.videos?.results || []).find((v) => v.site === 'YouTube');
  return {
    id: m.id, title: m.title, tagline: m.tagline, overview: m.overview,
    poster_path: m.poster_path, backdrop_path: m.backdrop_path,
    release_date: m.release_date, runtime: m.runtime, vote_average: m.vote_average,
    original_language: m.original_language, genres: m.genres,
    cast: (m.credits?.cast || []).slice(0, 8).map((c) => c.name),
    director: (m.credits?.crew || []).find((c) => c.job === 'Director')?.name || null,
    trailer: trailer ? trailer.key : null,
  };
}));

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`CineWorld is running at http://localhost:${PORT}`);
  if (!KEY) console.warn('Warning: TMDB_API_KEY is not set. Copy .env.example to .env and add your key.');
});
