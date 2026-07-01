import mongoose from 'mongoose';

const learningModuleSchema = new mongoose.Schema({
    category: {
        type: String,
        enum: ['Quantitative', 'Logical', 'Verbal'],
        required: true
    },
    difficulty: {
        type: String,
        enum: ['Basic', 'Medium', 'Hard'],
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    content: {
        type: String, // Can store markdown or HTML
        required: false
    },
    fileUrl: {
        type: String // Optional file attachment URL
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    order: {
        type: Number, // For ordering modules within category/difficulty
        default: 0
    }
}, {
    timestamps: true
});

// Index for efficient querying
learningModuleSchema.index({ category: 1, difficulty: 1, order: 1 });

const LearningModule = mongoose.model('LearningModule', learningModuleSchema);

export default LearningModule;
