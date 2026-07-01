import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    category: {
        type: String,
        enum: ['Quantitative', 'Logical', 'Verbal'],
        required: true
    },
    topic: {
        type: String,
        required: true,
        trim: true
    },
    difficulty: {
        type: String,
        enum: ['Basic', 'Medium', 'Hard'],
        required: true
    },
    questionText: {
        type: String,
        required: true
    },
    options: [{
        type: String,
        required: true
    }],
    correctAnswer: {
        type: Number, // Index of correct option (0-3)
        required: true,
        min: 0,
        max: 3
    },
    explanation: {
        type: String,
        required: true
    },
    moduleNumber: {
        type: Number,
        default: 1
    },
    isAIGenerated: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Statistics
    timesAttempted: {
        type: Number,
        default: 0
    },
    timesCorrect: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index for efficient querying
questionSchema.index({ category: 1, difficulty: 1 });
questionSchema.index({ topic: 1 });

// Virtual for success rate
questionSchema.virtual('successRate').get(function () {
    if (this.timesAttempted === 0) return 0;
    return (this.timesCorrect / this.timesAttempted * 100).toFixed(2);
});

questionSchema.set('toJSON', { virtuals: true });
questionSchema.set('toObject', { virtuals: true });

const Question = mongoose.model('Question', questionSchema);

export default Question;
