const router = require('express').Router();
const { Resource, Quiz } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');
const { upload, saveFile, UPLOAD_DIR } = require('../utils/storage');

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function buildFilter(query) {
  const { q, className, subject, topic, type, mine } = query;
  const filter = {};
  if (className) filter.className = className;
  if (subject) filter.subject = subject;
  if (topic) filter.topic = topic;
  if (type) filter.type = type;
  if (q) {
    const re = new RegExp(escapeRe(q.trim()), 'i');
    filter.$or = [{ title: re }, { description: re }, { topic: re }, { subject: re }, { tags: re }];
  }
  return { filter, mine };
}

// GET /api/resources?q=&className=&subject=&topic=&type=&bookmarked=1&mine=1&sort=
router.get('/', requireAuth, async (req, res) => {
  const { filter, mine } = buildFilter(req.query);
  if (mine && req.user.role === 'teacher') filter.createdBy = req.user._id;
  if (req.query.bookmarked) filter._id = { $in: req.user.bookmarks };
  const sort = req.query.sort === 'popular' ? { views: -1 } : req.query.sort === 'title' ? { title: 1 } : { createdAt: -1 };
  const items = await Resource.find(filter).sort(sort).select('-content').populate('createdBy', 'name').limit(500);
  res.json({ items });
});

router.get('/:id', requireAuth, async (req, res) => {
  const item = await Resource.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true }).populate('createdBy', 'name');
  if (!item) return res.status(404).json({ message: 'Resource not found' });
  const [related, quizzes] = await Promise.all([
    Resource.find({ _id: { $ne: item._id }, className: item.className, subject: item.subject, topic: item.topic }).select('-content').limit(6),
    Quiz.find({ className: item.className, subject: item.subject, topic: item.topic, published: true }).select('-questions.correctIndex -questions.explanation'),
  ]);
  res.json({ item, related, quizzes });
});

function readBody(body) {
  const fields = ['title', 'description', 'type', 'className', 'subject', 'topic', 'content', 'url'];
  const out = {};
  for (const f of fields) if (body[f] !== undefined) out[f] = typeof body[f] === 'string' ? body[f].trim() : body[f];
  if (body.tags !== undefined) {
    out.tags = (Array.isArray(body.tags) ? body.tags : String(body.tags).split(',')).map((t) => t.trim()).filter(Boolean);
  }
  return out;
}

function validate(data, isCreate) {
  const required = ['title', 'type', 'className', 'subject', 'topic'];
  if (isCreate) for (const f of required) if (!data[f]) return `${f} is required`;
  if (data.type && !['notes', 'pdf', 'video', 'link'].includes(data.type)) return 'Invalid resource type';
  return null;
}

router.post('/', requireAuth, requireRole('teacher'), upload.single('file'), async (req, res) => {
  const data = readBody(req.body);
  const err = validate(data, true);
  if (err) return res.status(400).json({ message: err });
  if (req.file) {
    data.url = await saveFile(req.file);
    data.fileName = req.file.originalname;
  }
  if (data.type === 'notes' && !data.content) return res.status(400).json({ message: 'Notes need some content' });
  if (['pdf', 'video', 'link'].includes(data.type) && !data.url) return res.status(400).json({ message: 'Upload a file or provide a URL' });
  const item = await Resource.create({ ...data, createdBy: req.user._id });
  res.status(201).json({ item });
});

async function ownedResource(req, res) {
  const item = await Resource.findById(req.params.id);
  if (!item) return res.status(404).json({ message: 'Resource not found' }), null;
  if (String(item.createdBy) !== String(req.user._id)) return res.status(403).json({ message: 'You can only modify your own resources' }), null;
  return item;
}

router.put('/:id', requireAuth, requireRole('teacher'), upload.single('file'), async (req, res) => {
  const item = await ownedResource(req, res);
  if (!item) return;
  const data = readBody(req.body);
  const err = validate(data, false);
  if (err) return res.status(400).json({ message: err });
  if (req.file) {
    data.url = await saveFile(req.file);
    data.fileName = req.file.originalname;
  }
  Object.assign(item, data);
  await item.save();
  res.json({ item });
});

router.delete('/:id', requireAuth, requireRole('teacher'), async (req, res) => {
  const item = await ownedResource(req, res);
  if (!item) return;
  await item.deleteOne();
  // Remove a locally stored upload once nothing references it
  if (item.url.startsWith('/uploads/') && !(await Resource.exists({ url: item.url }))) {
    fs.promises.unlink(path.join(UPLOAD_DIR, path.basename(item.url))).catch(() => {});
  }
  res.json({ ok: true });
});

// Student helpers: bookmark and mark-as-complete toggles
for (const field of ['bookmarks', 'completed']) {
  const path = field === 'bookmarks' ? 'bookmark' : 'complete';
  router.post(`/:id/${path}`, requireAuth, async (req, res) => {
    const id = req.params.id;
    if (!(await Resource.exists({ _id: id }))) return res.status(404).json({ message: 'Resource not found' });
    const list = req.user[field];
    const idx = list.findIndex((x) => String(x) === id);
    if (idx >= 0) list.splice(idx, 1);
    else list.push(id);
    await req.user.save();
    res.json({ [field]: req.user[field], active: idx < 0 });
  });
}

module.exports = router;
