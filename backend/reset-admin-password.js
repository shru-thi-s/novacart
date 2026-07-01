import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config({ path: './.env' });

async function resetAdminPassword() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const admin = await User.findOne({ role: 'admin' });

        if (!admin) {
            console.error('No admin user found in the database');
            process.exit(1);
        }

        console.log(`Found admin: ${admin.email}`);

        // Setting the plain text password. 
        // The pre-save hook in User.js will handle the hashing.
        admin.password = 'admin123';

        await admin.save();
        console.log('Admin password successfully reset to: admin123');

        mongoose.connection.close();
    } catch (err) {
        console.error('Error resetting admin password:', err);
        process.exit(1);
    }
}

resetAdminPassword();
