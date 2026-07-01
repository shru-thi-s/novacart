import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['quiz_scheduled', 'quiz_reminder', 'quiz_submitted', 'achievement'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    relatedQuiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz'
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for efficient queries
notificationSchema.index({ student: 1, createdAt: -1 });
notificationSchema.index({ student: 1, isRead: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
