import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Question from './models/Question.js';
import ModuleCompletion from './models/ModuleCompletion.js';

dotenv.config({ path: './.env' });

async function purge() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        console.log('🗑️ Purging Question collection...');
        const qResult = await Question.deleteMany({});
        console.log(`✅ Deleted ${qResult.deletedCount} questions.`);

        console.log('🗑️ Purging ModuleCompletion collection...');
        const mResult = await ModuleCompletion.deleteMany({});
        console.log(`✅ Deleted ${mResult.deletedCount} completion records.`);

        console.log('✨ Database cleared successfully!');

        mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error during purge:', err);
        process.exit(1);
    }
}

purge();
