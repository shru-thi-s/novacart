import mongoose from 'mongoose';

const quizSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    questions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
        required: true
    }],
    startDateTime: {
        type: Date,
        required: true
    },
    endDateTime: {
        type: Date,
        required: true
    },
    duration: {
        type: Number, // Duration in minutes
        required: true
    },
    assignedBatches: [{
        type: String,
        required: true
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Validation: endDateTime must be after startDateTime
quizSchema.pre('save', function (next) {
    if (this.endDateTime <= this.startDateTime) {
        next(new Error('End date/time must be after start date/time'));
    }
    next();
});

// Index for efficient querying
quizSchema.index({ startDateTime: 1, endDateTime: 1 });
quizSchema.index({ assignedBatches: 1 });

// Virtual to check if quiz is currently active
quizSchema.virtual('isCurrentlyActive').get(function () {
    const now = new Date();
    return this.isActive && now >= this.startDateTime && now <= this.endDateTime;
});

quizSchema.set('toJSON', { virtuals: true });
quizSchema.set('toObject', { virtuals: true });

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;
