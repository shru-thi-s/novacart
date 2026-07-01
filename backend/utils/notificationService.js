import Notification from '../models/Notification.js';
import User from '../models/User.js';

/**
 * Create notification when quiz is scheduled
 */
export const createQuizScheduledNotification = async (quiz) => {
    try {
        // Find all students in assigned batches
        const students = await User.find({
            role: 'student',
            batch: { $in: quiz.assignedBatches },
            isActive: true
        });

        const notifications = students.map(student => ({
            student: student._id,
            type: 'quiz_scheduled',
            title: 'New Quiz Scheduled',
            message: `A new quiz "${quiz.title}" has been scheduled for ${quiz.startDateTime.toLocaleString()}`,
            relatedQuiz: quiz._id
        }));

        await Notification.insertMany(notifications);

        console.log(`Created ${notifications.length} quiz scheduled notifications`);
        return notifications;
    } catch (error) {
        console.error('Error creating quiz scheduled notifications:', error);
        throw error;
    }
};

/**
 * Create reminder notification before quiz starts
 */
export const createQuizReminderNotification = async (quiz, minutesBefore = 30) => {
    try {
        const students = await User.find({
            role: 'student',
            batch: { $in: quiz.assignedBatches },
            isActive: true
        });

        const notifications = students.map(student => ({
            student: student._id,
            type: 'quiz_reminder',
            title: 'Quiz Starting Soon',
            message: `Quiz "${quiz.title}" starts in ${minutesBefore} minutes!`,
            relatedQuiz: quiz._id
        }));

        await Notification.insertMany(notifications);

        console.log(`Created ${notifications.length} quiz reminder notifications`);
        return notifications;
    } catch (error) {
        console.error('Error creating quiz reminder notifications:', error);
        throw error;
    }
};

/**
 * Create notification after quiz submission
 */
export const createQuizSubmittedNotification = async (studentId, quiz, score, accuracy) => {
    try {
        const notification = await Notification.create({
            student: studentId,
            type: 'quiz_submitted',
            title: 'Quiz Submitted',
            message: `You scored ${score} points with ${accuracy}% accuracy in "${quiz.title}"`,
            relatedQuiz: quiz._id
        });

        return notification;
    } catch (error) {
        console.error('Error creating quiz submitted notification:', error);
        throw error;
    }
};

/**
 * Create achievement notification (e.g., streak milestone)
 */
export const createAchievementNotification = async (studentId, title, message) => {
    try {
        const notification = await Notification.create({
            student: studentId,
            type: 'achievement',
            title,
            message
        });

        return notification;
    } catch (error) {
        console.error('Error creating achievement notification:', error);
        throw error;
    }
};
