const mongoose = require('mongoose');

const { Schema, model, Types } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['student', 'teacher'], required: true },
    className: { type: String }, // students only, e.g. "8"
    subjectsTaught: [String], // teachers only
    bookmarks: [{ type: Types.ObjectId, ref: 'Resource' }],
    completed: [{ type: Types.ObjectId, ref: 'Resource' }],
  },
  { timestamps: true }
);

userSchema.methods.toPublic = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    className: this.className,
    subjectsTaught: this.subjectsTaught,
    bookmarks: this.bookmarks,
    completed: this.completed,
    createdAt: this.createdAt,
  };
};

const resourceSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    type: { type: String, enum: ['notes', 'pdf', 'video', 'link'], required: true },
    className: { type: String, required: true },
    subject: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true },
    content: { type: String, default: '' }, // markdown body for notes
    url: { type: String, default: '' }, // video / external link / uploaded file url
    fileName: { type: String, default: '' },
    source: { type: String, enum: ['teacher', 'external'], default: 'teacher' },
    tags: [String],
    views: { type: Number, default: 0 },
    createdBy: { type: Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);
resourceSchema.index({ title: 'text', description: 'text', topic: 'text', subject: 'text', tags: 'text' });

const questionSchema = new Schema({
  text: { type: String, required: true },
  options: { type: [String], validate: (v) => v.length >= 2 },
  correctIndex: { type: Number, required: true },
  explanation: { type: String, default: '' },
});

const quizSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    className: { type: String, required: true },
    subject: { type: String, required: true },
    topic: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    durationMinutes: { type: Number, default: 10 },
    questions: [questionSchema],
    published: { type: Boolean, default: true },
    createdBy: { type: Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const attemptSchema = new Schema(
  {
    quiz: { type: Types.ObjectId, ref: 'Quiz', required: true },
    student: { type: Types.ObjectId, ref: 'User', required: true },
    answers: [Number], // -1 = skipped
    score: Number,
    total: Number,
    percentage: Number,
    timeTakenSec: Number,
    // denormalised so reports survive quiz edits
    subject: String,
    topic: String,
    className: String,
    quizTitle: String,
  },
  { timestamps: true }
);

module.exports = {
  User: model('User', userSchema),
  Resource: model('Resource', resourceSchema),
  Quiz: model('Quiz', quizSchema),
  Attempt: model('Attempt', attemptSchema),
};
