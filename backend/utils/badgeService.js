import User from '../models/User.js';
import Badge from '../models/Badge.js';
import UserBadge from '../models/UserBadge.js';
import Notification from '../models/Notification.js';

/**
 * Check and award badges based on user performance
 */
export const checkAndAwardBadges = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) return [];

        const allBadges = await Badge.find();
        const earnedBadges = await UserBadge.find({ student: userId }).populate('badge');
        const earnedBadgeIds = new Set(earnedBadges.map(ub => ub.badge._id.toString()));

        const newlyAwarded = [];

        for (const badge of allBadges) {
            if (earnedBadgeIds.has(badge._id.toString())) continue;

            let isEligible = false;
            const { type, value } = badge.criteria;

            switch (type) {
                case 'streak':
                    if (user.currentStreak >= value) isEligible = true;
                    break;
                case 'accuracy':
                    if (user.accuracy >= value && user.totalQuestionsAttempted >= 50) isEligible = true;
                    break;
                case 'questions':
                    if (user.totalQuestionsAttempted >= value) isEligible = true;
                    break;
                case 'speed':
                    if (user.averageTimePerQuestion <= value && user.totalQuestionsAttempted >= 20) isEligible = true;
                    break;
            }

            if (isEligible) {
                await UserBadge.create({
                    student: userId,
                    badge: badge._id
                });

                // Create notification
                await Notification.create({
                    student: userId,
                    type: 'achievement',
                    title: `🎖️ New Badge Earned: ${badge.name}`,
                    message: `Congratulations! You've earned the "${badge.name}" badge. ${badge.description}`,
                });

                newlyAwarded.push(badge);
            }
        }

        return newlyAwarded;
    } catch (error) {
        console.error('Error awarding badges:', error);
        return [];
    }
};

/**
 * Initialize default badges in the system
 */
export const seedBadges = async () => {
    const defaultBadges = [
        {
            name: 'Consistent Learner',
            description: 'Maintain a 3-day daily streak.',
            icon: '🔥',
            criteria: { type: 'streak', value: 3 }
        },
        {
            name: '7-Day Warrior',
            description: 'Maintain a 7-day daily streak.',
            icon: '⚔️',
            criteria: { type: 'streak', value: 7 }
        },
        {
            name: 'Eagle Eye',
            description: 'Maintain over 90% accuracy (min 50 questions).',
            icon: '🦅',
            criteria: { type: 'accuracy', value: 90 }
        },
        {
            name: 'Speedster',
            description: 'Average under 30s per question (min 20 questions).',
            icon: '⚡',
            criteria: { type: 'speed', value: 30 }
        },
        {
            name: 'Centurion',
            description: 'Complete 100 questions in total.',
            icon: '💯',
            criteria: { type: 'questions', value: 100 }
        }
    ];

    for (const b of defaultBadges) {
        await Badge.updateOne({ name: b.name }, b, { upsert: true });
    }
    console.log('✅ Default badges seeded');
};
