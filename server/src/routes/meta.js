const router = require('express').Router();
const { Resource, Quiz } = require('../models');
const { requireAuth } = require('../middleware/auth');

const CLASSES = ['6', '7', '8', '9', '10', '11', '12'];
const SUBJECTS = ['Mathematics', 'Science', 'English', 'Social Studies', 'Computer Science', 'Hindi'];

// Class -> subject -> topics tree built from existing content, for the browse sidebar and form suggestions
router.get('/taxonomy', requireAuth, async (req, res) => {
  const [r, q] = await Promise.all([
    Resource.aggregate([{ $group: { _id: { c: '$className', s: '$subject', t: '$topic' }, n: { $sum: 1 } } }]),
    Quiz.aggregate([{ $match: { published: true } }, { $group: { _id: { c: '$className', s: '$subject', t: '$topic' }, n: { $sum: 1 } } }]),
  ]);
  const tree = {};
  for (const [rows, key] of [
    [r, 'resources'],
    [q, 'quizzes'],
  ]) {
    for (const { _id, n } of rows) {
      const node = (((tree[_id.c] ||= {})[_id.s] ||= {})[_id.t] ||= { resources: 0, quizzes: 0 });
      node[key] += n;
    }
  }
  const subjects = new Set(SUBJECTS);
  Object.values(tree).forEach((s) => Object.keys(s).forEach((x) => subjects.add(x)));
  res.json({ classes: CLASSES, subjects: [...subjects], tree });
});

module.exports = router;
