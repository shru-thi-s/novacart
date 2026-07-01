import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    category: {
        type: String,
        enum: ['Quantitative', 'Logical', 'Verbal'],
        required: true
    },
    subtopics: [{
        type: String,
        trim: true
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for category-based filtering
topicSchema.index({ category: 1 });

const Topic = mongoose.model('Topic', topicSchema);

export default Topic;
