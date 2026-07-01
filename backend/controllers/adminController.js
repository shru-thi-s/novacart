import User from '../models/User.js';
import Question from '../models/Question.js';
import Quiz from '../models/Quiz.js';
import QuizSubmission from '../models/QuizSubmission.js';
import LearningModule from '../models/LearningModule.js';
import PracticeAttempt from '../models/PracticeAttempt.js';
import Streak from '../models/Streak.js';
import { generateQuestions as aiGenerateQuestions } from '../utils/aiService.js';
import {
    calculateWeakTopics,
    identifyAtRiskStudents,
    calculateDifficultyPerformance,
    getQuizComparison,
    getTopPerformers,
    getOverallLeaderboard
} from '../utils/analyticsService.js';
import { checkAIStatus as aiStatusCheck } from '../utils/aiService.js';
import { createQuizScheduledNotification } from '../utils/notificationService.js';

/**
 * Check AI Status
 */
export const checkAIStatus = async (req, res) => {
    try {
        const result = await aiStatusCheck();
        res.json({
            success: true,
            status: result
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error checking AI status' });
    }
};

/**
 * Get admin leaderboard
 */
export const getLeaderboard = async (req, res) => {
    try {
        const { batch, type = 'hall-of-fame' } = req.query;

        const query = {
            role: 'student',
            isActive: true
        };

        if (batch && batch !== 'All') {
            query.batch = batch.trim().toLowerCase();
        }

        const students = await User.find(query)
            .select('email totalCorrectAnswers totalQuestionsAttempted practiceCorrectAnswers practiceQuestionsAttempted quizCorrectAnswers quizQuestionsAttempted currentStreak batch')
            .limit(100);

        let leaderboard = students.map(s => {
            const totalCorrect = s.totalCorrectAnswers || 0;
            const practiceCorrect = s.practiceCorrectAnswers || 0;
            const quizCorrect = s.quizCorrectAnswers || 0;
            const streak = s.currentStreak || 0;

            // Hall of Fame Rating Formula: (Practice + Quiz) * (1 + Streak/10)
            const hofRating = totalCorrect * (1 + streak / 10);

            return {
                id: s._id,
                email: s.email,
                batch: s.batch,
                practiceCorrect,
                practiceAttempted: s.practiceQuestionsAttempted || 0,
                quizCorrect,
                quizAttempted: s.quizQuestionsAttempted || 0,
                totalCorrect,
                totalAttempted: s.totalQuestionsAttempted || 0,
                streak,
                hofRating: Math.round(hofRating)
            };
        });

        // Sort based on type
        if (type === 'hall-of-fame') {
            leaderboard.sort((a, b) => b.hofRating - a.hofRating);
        } else if (type === 'quiz') {
            leaderboard.sort((a, b) => b.quizCorrect - a.quizCorrect);
        } else if (type === 'practice') {
            leaderboard.sort((a, b) => b.practiceCorrect - a.practiceCorrect);
        }

        // Assign ranks
        leaderboard = leaderboard.map((entry, index) => ({
            ...entry,
            rank: index + 1,
            accuracy: entry.totalAttempted > 0 ? ((entry.totalCorrect / entry.totalAttempted) * 100).toFixed(2) : 0
        }));

        res.json({
            success: true,
            leaderboard
        });
    } catch (error) {
        console.error('Get admin leaderboard error:', error);
        res.status(500).json({ success: false, message: 'Error fetching leaderboard' });
    }
};

/**
 * Get admin dashboard
 */
export const getDashboard = async (req, res) => {
    try {
        // Total students
        const totalStudents = await User.countDocuments({ role: 'student' });

        // Active students today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const activeToday = await PracticeAttempt.distinct('student', {
            attemptedAt: { $gte: today }
        });

        // Recent quizzes
        const quizzes = await Quiz.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('title startDateTime assignedBatches');

        const recentQuizzes = await Promise.all(quizzes.map(async (quiz) => {
            const submissionCount = await QuizSubmission.countDocuments({ quiz: quiz._id });
            return {
                ...quiz.toObject(),
                submissionCount
            };
        }));

        // Quiz participation rate
        const activeQuizzes = await Quiz.find({
            startDateTime: { $lte: new Date() },
            endDateTime: { $gte: new Date() }
        });

        let participationRate = 0;
        if (activeQuizzes.length > 0) {
            const submissions = await QuizSubmission.countDocuments({
                quiz: { $in: activeQuizzes.map(q => q._id) }
            });
            const expectedParticipants = activeQuizzes.reduce((sum, quiz) => {
                return sum + quiz.assignedBatches.length * 10; // Estimate
            }, 0);
            participationRate = expectedParticipants > 0
                ? (submissions / expectedParticipants * 100).toFixed(2)
                : 0;
        }

        res.json({
            success: true,
            dashboard: {
                totalStudents,
                activeToday: activeToday.length,
                participationRate,
                recentQuizzes
            }
        });
    } catch (error) {
        console.error('Get admin dashboard error:', error);
        res.status(500).json({ success: false, message: 'Error fetching dashboard data' });
    }
};

/**
 * Get analytics
 */
export const getAnalytics = async (req, res) => {
    try {
        const { batch } = req.query;

        if (!batch) {
            return res.status(400).json({
                success: false,
                message: 'Please provide batch parameter'
            });
        }

        const weakTopics = await calculateWeakTopics(batch);
        const atRiskStudents = await identifyAtRiskStudents(batch);
        const difficultyPerformance = await calculateDifficultyPerformance(batch);
        const quizComparison = await getQuizComparison(batch);
        const topPerformers = await getTopPerformers(batch, 10);

        res.json({
            success: true,
            analytics: {
                weakTopics,
                atRiskStudents,
                difficultyPerformance,
                quizComparison,
                topPerformers
            }
        });
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({ success: false, message: 'Error fetching analytics' });
    }
};

/**
 * Get all unique batches that have students
 */
export const getBatches = async (req, res) => {
    try {
        const batches = await User.aggregate([
            { $match: { role: 'student', batch: { $exists: true, $ne: "" } } },
            { $group: { _id: "$batch" } },
            { $sort: { _id: 1 } }
        ]);

        res.json({
            success: true,
            batches: batches.map(b => b._id)
        });
    } catch (error) {
        console.error('Get batches error:', error);
        res.status(500).json({ success: false, message: 'Error fetching batches' });
    }
};

/**
 * Get all students
 */
export const getStudents = async (req, res) => {
    try {
        const { batch, isActive } = req.query;

        const filter = { role: 'student' };
        if (batch) filter.batch = batch;
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        const students = await User.find(filter)
            .select('-password')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            students
        });
    } catch (error) {
        console.error('Get students error:', error);
        res.status(500).json({ success: false, message: 'Error fetching students' });
    }
};

/**
 * Add student
 */
export const addStudent = async (req, res) => {
    try {
        const { email, password, batch } = req.body;

        // Validation
        if (!email || !password || !batch) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email, password, and batch'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already exists'
            });
        }

        // Create user
        const student = await User.create({
            email: email.toLowerCase().trim(),
            password,
            role: 'student',
            batch: batch.trim().toLowerCase(),
            isActive: true
        });

        // Create streak record for the student
        await Streak.create({
            student: student._id,
            currentStreak: 0,
            longestStreak: 0,
            activityCalendar: []
        });

        console.log(`✅ Student created successfully: ${student.email} (Batch: ${student.batch})`);

        res.json({
            success: true,
            message: 'Student added successfully',
            student: {
                id: student._id,
                email: student.email,
                batch: student.batch
            }
        });
    } catch (error) {
        console.error('❌ Add student error:', error.message || error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Error adding student'
        });
    }
};

/**
 * Update student
 */
export const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive, batch } = req.body;

        const updateData = {};
        if (isActive !== undefined) updateData.isActive = isActive;
        if (batch) updateData.batch = batch.trim().toLowerCase();

        const student = await User.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        ).select('-password');

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        res.json({
            success: true,
            message: 'Student updated successfully',
            student
        });
    } catch (error) {
        console.error('Update student error:', error);
        res.status(500).json({ success: false, message: 'Error updating student' });
    }
};

/**
 * Delete student
 */
export const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;

        const student = await User.findByIdAndDelete(id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        res.json({
            success: true,
            message: 'Student deleted successfully'
        });
    } catch (error) {
        console.error('Delete student error:', error);
        res.status(500).json({ success: false, message: 'Error deleting student' });
    }
};

/**
 * Get all questions
 */
export const getQuestions = async (req, res) => {
    try {
        const { category, difficulty, topic } = req.query;

        const filter = {};
        if (category) filter.category = category;
        if (difficulty) filter.difficulty = difficulty;
        if (topic) filter.topic = topic;

        // Use lean() to avoid populate issues with deleted users
        const questions = await Question.find(filter)
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            questions
        });
    } catch (error) {
        console.error('❌ Get questions error:', error);
        console.error('Error stack:', error.stack);
        console.error('Query params:', req.query);
        res.status(500).json({
            success: false,
            message: 'Error fetching questions',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};


/**
 * Add question
 */
export const addQuestion = async (req, res) => {
    try {
        const { category, topic, difficulty, questionText, options, correctAnswer, explanation, moduleNumber } = req.body;

        // Check for duplicates
        const existingQuestion = await Question.findOne({ questionText: questionText.trim() });
        if (existingQuestion) {
            return res.status(400).json({
                success: false,
                message: 'A question with this exact text already exists.'
            });
        }

        const question = await Question.create({
            category,
            topic,
            difficulty,
            questionText: questionText.trim(),
            options,
            correctAnswer,
            explanation,
            moduleNumber: moduleNumber || 1,
            createdBy: req.user.id,
            isAIGenerated: false
        });

        res.json({
            success: true,
            message: 'Question added successfully',
            question
        });
    } catch (error) {
        console.error('Add question error:', error);
        res.status(500).json({ success: false, message: 'Error adding question' });
    }
};

/**
 * Update question
 */
export const updateQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const question = await Question.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        if (!question) {
            return res.status(404).json({ success: false, message: 'Question not found' });
        }

        res.json({
            success: true,
            message: 'Question updated successfully',
            question
        });
    } catch (error) {
        console.error('Update question error:', error);
        res.status(500).json({ success: false, message: 'Error updating question' });
    }
};

/**
 * Delete question
 */
export const deleteQuestion = async (req, res) => {
    try {
        const { id } = req.params;

        const question = await Question.findByIdAndDelete(id);
        if (!question) {
            return res.status(404).json({ success: false, message: 'Question not found' });
        }

        res.json({
            success: true,
            message: 'Question deleted successfully'
        });
    } catch (error) {
        console.error('Delete question error:', error);
        res.status(500).json({ success: false, message: 'Error deleting question' });
    }
};

/**
 * Generate questions using AI
 */
export const generateQuestions = async (req, res) => {
    try {
        const { category, topic, difficulty, count = 5, moduleNumber = 1 } = req.body;
        const questions = await aiGenerateQuestions(category, topic, difficulty, count);

        // Return questions for manual review - do NOT auto-save
        // Admin will click "Deploy Question" to save each one individually
        res.json({
            success: true,
            questions
        });

    } catch (error) {
        console.error('❌ Generate questions error:', error);
        console.error('Error stack:', error.stack);
        console.error('Request body:', req.body);
        res.status(500).json({
            success: false,
            message: 'Error generating questions',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }

};

/**
 * Get all quizzes
 */
export const getQuizzes = async (req, res) => {
    try {
        const quizzes = await Quiz.find()
            .sort({ createdAt: -1 });

        // Get submission counts for each quiz
        const quizzesWithCounts = await Promise.all(quizzes.map(async (quiz) => {
            const submissionCount = await QuizSubmission.countDocuments({ quiz: quiz._id });
            return {
                ...quiz.toObject(),
                submissionCount
            };
        }));

        res.json({
            success: true,
            quizzes: quizzesWithCounts
        });
    } catch (error) {
        console.error('Get quizzes error:', error);
        res.status(500).json({ success: false, message: 'Error fetching quizzes' });
    }
};

/**
 * Create quiz
 */
export const createQuiz = async (req, res) => {
    try {
        const { title, description, questions, startDateTime, endDateTime, duration, assignedBatches } = req.body;

        const quiz = await Quiz.create({
            title,
            description,
            questions,
            startDateTime: new Date(startDateTime),
            endDateTime: new Date(endDateTime),
            duration,
            assignedBatches: (assignedBatches || []).map(b => b.trim().toLowerCase()),
            createdBy: req.user.id
        });

        // Create notifications for students
        await createQuizScheduledNotification(quiz);

        res.json({
            success: true,
            message: 'Quiz created successfully',
            quiz
        });
    } catch (error) {
        console.error('Create quiz error:', error);
        res.status(500).json({ success: false, message: 'Error creating quiz' });
    }
};

/**
 * Update quiz
 */
export const updateQuiz = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        if (updateData.startDateTime) updateData.startDateTime = new Date(updateData.startDateTime);
        if (updateData.endDateTime) updateData.endDateTime = new Date(updateData.endDateTime);

        const quiz = await Quiz.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }

        res.json({
            success: true,
            message: 'Quiz updated successfully',
            quiz
        });
    } catch (error) {
        console.error('Update quiz error:', error);
        res.status(500).json({ success: false, message: 'Error updating quiz' });
    }
};

/**
 * Delete quiz
 */
export const deleteQuiz = async (req, res) => {
    try {
        const { id } = req.params;

        const quiz = await Quiz.findByIdAndDelete(id);
        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }

        res.json({
            success: true,
            message: 'Quiz deleted successfully'
        });
    } catch (error) {
        console.error('Delete quiz error:', error);
        res.status(500).json({ success: false, message: 'Error deleting quiz' });
    }
};

/**
 * Get quiz results
 */
export const getQuizResults = async (req, res) => {
    try {
        const { id } = req.params;

        const submissions = await QuizSubmission.find({ quiz: id })
            .populate('student', 'email batch')
            .sort({ score: -1, accuracy: -1 });

        const quiz = await Quiz.findById(id).select('title questions');

        res.json({
            success: true,
            quiz,
            submissions
        });
    } catch (error) {
        console.error('Get quiz results error:', error);
        res.status(500).json({ success: false, message: 'Error fetching quiz results' });
    }
};

/**
 * Upload learning module
 */
export const uploadModule = async (req, res) => {
    try {
        const { category, difficulty, title, content, fileUrl, order } = req.body;

        const module = await LearningModule.create({
            category,
            difficulty,
            title,
            content,
            fileUrl,
            order: order || 0,
            uploadedBy: req.user.id
        });

        res.json({
            success: true,
            message: 'Module uploaded successfully',
            module
        });
    } catch (error) {
        console.error('Upload module error:', error);
        res.status(500).json({ success: false, message: 'Error uploading module' });
    }
};

/**
 * Update module
 */
export const updateModule = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const module = await LearningModule.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        if (!module) {
            return res.status(404).json({ success: false, message: 'Module not found' });
        }

        res.json({
            success: true,
            message: 'Module updated successfully',
            module
        });
    } catch (error) {
        console.error('Update module error:', error);
        res.status(500).json({ success: false, message: 'Error updating module' });
    }
};

/**
 * Delete module
 */
export const deleteModule = async (req, res) => {
    try {
        const { id } = req.params;

        const module = await LearningModule.findByIdAndDelete(id);
        if (!module) {
            return res.status(404).json({ success: false, message: 'Module not found' });
        }

        res.json({
            success: true,
            message: 'Module deleted successfully'
        });
    } catch (error) {
        console.error('Delete module error:', error);
        res.status(500).json({ success: false, message: 'Error deleting module' });
    }
};

/**
 * Get student profile
 */
export const getStudentProfile = async (req, res) => {
    try {
        const { id } = req.params;

        const student = await User.findById(id).select('-password');
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const practiceAttempts = await PracticeAttempt.find({ student: id })
            .sort({ attemptedAt: -1 })
            .limit(50);

        const quizSubmissions = await QuizSubmission.find({ student: id })
            .populate('quiz', 'title startDateTime')
            .sort({ submittedAt: -1 });

        res.json({
            success: true,
            profile: {
                student,
                practiceAttempts,
                quizSubmissions
            }
        });
    } catch (error) {
        console.error('Get student profile error:', error);
        res.status(500).json({ success: false, message: 'Error fetching student profile' });
    }
};

/**
 * Export report (CSV)
 */
export const exportReport = async (req, res) => {
    try {
        const { batch } = req.query;

        const filter = { role: 'student' };
        if (batch) filter.batch = batch;

        const students = await User.find(filter).select('-password');

        // Create CSV
        let csv = 'Email,Batch,Questions Attempted,Correct Answers,Accuracy,Current Streak,Longest Streak\n';

        students.forEach(student => {
            const accuracy = student.totalQuestionsAttempted > 0
                ? ((student.totalCorrectAnswers / student.totalQuestionsAttempted) * 100).toFixed(2)
                : 0;

            csv += `${student.email},${student.batch},${student.totalQuestionsAttempted},${student.totalCorrectAnswers},${accuracy},${student.currentStreak},${student.longestStreak}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=student-report-${Date.now()}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('Export report error:', error);
        res.status(500).json({ success: false, message: 'Error exporting report' });
    }
};

/**
 * Upload a file (PDF/Word)
 */
export const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a file' });
        }

        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/modules/${req.file.filename}`;

        res.json({
            success: true,
            fileUrl,
            fileName: req.file.originalname
        });
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ success: false, message: 'Error uploading file' });
    }
};
