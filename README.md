# CineWorld - Movie Search Website

Search movies from all over the world and browse sections for Hindi, Punjabi, English, Tamil, Telugu, Urdu, Korean, Japanese, Spanish and French films. Data comes live from the free TMDB API.

**Stack:** HTML, CSS, Tailwind CSS (CDN), JavaScript, Node.js + Express

## Setup
1. Install Node.js 18 or newer.
2. Create a free account at https://www.themoviedb.org and request an API key (Settings > API).
3. In this folder, copy `.env.example` to `.env` and paste your key after `TMDB_API_KEY=`.
4. Run:
   ```
   npm install
   npm start
   ```
5. Open http://localhost:3000

## How it works
- `server.js` calls TMDB and keeps your key private. It exposes `/api/trending`, `/api/search`, `/api/discover` and `/api/movie/:id`, with a 10-minute cache.
- `public/` holds the website (index.html, style.css, app.js).
- Each language section has a Popular / New switch and a "See all" page with Load more.

Movie data and images are provided by TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.
