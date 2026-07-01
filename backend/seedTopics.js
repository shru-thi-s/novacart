import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Topic from './models/Topic.js';

dotenv.config();

const topics = {
    Quantitative: [
        'Percentage',
        'Average',
        'Profit & Loss',
        'Ratio & Proportion',
        'Simple and Compound Interest',
        'Time - Speed - Distance',
        'Time & Work',
        'Algebra'
    ],
    Logical: [
        'Verbal and Deductive Reasoning',
        'Analytical and Puzzle Reasoning',
        'Non-verbal Reasoning (Figures/Shapes)',
        'Number / Letter Series'
    ],
    Verbal: [
        'Fillups / Sentence Completion',
        'Cloze Test',
        'Error Detection / Correction',
        'Analogy',
        'Para Jumbles / Ordering'
    ]
};

async function seedTopics() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing topics if any (optional, but good for idempotent seeding)
        // await Topic.deleteMany({});

        for (const [category, topicList] of Object.entries(topics)) {
            for (const topicName of topicList) {
                const existing = await Topic.findOne({ name: topicName });
                if (!existing) {
                    await Topic.create({
                        name: topicName,
                        category,
                        subtopics: [],
                        isActive: true
                    });
                    console.log(`✅ Seeded topic: ${topicName} (${category})`);
                } else {
                    console.log(`ℹ️ Topic already exists: ${topicName}`);
                }
            }
        }

        console.log('Successfully seeded topics!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding topics:', error);
        process.exit(1);
    }
}

seedTopics();
