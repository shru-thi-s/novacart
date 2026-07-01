import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Question from './models/Question.js';
import User from './models/User.js';

dotenv.config({ path: './.env' });

const questions = [
    {
        category: 'Quantitative',
        topic: 'Percentages',
        difficulty: 'Basic',
        questionText: 'If 20% of a number is 40, what is 25% of that number?',
        options: ['40', '50', '60', '80'],
        correctAnswer: 1,
        explanation: '20% = 40 => 100% = 200. 25% of 200 = 50.'
    },
    {
        category: 'Quantitative',
        topic: 'Averages',
        difficulty: 'Basic',
        questionText: 'The average of 5 numbers is 20. If each number is multiplied by 2, what is the new average?',
        options: ['20', '30', '40', '50'],
        correctAnswer: 2,
        explanation: 'If every term in a set is multiplied by a constant k, the average also gets multiplied by k. 20 * 2 = 40.'
    },
    {
        category: 'Logical',
        topic: 'Number Series',
        difficulty: 'Basic',
        questionText: 'Complete the series: 2, 4, 8, 16, ?',
        options: ['24', '30', '32', '64'],
        correctAnswer: 2,
        explanation: 'The pattern is multiplication by 2. 16 * 2 = 32.'
    },
    {
        category: 'Verbal',
        topic: 'Synonyms',
        difficulty: 'Basic',
        questionText: 'Choose the synonym of "ABANDON":',
        options: ['Keep', 'Desert', 'Adopt', 'Stay'],
        correctAnswer: 1,
        explanation: 'To abandon means to leave or desert someone or something.'
    },
    {
        category: 'Quantitative',
        topic: 'Profit & Loss',
        difficulty: 'Medium',
        questionText: 'A man buys an item for $80 and sells it for $100. Find the profit percentage.',
        options: ['20%', '25%', '30%', '15%'],
        correctAnswer: 1,
        explanation: 'Profit = 100 - 80 = 20. Profit % = (20/80) * 100 = 25%.'
    },
    {
        category: 'Logical',
        topic: 'Blood Relations',
        difficulty: 'Medium',
        questionText: 'Pointing to a photograph, a man says, "I have no brother or sister but that man’s father is my father’s son." Whose photograph was it?',
        options: ['His nephew’s', 'His son’s', 'His father’s', 'His own'],
        correctAnswer: 1,
        explanation: 'Since he has no brother or sister, "my father’s son" is himself. So, the man in the photograph’s father is him. Therefore, it is his son’s photograph.'
    },
    {
        category: 'Quantitative',
        topic: 'Time and Work',
        difficulty: 'Hard',
        questionText: 'A can do a work in 15 days and B in 20 days. If they work on it together for 4 days, then the fraction of the work that is left is:',
        options: ['1/4', '1/10', '7/15', '8/15'],
        correctAnswer: 3,
        explanation: 'A’s 1 day work = 1/15; B’s 1 day work = 1/20; (A + B)’s 1 day work = (1/15 + 1/20) = 7/60. (A + B)’s 4 days work = (7/60 * 4) = 7/15. Remaining work = (1 - 7/15) = 8/15.'
    }
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // Find an admin user to assign as creator
        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.error('No admin found. Please create an admin first.');
            process.exit(1);
        }

        const questionsWithCreator = questions.map(q => ({
            ...q,
            createdBy: admin._id
        }));

        await Question.insertMany(questionsWithCreator);
        console.log('SEEDING SUCCESSFUL!');

        mongoose.connection.close();
    } catch (err) {
        console.error('SEEDING ERROR:', err);
    }
}

seed();
