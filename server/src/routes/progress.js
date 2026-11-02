const router = require('express').Router();
const { Attempt, Quiz, Resource, User } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');

const avg = (arr) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);

function groupAvg(attempts, key) {
  const groups = {};
  for (const a of attempts) (groups[a[key]] ||= []).push(a.percentage);
  return Object.entries(groups)
    .map(([name, scores]) => ({ name, average: avg(scores), attempts: scores.length }))
    .sort((a, b) => b.average - a.average);
}

// Student progress summary used by the dashboard and the reports page
async function studentSummary(student) {
  const attempts = await Attempt.find({ student: student._id }).sort({ createdAt: 1 }).lean();
  const [totalResources, totalQuizzes] = await Promise.all([
    Resource.countDocuments({ className: student.className }),
    Quiz.countDocuments({ className: student.className, published: true }),
  ]);
  const uniqueQuizzes = new Set(attempts.map((a) => String(a.quiz)));
  const byTopic = groupAvg(attempts, 'topic').map((t) => ({
    ...t,
    subject: attempts.find((a) => a.topic === t.name)?.subject,
  }));

  // Study streak: consecutive days (ending today/yesterday) with at least one attempt
  const days = new Set(attempts.map((a) => new Date(a.createdAt).toISOString().slice(0, 10)));
  let streak = 0;
  const d = new Date();
  if (!days.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
  while (days.has(d.toISOString().slice(0, 10))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }

  return {
    student: student.toPublic(),
    stats: {
      attempts: attempts.length,
      quizzesTaken: uniqueQuizzes.size,
      totalQuizzes,
      averageScore: avg(attempts.map((a) => a.percentage)),
      bestScore: attempts.length ? Math.max(...attempts.map((a) => a.percentage)) : 0,
      resourcesCompleted: student.completed.length,
      totalResources,
      bookmarks: student.bookmarks.length,
      streak,
      totalStudyMinutes: Math.round(attempts.reduce((s, a) => s + (a.timeTakenSec || 0), 0) / 60),
    },
    timeline: attempts.map((a) => ({
      id: a._id,
      date: a.createdAt,
      quizTitle: a.quizTitle,
      subject: a.subject,
      topic: a.topic,
      percentage: a.percentage,
      score: a.score,
      total: a.total,
      timeTakenSec: a.timeTakenSec,
    })),
    bySubject: groupAvg(attempts, 'subject'),
    byTopic,
    weakTopics: byTopic.filter((t) => t.average < 60).sort((a, b) => a.average - b.average).slice(0, 5),
    strongTopics: byTopic.filter((t) => t.average >= 80).slice(0, 5),
  };
}

router.get('/me', requireAuth, requireRole('student'), async (req, res) => {
  res.json(await studentSummary(req.user));
});

router.get('/attempts/:id', requireAuth, async (req, res) => {
  const attempt = await Attempt.findById(req.params.id).populate('quiz');
  if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
  const isOwner = String(attempt.student) === String(req.user._id);
  if (!isOwner && req.user.role !== 'teacher') return res.status(403).json({ message: 'Not allowed' });
  const feedback = attempt.quiz
    ? attempt.quiz.questions.map((q, i) => ({
        question: q.text,
        options: q.options,
        selected: attempt.answers[i] ?? -1,
        correctIndex: q.correctIndex,
        isCorrect: attempt.answers[i] === q.correctIndex,
        explanation: q.explanation,
      }))
    : [];
  const { quiz, ...rest } = attempt.toObject();
  res.json({ attempt: { ...rest, quiz: quiz ? { _id: quiz._id, title: quiz.title, subject: quiz.subject, topic: quiz.topic } : null }, feedback });
});

// ---------- Teacher reports ----------
router.get('/teacher/overview', requireAuth, requireRole('teacher'), async (req, res) => {
  const me = req.user._id;
  const [resources, quizzes] = await Promise.all([Resource.find({ createdBy: me }).lean(), Quiz.find({ createdBy: me }).lean()]);
  const quizIds = quizzes.map((q) => q._id);
  const attempts = await Attempt.find({ quiz: { $in: quizIds } }).populate('student', 'name className email').sort({ createdAt: -1 }).lean();

  const perQuiz = quizzes.map((q) => {
    const as = attempts.filter((a) => String(a.quiz) === String(q._id));
    return {
      id: q._id,
      title: q.title,
      subject: q.subject,
      className: q.className,
      attempts: as.length,
      average: avg(as.map((a) => a.percentage)),
      questionCount: q.questions.length,
    };
  });

  const studentMap = new Map();
  for (const a of attempts) {
    if (!a.student) continue;
    const k = String(a.student._id);
    if (!studentMap.has(k)) studentMap.set(k, { id: k, name: a.student.name, email: a.student.email, className: a.student.className, scores: [] });
    studentMap.get(k).scores.push(a.percentage);
  }
  const students = [...studentMap.values()]
    .map(({ scores, ...s }) => ({ ...s, attempts: scores.length, average: avg(scores) }))
    .sort((a, b) => b.average - a.average);

  const typeCounts = ['notes', 'pdf', 'video', 'link'].map((t) => ({ name: t, value: resources.filter((r) => r.type === t).length }));

  res.json({
    stats: {
      resources: resources.length,
      quizzes: quizzes.length,
      attempts: attempts.length,
      students: students.length,
      averageScore: avg(attempts.map((a) => a.percentage)),
      totalViews: resources.reduce((s, r) => s + (r.views || 0), 0),
    },
    typeCounts,
    perQuiz,
    students,
    bySubject: groupAvg(attempts, 'subject'),
    recentAttempts: attempts.slice(0, 10).map((a) => ({
      id: a._id,
      student: a.student?.name,
      quizTitle: a.quizTitle,
      percentage: a.percentage,
      date: a.createdAt,
    })),
    topResources: [...resources].sort((a, b) => b.views - a.views).slice(0, 5).map((r) => ({ id: r._id, title: r.title, views: r.views, type: r.type })),
  });
});

router.get('/teacher/students/:id', requireAuth, requireRole('teacher'), async (req, res) => {
  const student = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!student) return res.status(404).json({ message: 'Student not found' });
  res.json(await studentSummary(student));
});

module.exports = router;
