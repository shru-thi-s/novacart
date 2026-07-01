import dotenv from 'dotenv';
dotenv.config({ path: './.env' });
import { generateQuestions } from './utils/aiService.js';
import fs from 'fs';

async function testGeneration() {
    console.log('--- Testing AI Question Generation ---');
    console.log('Category: Quantitative');
    console.log('Topic: Percentages');
    console.log('Difficulty: Medium');

    try {
        const questions = await generateQuestions('Quantitative', 'Percentages', 'Medium', 5);
        console.log('\n--- SUCCESS ---');
        fs.writeFileSync('test-results.json', JSON.stringify(questions, null, 2));
        console.log('Results saved to test-results.json');

        const isDemo = questions[0]?.questionText?.includes('[OFFLINE/DEMO MODE]');
        if (isDemo) {
            console.log('⚠️ Warning: Returned Mock Questions!');
        }
    } catch (error) {
        console.error('\n--- FAILED ---');
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        console.error('Stack Trace:', error.stack);
    }
}


testGeneration();
