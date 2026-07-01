import AINote from '../models/AINote.js';
import { generateNotes as aiGenerateNotes } from '../utils/aiService.js';

/**
 * Generate AI notes
 */
export const generateNotes = async (req, res) => {
    try {
        const { topic, category } = req.body;

        if (!topic || !category) {
            return res.status(400).json({
                success: false,
                message: 'Please provide topic and category'
            });
        }

        // Generate notes using AI
        const content = await aiGenerateNotes(topic, category);

        res.json({
            success: true,
            notes: {
                topic,
                category,
                content
            }
        });
    } catch (error) {
        console.error('Generate notes error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating notes'
        });
    }
};

/**
 * Save AI-generated notes
 */
export const saveNote = async (req, res) => {
    try {
        const { topic, category, content } = req.body;

        const note = await AINote.create({
            student: req.user.id,
            topic,
            category,
            content
        });

        res.json({
            success: true,
            message: 'Note saved successfully',
            note
        });
    } catch (error) {
        console.error('Save note error:', error);
        res.status(500).json({
            success: false,
            message: 'Error saving note'
        });
    }
};

/**
 * Get saved notes
 */
export const getSavedNotes = async (req, res) => {
    try {
        const notes = await AINote.find({ student: req.user.id })
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            notes
        });
    } catch (error) {
        console.error('Get saved notes error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching notes'
        });
    }
};
/**
 * Delete a saved note
 */
export const deleteNote = async (req, res) => {
    try {
        const { id } = req.params;
        const note = await AINote.findOneAndDelete({ _id: id, student: req.user.id });

        if (!note) {
            return res.status(404).json({ success: false, message: 'Note not found' });
        }

        res.json({
            success: true,
            message: 'Note deleted successfully'
        });
    } catch (error) {
        console.error('Delete note error:', error);
        res.status(500).json({ success: false, message: 'Error deleting note' });
    }
};
