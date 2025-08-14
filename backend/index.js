require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const { authenticateToken } = require('./utilities');
const User = require('./models/user.model');
const Note = require('./models/note.model');

const app = express();

if (!process.env.ACCESS_TOKEN_SECRET) {
  throw new Error('ACCESS_TOKEN_SECRET is not set in environment variables');
}
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  throw new Error('MONGO_URI is not set in environment variables');
}


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.CLIENT_URL?.split(',').map(s => s.trim()) || ['http://localhost:5173','http://localhost:3000'],
  credentials: true,
}));


mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

  
function signToken(userId) {
  return jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10h' });
}


app.get('/', (req, res) => res.json({ ok: true }));

// Create account
app.post('/create-account', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ error: true, message: 'fullName, email, and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: true, message: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    const newUser = await User.create({ fullname: fullName, email, password: hash });

    const accessToken = signToken(newUser._id.toString());
    return res.status(201).json({
      error: false,
      message: 'Account created successfully',
      accessToken,
      user: { _id: newUser._id, fullName: newUser.fullname, email: newUser.email, createdOn: newUser.createdOn },
    });
  } catch (err) {
    console.error('create-account error:', err);
    return res.status(500).json({ error: true, message: 'Failed to create account' });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: true, message: 'email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(400).json({ error: true, message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(400).json({ error: true, message: 'Invalid credentials' });

    const accessToken = signToken(user._id.toString());
    return res.json({
      error: false,
      message: 'Login successful',
      email: user.email,
      accessToken,
    });
  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ error: true, message: 'Failed to login' });
  }
});

// Get user details
app.get('/get-user', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('_id fullname email createdOn');
    if (!user) return res.status(404).json({ error: true, message: 'User not found' });
    return res.json({ error: false, user: { _id: user._id, fullName: user.fullname, email: user.email, createdOn: user.createdOn } });
  } catch (err) {
    console.error('get-user error:', err);
    return res.status(500).json({ error: true, message: 'Failed to fetch user' });
  }
});

// Add a note
app.post('/add-note', authenticateToken, async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    if (!title || !content) return res.status(400).json({ error: true, message: 'title and content are required' });

    const note = await Note.create({
      title, content, tags: Array.isArray(tags) ? tags : [], userId: req.userId,
    });

    return res.status(201).json({ error: false, note, message: 'Note created successfully' });
  } catch (err) {
    console.error('add-note error:', err);
    return res.status(500).json({ error: true, message: 'Failed to create note' });
  }
});

// Edit a note
app.put('/edit-note/:noteID', authenticateToken, async (req, res) => {
  try {
    const noteId = req.params.noteID;
    const { title, content, tags, isPinned } = req.body;

    const note = await Note.findOne({ _id: noteId, userId: req.userId });
    if (!note) return res.status(404).json({ error: true, message: 'Note not found' });

    if (typeof title !== 'undefined') note.title = title;
    if (typeof content !== 'undefined') note.content = content;
    if (typeof tags !== 'undefined') note.tags = Array.isArray(tags) ? tags : [];
    if (typeof isPinned !== 'undefined') note.isPinned = !!isPinned;

    await note.save();
    return res.json({ error: false, note, message: 'Note updated successfully' });
  } catch (err) {
    console.error('edit-note error:', err);
    return res.status(500).json({ error: true, message: 'Failed to update note' });
  }
});

// Get all notes
app.get('/get-all-notes', authenticateToken, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.userId }).sort({ isPinned: -1, createdOn: -1 });
    return res.json({ error: false, notes, message: 'Notes retrieved successfully' });
  } catch (err) {
    console.error('get-all-notes error:', err);
    return res.status(500).json({ error: true, message: 'Failed to retrieve notes' });
  }
});

// Delete a note
app.delete('/delete-note/:noteID', authenticateToken, async (req, res) => {
  try {
    const noteId = req.params.noteID;
    const note = await Note.findOneAndDelete({ _id: noteId, userId: req.userId });
    if (!note) return res.status(404).json({ error: true, message: 'Note not found' });
    return res.json({ error: false, message: 'Note deleted successfully' });
  } catch (err) {
    console.error('delete-note error:', err);
    return res.status(500).json({ error: true, message: 'Failed to delete note' });
  }
});



app.post('/edit-note', authenticateToken, async (req, res) => {
  try {
    const { noteId, title, content, tags, isPinned } = req.body;
    if (!noteId) return res.status(400).json({ error: true, message: 'noteId is required' });
    const note = await Note.findOne({ _id: noteId, userId: req.userId });
    if (!note) return res.status(404).json({ error: true, message: 'Note not found' });
    if (typeof title !== 'undefined') note.title = title;
    if (typeof content !== 'undefined') note.content = content;
    if (typeof tags !== 'undefined') note.tags = Array.isArray(tags) ? tags : [];
    if (typeof isPinned !== 'undefined') note.isPinned = !!isPinned;
    await note.save();
    return res.json({ error: false, note, message: 'Note updated successfully' });
  } catch (err) {
    console.error('edit-note (POST) error:', err);
    return res.status(500).json({ error: true, message: 'Failed to update note' });
  }
});

app.post('/delete-note', authenticateToken, async (req, res) => {
  try {
    const { noteId } = req.body;
    if (!noteId) return res.status(400).json({ error: true, message: 'noteId is required' });
    const note = await Note.findOneAndDelete({ _id: noteId, userId: req.userId });
    if (!note) return res.status(404).json({ error: true, message: 'Note not found' });
    return res.json({ error: false, message: 'Note deleted successfully' });
  } catch (err) {
    console.error('delete-note (POST) error:', err);
    return res.status(500).json({ error: true, message: 'Failed to delete note' });
  }
});

// Search notes
app.get('/search-notes', authenticateToken, async (req, res) => {
  try {
    const { query } = req.query;
    const q = (query || '').trim();
    if (!q) return res.json({ error: false, notes: [] });

    const regex = new RegExp(q, 'i');
    const notes = await Note.find({
      userId: req.userId,
      $or: [{ title: regex }, { content: regex }, { tags: regex }],
    }).sort({ isPinned: -1, createdOn: -1 });

    return res.json({ error: false, notes, message: 'Notes retrieved successfully' });
  } catch (err) {
    console.error('search-notes error:', err);
    return res.status(500).json({ error: true, message: 'Failed to search notes' });
  }
});

// ---- Start server ----
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

module.exports = app;
