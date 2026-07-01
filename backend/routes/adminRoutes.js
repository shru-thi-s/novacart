import express from 'express';
import {
    getDashboard,
    getAnalytics,
    getStudents,
    addStudent,
    updateStudent,
    deleteStudent,
    getQuestions,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    generateQuestions,
    getQuizzes,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    getQuizResults,
    uploadModule,
    updateModule,
    deleteModule,
    getStudentProfile,
    exportReport,
    uploadFile,
    checkAIStatus,
    getBatches,
    getLeaderboard
} from '../controllers/adminController.js';
import {
    getTopics,
    createTopic,
    updateTopic,
    deleteTopic
} from '../controllers/topicController.js';
import { authenticate, requireAdmin } from '../middleware/authMiddleware.js';
import { uploadModuleFile } from '../utils/fileUpload.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate, requireAdmin);

// Dashboard & Analytics
router.get('/dashboard', getDashboard);
router.get('/analytics', getAnalytics);
router.get('/batches', getBatches);
router.get('/ai-status', checkAIStatus);
router.get('/leaderboard', getLeaderboard);

// Student Management
router.get('/students', getStudents);
router.post('/students', addStudent);
router.patch('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);
router.get('/students/:id/profile', getStudentProfile);

// Question Management
router.get('/questions', getQuestions);
router.post('/questions', addQuestion);
router.patch('/questions/:id', updateQuestion);
router.delete('/questions/:id', deleteQuestion);
router.post('/questions/generate', generateQuestions);

// Quiz Management
router.get('/quizzes', getQuizzes);
router.post('/quizzes', createQuiz);
router.patch('/quizzes/:id', updateQuiz);
router.delete('/quizzes/:id', deleteQuiz);
router.get('/quizzes/:id/results', getQuizResults);

// Module Management
router.post('/modules', uploadModule);
router.patch('/modules/:id', updateModule);
router.delete('/modules/:id', deleteModule);
router.post('/modules/upload-file', uploadModuleFile, uploadFile);

// Reports
router.get('/reports/export', exportReport);

// Topic Management
router.get('/topics', getTopics);
router.post('/topics', createTopic);
router.patch('/topics/:id', updateTopic);
router.delete('/topics/:id', deleteTopic);

export default router;
