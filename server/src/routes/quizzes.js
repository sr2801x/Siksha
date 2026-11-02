const router = require('express').Router();
const { Quiz, Attempt } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');

const HIDDEN = '-questions.correctIndex -questions.explanation';
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/quizzes?q=&className=&subject=&topic=&mine=1
router.get('/', requireAuth, async (req, res) => {
  const { q, className, subject, topic, difficulty, mine } = req.query;
  const filter = {};
  if (className) filter.className = className;
  if (subject) filter.subject = subject;
  if (topic) filter.topic = topic;
  if (difficulty) filter.difficulty = difficulty;
  if (q) {
    const re = new RegExp(escapeRe(q.trim()), 'i');
    filter.$or = [{ title: re }, { topic: re }, { subject: re }, { description: re }];
  }
  if (req.user.role === 'teacher' && mine) filter.createdBy = req.user._id;
  if (req.user.role === 'student') filter.published = true;

  const quizzes = await Quiz.find(filter).sort({ createdAt: -1 }).select(HIDDEN).populate('createdBy', 'name').lean();

  // Attach the student's best score so the list can show completion state
  if (req.user.role === 'student') {
    const best = await Attempt.aggregate([
      { $match: { student: req.user._id } },
      { $group: { _id: '$quiz', best: { $max: '$percentage' }, attempts: { $sum: 1 } } },
    ]);
    const map = new Map(best.map((b) => [String(b._id), b]));
    for (const qz of quizzes) {
      const b = map.get(String(qz._id));
      qz.bestScore = b ? b.best : null;
      qz.attemptCount = b ? b.attempts : 0;
    }
  }
  for (const qz of quizzes) {
    qz.questionCount = qz.questions.length;
    delete qz.questions;
  }
  res.json({ items: quizzes });
});

router.get('/:id', requireAuth, async (req, res) => {
  const isTeacher = req.user.role === 'teacher';
  const quiz = await Quiz.findById(req.params.id).select(isTeacher ? '' : HIDDEN).populate('createdBy', 'name');
  if (!quiz || (!isTeacher && !quiz.published)) return res.status(404).json({ message: 'Quiz not found' });
  res.json({ quiz });
});

function readQuiz(body) {
  const { title, description, className, subject, topic, difficulty, durationMinutes, published, questions } = body || {};
  const data = { title, description, className, subject, topic, difficulty, durationMinutes, published };
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k]);
  if (questions) {
    data.questions = questions.map((q) => ({
      text: String(q.text || '').trim(),
      options: (q.options || []).map((o) => String(o).trim()),
      correctIndex: Number(q.correctIndex),
      explanation: q.explanation || '',
    }));
  }
  return data;
}

function validateQuiz(data, isCreate) {
  if (isCreate) for (const f of ['title', 'className', 'subject', 'topic']) if (!data[f]) return `${f} is required`;
  if (data.questions) {
    if (!data.questions.length) return 'Add at least one question';
    for (const [i, q] of data.questions.entries()) {
      if (!q.text) return `Question ${i + 1} has no text`;
      if (q.options.length < 2 || q.options.some((o) => !o)) return `Question ${i + 1} needs at least two non-empty options`;
      if (!(q.correctIndex >= 0 && q.correctIndex < q.options.length)) return `Question ${i + 1} needs a correct answer`;
    }
  } else if (isCreate) return 'Add at least one question';
  return null;
}

router.post('/', requireAuth, requireRole('teacher'), async (req, res) => {
  const data = readQuiz(req.body);
  const err = validateQuiz(data, true);
  if (err) return res.status(400).json({ message: err });
  const quiz = await Quiz.create({ ...data, createdBy: req.user._id });
  res.status(201).json({ quiz });
});

async function ownedQuiz(req, res) {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz) return res.status(404).json({ message: 'Quiz not found' }), null;
  if (String(quiz.createdBy) !== String(req.user._id)) return res.status(403).json({ message: 'You can only modify your own quizzes' }), null;
  return quiz;
}

router.put('/:id', requireAuth, requireRole('teacher'), async (req, res) => {
  const quiz = await ownedQuiz(req, res);
  if (!quiz) return;
  const data = readQuiz(req.body);
  const err = validateQuiz(data, false);
  if (err) return res.status(400).json({ message: err });
  Object.assign(quiz, data);
  await quiz.save();
  res.json({ quiz });
});

router.delete('/:id', requireAuth, requireRole('teacher'), async (req, res) => {
  const quiz = await ownedQuiz(req, res);
  if (!quiz) return;
  await Promise.all([quiz.deleteOne(), Attempt.deleteMany({ quiz: quiz._id })]);
  res.json({ ok: true });
});

// Submit an attempt -> automatic evaluation with instant per-question feedback
router.post('/:id/attempt', requireAuth, requireRole('student'), async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);
  if (!quiz || !quiz.published) return res.status(404).json({ message: 'Quiz not found' });
  const raw = Array.isArray(req.body?.answers) ? req.body.answers : [];
  const answers = quiz.questions.map((_, i) => (Number.isInteger(raw[i]) ? raw[i] : -1));

  const feedback = quiz.questions.map((q, i) => ({
    question: q.text,
    options: q.options,
    selected: answers[i],
    correctIndex: q.correctIndex,
    isCorrect: answers[i] === q.correctIndex,
    explanation: q.explanation,
  }));
  const score = feedback.filter((f) => f.isCorrect).length;
  const total = quiz.questions.length;

  const attempt = await Attempt.create({
    quiz: quiz._id,
    student: req.user._id,
    answers,
    score,
    total,
    percentage: Math.round((score / total) * 100),
    timeTakenSec: Math.max(0, Math.round(Number(req.body?.timeTakenSec) || 0)),
    subject: quiz.subject,
    topic: quiz.topic,
    className: quiz.className,
    quizTitle: quiz.title,
  });
  res.status(201).json({ attempt, feedback });
});

module.exports = router;
