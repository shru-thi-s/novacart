import mongoose from 'mongoose';

const aiNoteSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    topic: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['Quantitative', 'Logical', 'Verbal'],
        required: true
    },
    content: {
        concepts: {
            type: String,
            required: true
        },
        formulas: {
            type: String
        },
        shortcuts: {
            type: String
        },
        examples: {
            type: String
        }
    },
    lastAccessed: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient queries
aiNoteSchema.index({ student: 1, topic: 1 });
aiNoteSchema.index({ student: 1, createdAt: -1 });

const AINote = mongoose.model('AINote', aiNoteSchema);

export default AINote;
