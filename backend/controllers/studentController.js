import User from '../models/User.js';
import Question from '../models/Question.js';
import PracticeAttempt from '../models/PracticeAttempt.js';
import Quiz from '../models/Quiz.js';
import QuizSubmission from '../models/QuizSubmission.js';
import LearningModule from '../models/LearningModule.js';
import Notification from '../models/Notification.js';
import ModuleCompletion from '../models/ModuleCompletion.js';
import { updateStreak, getHeatmapData } from '../utils/streakService.js';
import { createQuizSubmittedNotification } from '../utils/notificationService.js';
import { checkAndAwardBadges } from '../utils/badgeService.js';

/**
 * Get student dashboard data
 */
export const getDashboard = async (req, res) => {
    try {
        const student = await User.findById(req.user.id);

        // Get upcoming and active quizzes
        const quizzes = await Quiz.find({
            assignedBatches: student.batch,
            endDateTime: { $gte: new Date() }, // Show if not yet ended
            isActive: true
        })
            .sort({ startDateTime: 1 })
            .limit(5)
            .select('title startDateTime endDateTime duration');

        // Check if student has already submitted these quizzes
        const submissions = await QuizSubmission.find({
            student: req.user.id,
            quiz: { $in: quizzes.map(q => q._id) }
        }).select('quiz');

        const submissionIds = new Set(submissions.map(s => s.quiz.toString()));

        const upcomingQuizzes = quizzes.map(quiz => ({
            ...quiz.toObject(),
            hasSubmitted: submissionIds.has(quiz._id.toString())
        }));

        const recentAttempts = await PracticeAttempt.find({ student: req.user.id })
            .sort({ attemptedAt: -1 })
            .limit(10)
            .populate('question', 'questionText category topic');

        // Get earned badges
        const UserBadge = (await import('../models/UserBadge.js')).default;
        const badges = await UserBadge.find({ student: req.user.id }).populate('badge');

        // Calculate category-wise accuracy
        const categoryStats = await PracticeAttempt.aggregate([
            { $match: { student: student._id } },
            {
                $group: {
                    _id: '$category',
                    totalAttempts: { $sum: 1 },
                    correctAttempts: {
                        $sum: { $cond: [{ $eq: ['$isCorrect', true] }, 1, 0] }
                    }
                }
            }
        ]);

        const categoryAccuracy = {};
        categoryStats.forEach(stat => {
            if (stat._id) {
                categoryAccuracy[stat._id] = Math.round((stat.correctAttempts / stat.totalAttempts) * 100);
            }
        });

        res.json({
            success: true,
            dashboard: {
                streak: student.currentStreak,
                longestStreak: student.longestStreak,
                totalQuestionsAttempted: student.totalQuestionsAttempted,
                totalCorrectAnswers: student.totalCorrectAnswers,
                accuracy: student.accuracy,
                averageTime: student.averageTimePerQuestion,
                upcomingQuizzes,
                recentAttempts,
                badges: badges.map(ub => ub.badge),
                categoryAccuracy
            }
        });
    } catch (error) {
        console.error('Get dashboard error:', error);
        res.status(500).json({ success: false, message: 'Error fetching dashboard data' });
    }
};

/**
 * Get heatmap data
 */
export const getHeatmap = async (req, res) => {
    try {
        const heatmapData = await getHeatmapData(req.user.id);

        // Calculate summary stats
        const totalSubmissions = heatmapData.reduce((sum, day) => sum + day.count, 0);
        const totalActiveDays = heatmapData.filter(day => day.count > 0).length;

        const streak = await User.findById(req.user.id).select('longestStreak');

        res.json({
            success: true,
            heatmap: heatmapData,
            summary: {
                totalSubmissions,
                totalActiveDays,
                maxStreak: streak?.longestStreak || 0
            }
        });
    } catch (error) {
        console.error('Get heatmap error:', error);
        res.status(500).json({ success: false, message: 'Error fetching heatmap data' });
    }
};

/**
 * Get available modules for a topic and difficulty
 */
export const getPracticeModules = async (req, res) => {
    try {
        const { category, topic, difficulty } = req.query;

        if (!category || !topic || !difficulty) {
            return res.status(400).json({ success: false, message: 'Category, topic, and difficulty are required' });
        }

        // Get unique module numbers for these filters
        const moduleNumbers = await Question.distinct('moduleNumber', {
            category,
            topic,
            difficulty
        });

        // Get completion status for this student
        const completedModulesArr = await ModuleCompletion.find({
            student: req.user.id,
            category,
            topic,
            difficulty
        }).select('moduleNumber');

        const completedSet = new Set(completedModulesArr.map(m => m.moduleNumber));

        const modules = moduleNumbers.sort((a, b) => a - b).map(num => ({
            moduleNumber: num,
            isCompleted: completedSet.has(num),
            questionCount: 15 // Standard as per requirement
        }));

        res.json({
            success: true,
            modules
        });
    } catch (error) {
        console.error('Get practice modules error:', error);
        res.status(500).json({ success: false, message: 'Error fetching modules' });
    }
};

/**
 * Get 15 questions for a specific module
 */
export const getModuleQuestions = async (req, res) => {
    try {
        const { category, topic, difficulty, moduleNumber } = req.query;

        if (!category || !topic || !difficulty || !moduleNumber) {
            return res.status(400).json({ success: false, message: 'All filters and module number are required' });
        }

        const questions = await Question.find({
            category,
            topic,
            difficulty,
            moduleNumber: parseInt(moduleNumber)
        })
            .limit(15) // Strictly 15 per module requirement
            .select('-createdBy -createdAt -updatedAt');

        res.json({
            success: true,
            questions
        });
    } catch (error) {
        console.error('Get module questions error:', error);
        res.status(500).json({ success: false, message: 'Error fetching module questions' });
    }
};

/**
 * Get practice questions (Legacy / Backup)
 */
export const getPracticeQuestions = async (req, res) => {
    try {
        const { category, difficulty, limit = 10 } = req.query;

        const filter = {};
        if (category) filter.category = category;
        if (difficulty) filter.difficulty = difficulty;

        const questions = await Question.find(filter)
            .limit(parseInt(limit))
            .select('-createdBy -createdAt -updatedAt');

        res.json({
            success: true,
            questions
        });
    } catch (error) {
        console.error('Get practice questions error:', error);
        res.status(500).json({ success: false, message: 'Error fetching questions' });
    }
};

/**
 * Submit practice answer
 */
export const submitPracticeAnswer = async (req, res) => {
    try {
        const { questionId, selectedAnswer, timeTaken } = req.body;

        const question = await Question.findById(questionId);
        if (!question) {
            return res.status(404).json({ success: false, message: 'Question not found' });
        }

        const isCorrect = selectedAnswer === question.correctAnswer;

        // Create practice attempt
        const attempt = await PracticeAttempt.create({
            student: req.user.id,
            question: questionId,
            selectedAnswer,
            isCorrect,
            timeTaken,
            category: question.category,
            topic: question.topic,
            difficulty: question.difficulty
        });

        // Update user statistics
        const user = await User.findById(req.user.id);
        user.totalQuestionsAttempted += 1;
        user.practiceQuestionsAttempted += 1;
        if (isCorrect) {
            user.totalCorrectAnswers += 1;
            user.practiceCorrectAnswers += 1;
        }

        // Update average time
        const totalTime = user.averageTimePerQuestion * (user.totalQuestionsAttempted - 1) + timeTaken;
        user.averageTimePerQuestion = totalTime / user.totalQuestionsAttempted;

        await user.save();

        // Update question statistics
        question.timesAttempted += 1;
        if (isCorrect) question.timesCorrect += 1;
        await question.save();

        // Update streak
        await updateStreak(req.user.id);

        // Check for module completion
        let moduleCompleted = false;
        const totalInModule = await Question.countDocuments({
            category: question.category,
            topic: question.topic,
            difficulty: question.difficulty,
            moduleNumber: question.moduleNumber
        });

        // If it's a standard module (usually 15), check if player has attempted enough unique questions
        const uniqueAttemptsCount = await PracticeAttempt.distinct('question', {
            student: req.user.id,
            category: question.category,
            topic: question.topic,
            difficulty: question.difficulty,
            moduleNumber: question.moduleNumber // We might need to index this or denormalize it
        });

        // NOTE: We haven't denormalized moduleNumber to PracticeAttempt yet. 
        // Let's check attempts by looking up the questions first or just assume if they finish the series.
        // For simplicity in the first version, let's mark it as completed if they reach the 15th question in the frontend session.
        // But for persistent data:

        const attemptsInModule = await PracticeAttempt.countDocuments({
            student: req.user.id,
            question: {
                $in: await Question.find({
                    category: question.category,
                    topic: question.topic,
                    difficulty: question.difficulty,
                    moduleNumber: question.moduleNumber
                }).select('_id')
            }
        });

        if (attemptsInModule >= totalInModule && totalInModule > 0) {
            await ModuleCompletion.updateOne(
                {
                    student: req.user.id,
                    category: question.category,
                    topic: question.topic,
                    difficulty: question.difficulty,
                    moduleNumber: question.moduleNumber
                },
                { isCompleted: true },
                { upsert: true }
            );
            moduleCompleted = true;
        }

        // Check for new badges
        const newBadges = await checkAndAwardBadges(req.user.id);

        res.json({
            success: true,
            isCorrect,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            attempt,
            moduleCompleted,
            newBadges: newBadges.length > 0 ? newBadges : undefined
        });
    } catch (error) {
        console.error('Submit practice answer error:', error);
        res.status(500).json({ success: false, message: 'Error submitting answer' });
    }
};

/**
 * Get learning modules with unlock status
 */
export const getModules = async (req, res) => {
    try {
        const { category } = req.query;

        const filter = category ? { category } : {};
        const modules = await LearningModule.find(filter)
            .sort({ category: 1, difficulty: 1, order: 1 })
            .select('-uploadedBy');

        const modulesWithStatus = modules.map(module => ({
            ...module.toObject(),
            isUnlocked: true
        }));

        res.json({
            success: true,
            modules: modulesWithStatus
        });
    } catch (error) {
        console.error('Get modules error:', error);
        res.status(500).json({ success: false, message: 'Error fetching modules' });
    }
};

/**
 * Get available quizzes (time-based filtering)
 */
export const getQuizzes = async (req, res) => {
    try {
        const student = await User.findById(req.user.id);
        const now = new Date();

        // Get quizzes for student's batch
        const quizzes = await Quiz.find({
            assignedBatches: student.batch,
            isActive: true
        })
            .sort({ startDateTime: -1 })
            .populate('questions', 'questionText options category difficulty');

        // Check submission status
        const quizzesWithStatus = await Promise.all(
            quizzes.map(async (quiz) => {
                const submission = await QuizSubmission.findOne({
                    student: req.user.id,
                    quiz: quiz._id
                });

                return {
                    ...quiz.toObject(),
                    hasSubmitted: !!submission,
                    isAvailable: now >= quiz.startDateTime && now <= quiz.endDateTime,
                    status:
                        submission ? 'completed' :
                            now < quiz.startDateTime ? 'upcoming' :
                                now > quiz.endDateTime ? 'expired' :
                                    'active'
                };
            })
        );

        res.json({
            success: true,
            quizzes: quizzesWithStatus
        });
    } catch (error) {
        console.error('Get quizzes error:', error);
        res.status(500).json({ success: false, message: 'Error fetching quizzes' });
    }
};

/**
 * Submit quiz
 */
export const submitQuiz = async (req, res) => {
    try {
        const { quizId } = req.params;
        const { answers, timeTaken, autoSubmitted = false, tabSwitches = 0, cheatingWarnings = 0 } = req.body;

        const quiz = await Quiz.findById(quizId).populate('questions');
        if (!quiz) {
            return res.status(404).json({ success: false, message: 'Quiz not found' });
        }

        // Validate time window
        const now = new Date();
        if (now < quiz.startDateTime || now > quiz.endDateTime) {
            return res.status(403).json({
                success: false,
                message: 'Quiz is not available at this time'
            });
        }

        // Check if already submitted
        const existingSubmission = await QuizSubmission.findOne({
            student: req.user.id,
            quiz: quizId
        });

        if (existingSubmission) {
            return res.status(400).json({
                success: false,
                message: 'Quiz already submitted'
            });
        }

        // Calculate score
        let correctCount = 0;
        const processedAnswers = answers.map((answer) => {
            const question = quiz.questions.find(q => q._id.toString() === answer.questionId);
            const isCorrect = question && answer.selectedAnswer === question.correctAnswer;
            if (isCorrect) correctCount++;

            return {
                question: answer.questionId,
                selectedAnswer: answer.selectedAnswer,
                isCorrect
            };
        });

        const score = correctCount;
        const accuracy = (correctCount / quiz.questions.length) * 100;

        // Update user statistics
        const user = await User.findById(req.user.id);
        user.totalQuestionsAttempted += quiz.questions.length;
        user.quizQuestionsAttempted += quiz.questions.length;
        user.totalCorrectAnswers += correctCount;
        user.quizCorrectAnswers += correctCount;
        await user.save();

        // Create submission
        const submission = await QuizSubmission.create({
            student: req.user.id,
            quiz: quizId,
            answers: processedAnswers,
            accuracy,
            score,
            timeTaken,
            autoSubmitted,
            tabSwitches,
            cheatingWarnings
        });

        // Create notification
        await createQuizSubmittedNotification(req.user.id, quiz, score, accuracy.toFixed(2));

        // Check for new badges
        const newBadges = await checkAndAwardBadges(req.user.id);

        res.json({
            success: true,
            message: 'Quiz submitted successfully',
            submission: {
                score,
                accuracy: accuracy.toFixed(2),
                totalQuestions: quiz.questions.length,
                newBadges: newBadges.length > 0 ? newBadges : undefined
            }
        });
    } catch (error) {
        console.error('Submit quiz error:', error);
        res.status(500).json({ success: false, message: 'Error submitting quiz' });
    }
};

/**
 * Get leaderboard
 */
export const getLeaderboard = async (req, res) => {
    try {
        const student = await User.findById(req.user.id);
        const { quizId } = req.query;

        if (quizId) {
            // Quiz-specific leaderboard
            const submissions = await QuizSubmission.find({ quiz: quizId })
                .populate('student', 'email batch')
                .sort({ score: -1, accuracy: -1, timeTaken: 1 })
                .limit(50);

            const leaderboard = submissions.map((sub, index) => ({
                rank: index + 1,
                email: sub.student.email,
                score: sub.score,
                accuracy: sub.accuracy,
                timeTaken: sub.timeTaken
            }));

            res.json({ success: true, leaderboard });
        } else {
            // Overall leaderboard (by batch)
            const type = req.query.type || 'hall-of-fame';
            const query = {
                role: 'student',
                isActive: true
            };

            // Filter by batch if not global (we can add a global flag later, but current logic uses batch)
            // For Hall of Fame, let's keep it global if requested, but default to batch as per existing patterns
            if (student.batch) {
                query.batch = student.batch;
            }

            let sortField = 'totalCorrectAnswers';
            if (type === 'quiz') sortField = 'quizCorrectAnswers';
            if (type === 'practice') sortField = 'practiceCorrectAnswers';

            const students = await User.find(query)
                .select('email totalCorrectAnswers totalQuestionsAttempted practiceCorrectAnswers practiceQuestionsAttempted quizCorrectAnswers quizQuestionsAttempted currentStreak batch')
                .limit(50);

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

            res.json({ success: true, leaderboard });
        }
    } catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({ success: false, message: 'Error fetching leaderboard' });
    }
};

/**
 * Get notifications
 */
export const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ student: req.user.id })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('relatedQuiz', 'title startDateTime');

        res.json({
            success: true,
            notifications
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ success: false, message: 'Error fetching notifications' });
    }
};

/**
 * Mark notification as read
 */
export const markNotificationRead = async (req, res) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, student: req.user.id },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        res.json({
            success: true,
            notification
        });
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ success: false, message: 'Error updating notification' });
    }
};

/**
 * Get performance analytics (Comparison with batch)
 */
export const getPerformanceAnalytics = async (req, res) => {
    try {
        const { getStudentPerformanceVsAverage } = await import('../utils/analyticsService.js');
        const analytics = await getStudentPerformanceVsAverage(req.user.id);

        res.json({
            success: true,
            analytics
        });
    } catch (error) {
        console.error('Get performance analytics error:', error);
        res.status(500).json({ success: false, message: 'Error fetching performance analytics' });
    }
};
