import PracticeAttempt from '../models/PracticeAttempt.js';
import QuizSubmission from '../models/QuizSubmission.js';
import User from '../models/User.js';

/**
 * Calculate weak topics for a batch
 */
export const calculateWeakTopics = async (batch) => {
    try {
        // Get all students in batch
        const students = await User.find({ role: 'student', batch, isActive: true });
        const studentIds = students.map(s => s._id);

        // Aggregate practice attempts by topic
        const topicStats = await PracticeAttempt.aggregate([
            { $match: { student: { $in: studentIds } } },
            {
                $group: {
                    _id: '$topic',
                    category: { $first: '$category' },
                    totalAttempts: { $sum: 1 },
                    correctAttempts: {
                        $sum: { $cond: ['$isCorrect', 1, 0] }
                    },
                    avgTime: { $avg: '$timeTaken' }
                }
            },
            {
                $project: {
                    topic: '$_id',
                    category: 1,
                    totalAttempts: 1,
                    correctAttempts: 1,
                    accuracy: {
                        $multiply: [
                            { $divide: ['$correctAttempts', '$totalAttempts'] },
                            100
                        ]
                    },
                    avgTime: { $round: ['$avgTime', 2] }
                }
            },
            { $sort: { accuracy: 1 } } // Sort by accuracy (lowest first)
        ]);

        return topicStats;
    } catch (error) {
        console.error('Error calculating weak topics:', error);
        throw error;
    }
};

/**
 * Identify at-risk students (low streak + low score)
 */
export const identifyAtRiskStudents = async (batch) => {
    try {
        const students = await User.find({
            role: 'student',
            batch,
            isActive: true
        }).select('email currentStreak totalQuestionsAttempted totalCorrectAnswers');

        const atRiskStudents = students.filter(student => {
            const accuracy = student.totalQuestionsAttempted > 0
                ? (student.totalCorrectAnswers / student.totalQuestionsAttempted) * 100
                : 0;

            return student.currentStreak < 3 && accuracy < 50;
        }).map(student => ({
            id: student._id,
            email: student.email,
            streak: student.currentStreak,
            accuracy: student.totalQuestionsAttempted > 0
                ? ((student.totalCorrectAnswers / student.totalQuestionsAttempted) * 100).toFixed(2)
                : 0,
            questionsAttempted: student.totalQuestionsAttempted
        }));

        return atRiskStudents;
    } catch (error) {
        console.error('Error identifying at-risk students:', error);
        throw error;
    }
};

/**
 * Calculate difficulty vs performance analysis
 */
export const calculateDifficultyPerformance = async (batch) => {
    try {
        const students = await User.find({ role: 'student', batch, isActive: true });
        const studentIds = students.map(s => s._id);

        const difficultyStats = await PracticeAttempt.aggregate([
            { $match: { student: { $in: studentIds } } },
            {
                $group: {
                    _id: '$difficulty',
                    totalAttempts: { $sum: 1 },
                    correctAttempts: {
                        $sum: { $cond: ['$isCorrect', 1, 0] }
                    },
                    avgTime: { $avg: '$timeTaken' }
                }
            },
            {
                $project: {
                    difficulty: '$_id',
                    totalAttempts: 1,
                    correctAttempts: 1,
                    accuracy: {
                        $multiply: [
                            { $divide: ['$correctAttempts', '$totalAttempts'] },
                            100
                        ]
                    },
                    avgTime: { $round: ['$avgTime', 2] }
                }
            },
            { $sort: { difficulty: 1 } }
        ]);

        return difficultyStats;
    } catch (error) {
        console.error('Error calculating difficulty performance:', error);
        throw error;
    }
};

/**
 * Get quiz-wise performance comparison
 */
export const getQuizComparison = async (batch) => {
    try {
        const students = await User.find({ role: 'student', batch, isActive: true });
        const studentIds = students.map(s => s._id);

        const quizStats = await QuizSubmission.aggregate([
            { $match: { student: { $in: studentIds } } },
            {
                $lookup: {
                    from: 'quizzes',
                    localField: 'quiz',
                    foreignField: '_id',
                    as: 'quizDetails'
                }
            },
            { $unwind: '$quizDetails' },
            {
                $group: {
                    _id: '$quiz',
                    quizTitle: { $first: '$quizDetails.title' },
                    totalSubmissions: { $sum: 1 },
                    avgScore: { $avg: '$score' },
                    avgAccuracy: { $avg: '$accuracy' },
                    avgTime: { $avg: '$timeTaken' },
                    highestScore: { $max: '$score' },
                    lowestScore: { $min: '$score' }
                }
            },
            { $sort: { '_id': -1 } }
        ]);

        return quizStats;
    } catch (error) {
        console.error('Error getting quiz comparison:', error);
        throw error;
    }
};

/**
 * Get top performers in batch
 */
export const getTopPerformers = async (batch, limit = 10) => {
    try {
        const students = await User.find({
            role: 'student',
            batch,
            isActive: true
        })
            .select('email totalQuestionsAttempted totalCorrectAnswers currentStreak')
            .sort({ totalCorrectAnswers: -1 })
            .limit(limit);

        return students.map(student => ({
            id: student._id,
            email: student.email,
            questionsAttempted: student.totalQuestionsAttempted,
            correctAnswers: student.totalCorrectAnswers,
            accuracy: student.totalQuestionsAttempted > 0
                ? ((student.totalCorrectAnswers / student.totalQuestionsAttempted) * 100).toFixed(2)
                : 0,
            streak: student.currentStreak
        }));
    } catch (error) {
        console.error('Error getting top performers:', error);
        throw error;
    }
};
/**
 * Get overall leaderboard across all batches
 */
export const getOverallLeaderboard = async (limit = 50) => {
    try {
        const students = await User.find({
            role: 'student',
            isActive: true
        })
            .select('email totalQuestionsAttempted totalCorrectAnswers currentStreak batch')
            .sort({ totalCorrectAnswers: -1 })
            .limit(limit);

        return students.map(student => ({
            id: student._id,
            email: student.email,
            batch: student.batch,
            questionsAttempted: student.totalQuestionsAttempted,
            correctAnswers: student.totalCorrectAnswers,
            accuracy: student.totalQuestionsAttempted > 0
                ? ((student.totalCorrectAnswers / student.totalQuestionsAttempted) * 100).toFixed(2)
                : 0,
            streak: student.currentStreak
        }));
    } catch (error) {
        console.error('Error getting overall leaderboard:', error);
        throw error;
    }
};
/**
 * Get student performance compared to batch average
 */
export const getStudentPerformanceVsAverage = async (userId) => {
    try {
        const student = await User.findById(userId);
        if (!student) throw new Error('Student not found');

        const batchStudents = await User.find({ role: 'student', batch: student.batch, isActive: true });
        const batchIds = batchStudents.map(s => s._id);

        // Batch average accuracy and time
        const batchStats = await PracticeAttempt.aggregate([
            { $match: { student: { $in: batchIds } } },
            {
                $group: {
                    _id: null,
                    avgAccuracy: { $avg: { $cond: ['$isCorrect', 100, 0] } },
                    avgTime: { $avg: '$timeTaken' }
                }
            }
        ]);

        const avgStats = batchStats[0] || { avgAccuracy: 0, avgTime: 0 };

        // Student stats per category
        const studentCategoryStats = await PracticeAttempt.aggregate([
            { $match: { student: student._id } },
            {
                $group: {
                    _id: '$category',
                    accuracy: { $avg: { $cond: ['$isCorrect', 100, 0] } },
                    avgTime: { $avg: '$timeTaken' }
                }
            }
        ]);

        return {
            studentAccuracy: parseFloat(student.accuracy),
            batchAvgAccuracy: Math.round(avgStats.avgAccuracy),
            studentAvgTime: Math.round(student.averageTimePerQuestion),
            batchAvgTime: Math.round(avgStats.avgTime),
            categoryBreakdown: studentCategoryStats.map(s => ({
                category: s._id,
                accuracy: Math.round(s.accuracy),
                avgTime: Math.round(s.avgTime)
            }))
        };
    } catch (error) {
        console.error('Error getting student comparison:', error);
        throw error;
    }
};
