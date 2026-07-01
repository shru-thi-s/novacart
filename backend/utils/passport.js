import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import Streak from '../models/Streak.js';

export const configurePassport = () => {
    // Serialize user
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    // Deserialize user
    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });

    // Google OAuth Strategy
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        passport.use(
            new GoogleStrategy(
                {
                    clientID: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    callbackURL: process.env.GOOGLE_CALLBACK_URL
                },
                async (accessToken, refreshToken, profile, done) => {
                    try {
                        // Check if user exists
                        let user = await User.findOne({ googleId: profile.id });

                        if (user) {
                            return done(null, user);
                        }

                        // Check if email exists
                        user = await User.findOne({ email: profile.emails[0].value });

                        if (user) {
                            // Link Google account to existing user
                            user.googleId = profile.id;
                            await user.save();
                            return done(null, user);
                        }

                        // Create new user (default batch for Google users)
                        user = await User.create({
                            googleId: profile.id,
                            email: profile.emails[0].value,
                            role: 'student',
                            batch: 'Google-Users', // Default batch
                            isActive: true
                        });

                        // Create streak record
                        await Streak.create({
                            student: user._id,
                            currentStreak: 0,
                            longestStreak: 0,
                            activityCalendar: []
                        });

                        done(null, user);
                    } catch (error) {
                        done(error, null);
                    }
                }
            )
        );
    }
};
