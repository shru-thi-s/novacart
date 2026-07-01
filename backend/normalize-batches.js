import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const normalizeBatches = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const students = await User.find({ role: 'student', batch: { $exists: true } });
        console.log(`Found ${students.length} students to check.`);

        let updatedCount = 0;
        for (const student of students) {
            const originalBatch = student.batch;
            const normalizedBatch = originalBatch.trim().toLowerCase();

            if (originalBatch !== normalizedBatch) {
                student.batch = normalizedBatch;
                await student.save();
                console.log(`Updated student ${student.email}: ${originalBatch} -> ${normalizedBatch}`);
                updatedCount++;
            }
        }

        console.log(`Normalization complete. Total updated: ${updatedCount}`);
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

normalizeBatches();
