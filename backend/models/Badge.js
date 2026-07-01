import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    icon: {
        type: String, // Emoji or URL
        required: true
    },
    criteria: {
        type: {
            type: String,
            enum: ['streak', 'accuracy', 'questions', 'speed', 'score'],
            required: true
        },
        value: {
            type: Number,
            required: true
        }
    }
}, {
    timestamps: true
});

const Badge = mongoose.model('Badge', badgeSchema);

export default Badge;
