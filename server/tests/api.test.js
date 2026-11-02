// API integration tests: `npm test` (uses a throwaway in-memory MongoDB)
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

delete process.env.MONGO_URI;
const app = require('../src/app');
const { connectDB, disconnectDB } = require('../src/db');
const { seed, DEMO } = require('../src/seed');

let teacherToken, studentToken, quizId;

before(async () => {
  await connectDB({ inMemoryOnly: true });
  await seed();
});
after(disconnectDB);

const login = async (email, password) => (await request(app).post('/api/auth/login').send({ email, password })).body.token;

test('register validates input and rejects duplicates', async () => {
  let r = await request(app).post('/api/auth/register').send({ name: 'X', email: 'bad', password: '123456', role: 'student', className: '9' });
  assert.equal(r.status, 400);
  r = await request(app).post('/api/auth/register').send({ name: 'New Kid', email: 'new@kid.com', password: 'secret1', role: 'student', className: '7' });
  assert.equal(r.status, 201);
  assert.ok(r.body.token);
  r = await request(app).post('/api/auth/register').send({ name: 'New Kid', email: 'new@kid.com', password: 'secret1', role: 'student', className: '7' });
  assert.equal(r.status, 409);
});

test('login works and wrong password is rejected', async () => {
  teacherToken = await login(DEMO.teacher.email, DEMO.teacher.password);
  studentToken = await login(DEMO.student.email, DEMO.student.password);
  assert.ok(teacherToken && studentToken);
  const r = await request(app).post('/api/auth/login').send({ email: DEMO.student.email, password: 'nope' });
  assert.equal(r.status, 401);
});

test('protected routes need a token', async () => {
  const r = await request(app).get('/api/resources');
  assert.equal(r.status, 401);
});

test('search & filter resources', async () => {
  const r = await request(app).get('/api/resources?className=9&subject=Science&q=motion').set('Authorization', `Bearer ${studentToken}`);
  assert.equal(r.status, 200);
  assert.ok(r.body.items.length > 0);
  assert.ok(r.body.items.every((i) => i.className === '9' && i.subject === 'Science'));
});

test('students cannot create content (role-based access)', async () => {
  const r = await request(app).post('/api/resources').set('Authorization', `Bearer ${studentToken}`).send({ title: 't' });
  assert.equal(r.status, 403);
});

test('teacher creates notes and a quiz', async () => {
  let r = await request(app)
    .post('/api/resources')
    .set('Authorization', `Bearer ${teacherToken}`)
    .send({ title: 'Test notes', type: 'notes', className: '9', subject: 'Science', topic: 'Sound', content: '# Sound' });
  assert.equal(r.status, 201);

  r = await request(app)
    .post('/api/quizzes')
    .set('Authorization', `Bearer ${teacherToken}`)
    .send({
      title: 'Sound quiz', className: '9', subject: 'Science', topic: 'Sound',
      questions: [
        { text: 'Sound needs a medium?', options: ['Yes', 'No'], correctIndex: 0 },
        { text: 'Unit of frequency?', options: ['Hz', 'm', 'N'], correctIndex: 0 },
      ],
    });
  assert.equal(r.status, 201);
  quizId = r.body.quiz._id;
});

test('students do not receive answers, and attempts are auto-evaluated', async () => {
  let r = await request(app).get(`/api/quizzes/${quizId}`).set('Authorization', `Bearer ${studentToken}`);
  assert.equal(r.body.quiz.questions[0].correctIndex, undefined);

  r = await request(app).post(`/api/quizzes/${quizId}/attempt`).set('Authorization', `Bearer ${studentToken}`).send({ answers: [0, 2], timeTakenSec: 30 });
  assert.equal(r.status, 201);
  assert.equal(r.body.attempt.score, 1);
  assert.equal(r.body.attempt.percentage, 50);
  assert.equal(r.body.feedback[1].isCorrect, false);
});

test('progress summary reflects attempts', async () => {
  const r = await request(app).get('/api/progress/me').set('Authorization', `Bearer ${studentToken}`);
  assert.equal(r.status, 200);
  assert.ok(r.body.stats.attempts >= 1);
  assert.ok(r.body.bySubject.length > 0);
});

test('teacher overview lists attempts on their quizzes', async () => {
  const r = await request(app).get('/api/progress/teacher/overview').set('Authorization', `Bearer ${teacherToken}`);
  assert.equal(r.status, 200);
  assert.ok(r.body.stats.attempts > 0);
  assert.ok(r.body.perQuiz.some((q) => q.title === 'Sound quiz' && q.attempts === 1));
});
