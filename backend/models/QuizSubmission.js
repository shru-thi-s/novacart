import mongoose from 'mongoose';

const quizSubmissionSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    answers: [{
        question: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question',
            required: true
        },
        selectedAnswer: {
            type: Number, // Index of selected option
            required: true,
            min: -1,
            max: 3
        },
        isCorrect: {
            type: Boolean,
            required: true
        }
    }],
    score: {
        type: Number,
        required: true
    },
    accuracy: {
        type: Number, // Percentage
        required: true
    },
    timeTaken: {
        type: Number, // Time in seconds
        required: true
    },
    autoSubmitted: {
        type: Boolean,
        default: false
    },
    tabSwitches: {
        type: Number,
        default: 0
    },
    cheatingWarnings: {
        type: Number,
        default: 0
    },
    submittedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Ensure one submission per student per quiz
quizSubmissionSchema.index({ student: 1, quiz: 1 }, { unique: true });

// Index for leaderboard queries
quizSubmissionSchema.index({ quiz: 1, score: -1, accuracy: -1 });

const QuizSubmission = mongoose.model('QuizSubmission', quizSubmissionSchema);

export default QuizSubmission;
