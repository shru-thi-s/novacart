import express from 'express';
import {
    getDashboard,
    getHeatmap,
    getPracticeQuestions,
    submitPracticeAnswer,
    getPracticeModules,
    getModuleQuestions,
    getModules,
    getQuizzes,
    submitQuiz,
    getLeaderboard,
    getNotifications,
    markNotificationRead,
    getPerformanceAnalytics
} from '../controllers/studentController.js';
import { getTopics } from '../controllers/topicController.js';
import { authenticate, requireStudent, requireActive } from '../middleware/authMiddleware.js';

const router = express.Router();

// Base authentication for all student-facing routes
router.use(authenticate);

// Dashboard (Student only)
router.get('/dashboard', requireStudent, requireActive, getDashboard);

// Heatmap (Student only)
router.get('/heatmap', requireStudent, requireActive, getHeatmap);

// Practice (Student only)
router.get('/practice', requireStudent, requireActive, getPracticeQuestions);
router.get('/practice/modules', requireStudent, requireActive, getPracticeModules);
router.get('/practice/questions', requireStudent, requireActive, getModuleQuestions);
router.post('/practice/submit', requireStudent, requireActive, submitPracticeAnswer);

// Learning modules (Accessible by all roles to allow admin management)
router.get('/modules', getModules);

// Quizzes (Student only)
router.get('/quizzes', requireStudent, requireActive, getQuizzes);
router.post('/quiz/:quizId/submit', requireStudent, requireActive, submitQuiz);

// Leaderboard (Accessible by all)
router.get('/leaderboard', getLeaderboard);

// Notifications (Student only)
router.get('/notifications', requireStudent, requireActive, getNotifications);
router.patch('/notifications/:id/read', requireStudent, requireActive, markNotificationRead);
router.get('/performance-analytics', requireStudent, requireActive, getPerformanceAnalytics);

// Topics (Shared)
router.get('/topics', getTopics);

export default router;
