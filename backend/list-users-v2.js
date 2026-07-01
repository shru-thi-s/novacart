import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import fs from 'fs';

dotenv.config();

const listUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({}, 'email role batch');
        fs.writeFileSync('users_clean.json', JSON.stringify(users, null, 2));
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        process.exit(1);
    }
};

listUsers();
