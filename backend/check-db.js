import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Question from './models/Question.js';

dotenv.config({ path: './.env' });

async function checkStatus() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const userCount = await User.countDocuments();
        const questionCount = await Question.countDocuments();
        console.log(`Database Stat: ${userCount} users, ${questionCount} questions`);
        mongoose.connection.close();
    } catch (err) {
        console.error('Error checking status:', err);
    }
}

checkStatus();
