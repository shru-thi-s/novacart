import mongoose from 'mongoose';

const practiceAttemptSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    question: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: true
    },
    selectedAnswer: {
        type: Number, // Index of selected option
        required: true,
        min: 0,
        max: 3
    },
    isCorrect: {
        type: Boolean,
        required: true
    },
    timeTaken: {
        type: Number, // Time in seconds
        required: true
    },
    // Denormalized for analytics (avoid joins)
    category: {
        type: String,
        enum: ['Quantitative', 'Logical', 'Verbal'],
        required: true
    },
    topic: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        enum: ['Basic', 'Medium', 'Hard'],
        required: true
    },
    attemptedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for analytics queries
practiceAttemptSchema.index({ student: 1, attemptedAt: -1 });
practiceAttemptSchema.index({ student: 1, category: 1 });
practiceAttemptSchema.index({ student: 1, topic: 1 });
practiceAttemptSchema.index({ attemptedAt: 1 });

const PracticeAttempt = mongoose.model('PracticeAttempt', practiceAttemptSchema);

export default PracticeAttempt;
