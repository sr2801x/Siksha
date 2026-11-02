// External educational sources via public, openly licensed APIs (no scraping of restricted sites):
//  - Wikipedia (CC BY-SA) search + summaries
//  - Open Library (open data) book search
const router = require('express').Router();
const { Resource } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');

const UA = { 'User-Agent': 'SikshaLearningPlatform/1.0 (educational student project)' };
const cache = new Map(); // tiny in-memory cache to stay polite to the APIs
const TTL = 30 * 60 * 1000;

async function cachedJson(url) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.t < TTL) return hit.data;
  const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`Upstream ${r.status}`);
  const data = await r.json();
  cache.set(url, { t: Date.now(), data });
  return data;
}

const stripHtml = (s = '') => s.replace(/<[^>]+>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#039;/g, "'");

async function wikipedia(q) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=6&format=json&origin=*`;
  const data = await cachedJson(url);
  return (data.query?.search || []).map((s) => ({
    source: 'Wikipedia',
    title: s.title,
    snippet: stripHtml(s.snippet) + '…',
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(s.title.replace(/ /g, '_'))}`,
  }));
}

async function openLibrary(q) {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=6&fields=key,title,author_name,first_publish_year,cover_i`;
  const data = await cachedJson(url);
  return (data.docs || []).map((d) => ({
    source: 'Open Library',
    title: d.title,
    snippet: [d.author_name?.slice(0, 2).join(', '), d.first_publish_year].filter(Boolean).join(' · '),
    url: `https://openlibrary.org${d.key}`,
    image: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : null,
  }));
}

router.get('/search', requireAuth, async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.status(400).json({ message: 'Enter something to search' });
  const [wiki, books] = await Promise.allSettled([wikipedia(q), openLibrary(q)]);
  res.json({
    wikipedia: wiki.status === 'fulfilled' ? wiki.value : [],
    books: books.status === 'fulfilled' ? books.value : [],
    errors: [wiki, books].filter((r) => r.status === 'rejected').map((r) => r.reason.message),
  });
});

router.get('/summary', requireAuth, async (req, res) => {
  const title = String(req.query.title || '').trim();
  if (!title) return res.status(400).json({ message: 'title is required' });
  try {
    const d = await cachedJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`);
    res.json({ title: d.title, extract: d.extract, url: d.content_urls?.desktop?.page, image: d.thumbnail?.source || null });
  } catch (e) {
    res.status(502).json({ message: 'Could not reach Wikipedia right now' });
  }
});

// Teachers can import an external result into the library as a "link" resource
router.post('/import', requireAuth, requireRole('teacher'), async (req, res) => {
  const { title, url, description, className, subject, topic } = req.body || {};
  if (!title || !url || !className || !subject || !topic) return res.status(400).json({ message: 'title, url, class, subject and topic are required' });
  const item = await Resource.create({
    title,
    url,
    description: description || '',
    type: 'link',
    source: 'external',
    className,
    subject,
    topic,
    createdBy: req.user._id,
  });
  res.status(201).json({ item });
});

module.exports = router;
