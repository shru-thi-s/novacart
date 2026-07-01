import Topic from '../models/Topic.js';

/**
 * Get all topics (with optional category filtering)
 */
export const getTopics = async (req, res) => {
    try {
        const { category } = req.query;
        const query = { isActive: true };
        if (category) {
            query.category = category;
        }

        const topics = await Topic.find(query).sort({ category: 1, name: 1 });
        res.json({ success: true, topics });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching topics' });
    }
};

/**
 * Create a new topic
 */
export const createTopic = async (req, res) => {
    try {
        const { name, category, subtopics } = req.body;

        const existing = await Topic.findOne({ name });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Topic already exists' });
        }

        const topic = await Topic.create({ name, category, subtopics: subtopics || [] });
        res.status(201).json({ success: true, topic });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating topic' });
    }
};

/**
 * Update a topic
 */
export const updateTopic = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, subtopics, isActive } = req.body;

        const topic = await Topic.findByIdAndUpdate(
            id,
            { name, category, subtopics, isActive },
            { new: true, runValidators: true }
        );

        if (!topic) {
            return res.status(404).json({ success: false, message: 'Topic not found' });
        }

        res.json({ success: true, topic });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating topic' });
    }
};

/**
 * Delete a topic (soft delete recommended, but hard delete here if requested)
 */
export const deleteTopic = async (req, res) => {
    try {
        const { id } = req.params;
        const topic = await Topic.findByIdAndDelete(id);

        if (!topic) {
            return res.status(404).json({ success: false, message: 'Topic not found' });
        }

        res.json({ success: true, message: 'Topic deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting topic' });
    }
};
