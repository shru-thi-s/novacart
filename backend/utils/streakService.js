import Streak from '../models/Streak.js';
import User from '../models/User.js';
import { startOfDay, differenceInDays } from 'date-fns';

/**
 * Update student streak after practice activity
 */
export const updateStreak = async (studentId) => {
    try {
        const today = startOfDay(new Date());

        // Find or create streak record
        let streak = await Streak.findOne({ student: studentId });

        if (!streak) {
            // Create new streak record
            streak = new Streak({
                student: studentId,
                currentStreak: 1,
                longestStreak: 1,
                lastActivityDate: today,
                activityCalendar: [{
                    date: today,
                    questionsAttempted: 1
                }]
            });
            await streak.save();

            // Update user model
            await User.findByIdAndUpdate(studentId, {
                currentStreak: 1,
                longestStreak: 1,
                lastActivityDate: today
            });

            return streak;
        }

        const lastActivity = startOfDay(new Date(streak.lastActivityDate));
        const daysDifference = differenceInDays(today, lastActivity);

        if (daysDifference === 0) {
            // Same day - just increment question count in calendar
            const todayEntry = streak.activityCalendar.find(
                entry => startOfDay(new Date(entry.date)).getTime() === today.getTime()
            );

            if (todayEntry) {
                todayEntry.questionsAttempted += 1;
            } else {
                streak.activityCalendar.push({
                    date: today,
                    questionsAttempted: 1
                });
            }
        } else if (daysDifference === 1) {
            // Consecutive day - increment streak
            streak.currentStreak += 1;
            streak.lastActivityDate = today;

            // Update longest streak if needed
            if (streak.currentStreak > streak.longestStreak) {
                streak.longestStreak = streak.currentStreak;
            }

            // Add to calendar
            streak.activityCalendar.push({
                date: today,
                questionsAttempted: 1
            });
        } else {
            // Streak broken - reset to 1
            streak.currentStreak = 1;
            streak.lastActivityDate = today;

            // Add to calendar
            streak.activityCalendar.push({
                date: today,
                questionsAttempted: 1
            });
        }

        await streak.save();

        // Update user model
        await User.findByIdAndUpdate(studentId, {
            currentStreak: streak.currentStreak,
            longestStreak: streak.longestStreak,
            lastActivityDate: today
        });

        return streak;
    } catch (error) {
        console.error('Error updating streak:', error);
        throw error;
    }
};

/**
 * Get heatmap data for student
 */
export const getHeatmapData = async (studentId, daysBack = 365) => {
    try {
        const streak = await Streak.findOne({ student: studentId });

        if (!streak) {
            return [];
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysBack);

        // Filter calendar data for requested period
        const heatmapData = streak.activityCalendar
            .filter(entry => new Date(entry.date) >= cutoffDate)
            .map(entry => ({
                date: entry.date,
                count: entry.questionsAttempted
            }));

        return heatmapData;
    } catch (error) {
        console.error('Error getting heatmap data:', error);
        throw error;
    }
};

/**
 * Check and update streaks for all students (can be run as daily cron job)
 */
export const checkStreakBreaks = async () => {
    try {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStart = startOfDay(yesterday);

        // Find all students with streaks who didn't practice yesterday
        const streaks = await Streak.find({
            lastActivityDate: { $lt: yesterdayStart },
            currentStreak: { $gt: 0 }
        });

        for (const streak of streaks) {
            const daysSinceActivity = differenceInDays(new Date(), new Date(streak.lastActivityDate));

            if (daysSinceActivity > 1) {
                // Streak is broken
                streak.currentStreak = 0;
                await streak.save();

                // Update user model
                await User.findByIdAndUpdate(streak.student, {
                    currentStreak: 0
                });
            }
        }

        console.log(`Checked ${streaks.length} streaks for breaks`);
    } catch (error) {
        console.error('Error checking streak breaks:', error);
        throw error;
    }
};
