const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { signToken, requireAuth } = require('../middleware/auth');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/register', async (req, res) => {
  const { name, email, password, role, className, subjectsTaught } = req.body || {};
  if (!name || !email || !password || !role) return res.status(400).json({ message: 'Name, email, password and role are required' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ message: 'Please enter a valid email' });
  if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
  if (!['student', 'teacher'].includes(role)) return res.status(400).json({ message: 'Role must be student or teacher' });
  if (role === 'student' && !className) return res.status(400).json({ message: 'Please select your class' });
  if (await User.exists({ email: email.toLowerCase() })) return res.status(409).json({ message: 'An account with this email already exists' });

  const user = await User.create({
    name,
    email,
    role,
    className: role === 'student' ? String(className) : undefined,
    subjectsTaught: role === 'teacher' ? subjectsTaught || [] : undefined,
    passwordHash: await bcrypt.hash(password, 10),
  });
  res.status(201).json({ token: signToken(user), user: user.toPublic() });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ message: 'Incorrect email or password' });
  }
  res.json({ token: signToken(user), user: user.toPublic() });
});

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user.toPublic() }));

router.put('/me', requireAuth, async (req, res) => {
  const { name, className, subjectsTaught } = req.body || {};
  if (name) req.user.name = name;
  if (className && req.user.role === 'student') req.user.className = String(className);
  if (subjectsTaught && req.user.role === 'teacher') req.user.subjectsTaught = subjectsTaught;
  await req.user.save();
  res.json({ user: req.user.toPublic() });
});

module.exports = router;
