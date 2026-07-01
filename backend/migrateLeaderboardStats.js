import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import PracticeAttempt from './models/PracticeAttempt.js';
import QuizSubmission from './models/QuizSubmission.js';

dotenv.config();

const migrateStats = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const students = await User.find({ role: 'student' });
        console.log(`Migrating stats for ${students.length} students...`);

        for (const student of students) {
            console.log(`Processing ${student.email}...`);

            // Calculate Practice Stats
            const practiceStats = await PracticeAttempt.aggregate([
                { $match: { student: student._id } },
                {
                    $group: {
                        _id: null,
                        attempted: { $sum: 1 },
                        correct: { $sum: { $cond: ['$isCorrect', 1, 0] } }
                    }
                }
            ]);

            const pStats = practiceStats[0] || { attempted: 0, correct: 0 };

            // Calculate Quiz Stats
            // Note: QuizSubmission contains 'answers' array. Score is already calculated.
            const quizSubmissions = await QuizSubmission.find({ student: student._id });

            let qAttempted = 0;
            let qCorrect = 0;

            for (const sub of quizSubmissions) {
                qAttempted += sub.answers.length;
                qCorrect += sub.score; // score is the correct count in this system
            }

            // Update user
            student.practiceQuestionsAttempted = pStats.attempted;
            student.practiceCorrectAnswers = pStats.correct;
            student.quizQuestionsAttempted = qAttempted;
            student.quizCorrectAnswers = qCorrect;

            // Sync total fields just in case
            student.totalQuestionsAttempted = pStats.attempted + qAttempted;
            student.totalCorrectAnswers = pStats.correct + qCorrect;

            await student.save();
            console.log(`Updated ${student.email}: P(${pStats.correct}/${pStats.attempted}), Q(${qCorrect}/${qAttempted})`);
        }

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateStats();
