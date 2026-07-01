import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Question from './models/Question.js';

dotenv.config({ path: './.env' });

async function deduplicate() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        console.log('🔍 Identifying duplicates based on questionText...');

        const duplicates = await Question.aggregate([
            {
                $group: {
                    _id: "$questionText",
                    count: { $sum: 1 },
                    ids: { $push: "$_id" }
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            }
        ]);

        console.log(`📊 Found ${duplicates.length} sets of duplicate questions.`);

        let totalDeleted = 0;

        for (const duplicate of duplicates) {
            // Keep the first one, delete the rest
            const [keep, ...remove] = duplicate.ids;

            console.log(`🗑️ Processing: "${duplicate._id.substring(0, 50)}..."`);
            console.log(`   Keeping ID: ${keep}`);
            console.log(`   Deleting ${remove.length} duplicates.`);

            const result = await Question.deleteMany({ _id: { $in: remove } });
            totalDeleted += result.deletedCount;
        }

        console.log(`✨ Cleanup complete! Total deleted: ${totalDeleted} questions.`);

        mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error during deduplication:', err);
        process.exit(1);
    }
}

deduplicate();
