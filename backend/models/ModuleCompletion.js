import mongoose from 'mongoose';

const moduleCompletionSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
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
    moduleNumber: {
        type: Number,
        required: true
    },
    isCompleted: {
        type: Boolean,
        default: true
    },
    completedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index to quickly check if a module is completed
moduleCompletionSchema.index({ student: 1, category: 1, topic: 1, difficulty: 1, moduleNumber: 1 }, { unique: true });

const ModuleCompletion = mongoose.model('ModuleCompletion', moduleCompletionSchema);

export default ModuleCompletion;
