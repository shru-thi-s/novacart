import express from 'express';
import { generateNotes, saveNote, getSavedNotes, deleteNote } from '../controllers/aiController.js';
import { authenticate, requireStudent } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication and student role
router.use(authenticate, requireStudent);

// Generate notes
router.post('/notes/generate', generateNotes);

// Save note
router.post('/notes/save', saveNote);

// Get saved notes
router.get('/notes', getSavedNotes);

// Delete note
router.delete('/notes/:id', deleteNote);

export default router;
