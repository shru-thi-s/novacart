import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Quiz from './models/Quiz.js';

dotenv.config();

const migrateData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Lowercase and trim all student batch names
        const usersResult = await User.updateMany(
            { role: 'student' },
            [
                {
                    $set: {
                        batch: { $trim: { input: { $toLower: "$batch" } } }
                    }
                }
            ]
        );
        console.log(`Updated ${usersResult.modifiedCount} users`);

        // Lowercase and trim all quiz assigned batches
        const quizzes = await Quiz.find({});
        let updatedQuizzes = 0;
        for (const quiz of quizzes) {
            const originalBatches = quiz.assignedBatches || [];
            const newBatches = originalBatches.map(b => b.trim().toLowerCase());

            // Only update if changed
            if (JSON.stringify(originalBatches) !== JSON.stringify(newBatches)) {
                quiz.assignedBatches = newBatches;
                await quiz.save();
                updatedQuizzes++;
            }
        }
        console.log(`Updated ${updatedQuizzes} quizzes`);

        console.log('Migration complete');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateData();
