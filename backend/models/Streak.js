import mongoose from 'mongoose';

const streakSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    currentStreak: {
        type: Number,
        default: 0
    },
    longestStreak: {
        type: Number,
        default: 0
    },
    lastActivityDate: {
        type: Date
    },
    activityCalendar: [{
        date: {
            type: Date,
            required: true
        },
        questionsAttempted: {
            type: Number,
            default: 0
        }
    }]
}, {
    timestamps: true
});

// Indexing is handled by unique: true in field definition

const Streak = mongoose.model('Streak', streakSchema);

export default Streak;
