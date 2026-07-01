import mongoose from 'mongoose';

const userBadgeSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    badge: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Badge',
        required: true
    },
    earnedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// One badge per user
userBadgeSchema.index({ student: 1, badge: 1 }, { unique: true });

const UserBadge = mongoose.model('UserBadge', userBadgeSchema);

export default UserBadge;
