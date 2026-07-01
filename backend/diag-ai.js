import { generateQuestions } from './utils/aiService.js';
import dotenv from 'dotenv';
dotenv.config();

async function debug() {
    console.log("🔍 Starting diagnostic AI test...");
    const questions = await generateQuestions('Quantitative', 'Percentage', 'Basic', 3);
    console.log("\n--- FINAL OUTPUT ---");
    console.log(JSON.stringify(questions, null, 2));
}

debug();
