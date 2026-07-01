import OpenAI from 'openai';
import fs from 'fs';

// Initialize OpenAI/HF client
let aiClientInstance = null;
let lastProvider = null;

const getAIClient = (provider) => {
    if (aiClientInstance && lastProvider === provider) return aiClientInstance;

    if (provider === 'openai' && process.env.OPENAI_API_KEY) {
        aiClientInstance = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            timeout: 60000, // 60s timeout
            maxRetries: 2
        });
        lastProvider = 'openai';
    }
    else if (provider === 'huggingface' && (process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN)) {
        aiClientInstance = new OpenAI({
            apiKey: process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN,
            baseURL: "https://router.huggingface.co/v1/",
            timeout: 90000, // 90s timeout for HF
            maxRetries: 3
        });
        lastProvider = 'huggingface';
    }

    return aiClientInstance;
};

// Hugging Face models ordered by stability/reliability
const HF_MODELS = [
    "Qwen/Qwen2.5-7B-Instruct",
    "meta-llama/Llama-3.1-8B-Instruct",
    "mistralai/Mistral-7B-Instruct-v0.3"
];

/**
 * Core completion function with robust failover and retries
 */
async function getAICompletion(prompt, systemMessage = "You are an expert aptitude coach.", retryCount = 0) {
    const PROVIDER = process.env.AI_PROVIDER || 'openai';

    // DIAGNOSTIC LOG V3
    if (retryCount === 0) {
        console.log(`🔍 [AI DEBUG V3] Provider: ${PROVIDER}, Model: ${process.env.HUGGINGFACE_MODEL || 'default'}, Key Length: ${process.env.HUGGINGFACE_API_KEY ? process.env.HUGGINGFACE_API_KEY.length : 0}`);
    }

    const client = getAIClient(PROVIDER);

    if (!client) {
        const errorMsg = `${PROVIDER.toUpperCase()} client not initialized. Check API keys.`;
        console.error(`❌ ${errorMsg}`);
        logError(errorMsg);
        return null;
    }

    // Determine model to use
    let model;
    if (PROVIDER === 'openai') {
        model = process.env.OPENAI_MODEL || "gpt-4-turbo-preview";
    } else {
        // Rotate models on retry for Hugging Face
        const defaultModel = process.env.HUGGINGFACE_MODEL || HF_MODELS[0];
        model = retryCount === 0 ? defaultModel : HF_MODELS[retryCount % HF_MODELS.length];
    }

    try {
        console.log(`${PROVIDER === 'openai' ? '🤖' : '☁️'} [Try ${retryCount + 1}] Requesting ${PROVIDER.toUpperCase()} [${model}]...`);
        const start = Date.now();

        const completion = await client.chat.completions.create({
            model: model,
            messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: prompt }
            ],
            temperature: PROVIDER === 'huggingface' ? 0.4 : 0.5,
            max_tokens: 2000
        });

        const content = completion.choices[0].message.content;
        const duration = (Date.now() - start) / 1000;

        if (!content || content.length < 10) {
            throw new Error("Empty or too short response received from AI.");
        }

        console.log(`✅ ${PROVIDER.toUpperCase()} responded in ${duration}s with ${content.length} chars`);
        if (content.includes('OFFLINE')) console.log('⚠️ [Warning] AI response contained "OFFLINE" string!');
        return content;

    } catch (error) {
        const errorMsg = `AI Error (${PROVIDER} @ ${model}): ${error.message}`;
        console.error(`❌ [AI FATAL V3] ${errorMsg}`);
        if (error.stack) console.error(error.stack);
        logError(errorMsg);

        // Retry logic for Hugging Face (try up to 2 alternative models)
        if (PROVIDER === 'huggingface' && retryCount < 2) {
            console.log(`🔄 Retrying with an alternative model...`);
            await new Promise(r => setTimeout(r, 1000 * (retryCount + 1))); // Incremental backoff
            return getAICompletion(prompt, systemMessage, retryCount + 1);
        }

        return null;
    }
}

function logError(message) {
    try {
        const timestamp = new Date().toISOString();
        fs.appendFileSync('ai-errors.log', `[${timestamp}] ${message}\n`);
    } catch (e) {
        // Ignore logging errors
    }
}

/**
 * Generate AI notes for a topic
 */
export const generateNotes = async (topic, category) => {
    const systemMessage = `You are the world's leading aptitude coach for Tier-1 company placements (Google, Amazon, TCS Digital). 
    Your goal is to provide students with high-impact, professional-grade study guides that are both deep in concept and practical for exams.`;

    const prompt = `Generate a premium study guide for the topic "${topic}" in the category "${category}".

### INSTRUCTIONS:
1. Use **rich markdown formatting**. Use bolding for emphasis, bullet points for lists, and tables for comparisons where appropriate.
2. **Solved Examples** MUST be categorized into three distinct levels:
   - **Level 1: Basic** (Fundamentals and direct application)
   - **Level 2: Medium** (Standard placement-style questions)
   - **Level 3: Hard** (Complex logical twists and challenge problems)
3. Ensure the explanation for each example is step-by-step and extremely clear.
4. Use the EXACT headers provided below in your response.

### RESPONSE TEMPLATE:
**Concepts**: [Detailed explanation of core logic and theories]
**Formulas**: [List of essential equations, formatted clearly]
**Shortcuts**: [Time-saving tricks, mental math techniques, or pro-tips]
**Examples**: [Level-wise solved problems with explanations]

Topic: ${topic}
Category: ${category}`;

    const content = await getAICompletion(prompt, systemMessage);
    if (!content) return generateMockNotes(topic, category);

    // Save for debugging
    try { fs.appendFileSync('ai-debug.log', `\n--- ENHANCED NOTES [${category} - ${topic}] ---\n${content}\n`); } catch (e) { }

    return parseNotesContent(content);
};

/**
 * Generate AI questions
 */
export const generateQuestions = async (category, topic, difficulty, count = 5, retryAttempt = 0) => {
    const systemMessage = `You are a Tier-1 Aptitude Coach. Create exactly ${count} ${difficulty} level MCQs on "${topic}" (${category}).
CRITICAL RULES:
1. ALL 4 options MUST be DIFFERENT and plausible.
2. The "correctAnswer" index MUST match the "correctValue" string.
3. "correctValue" is the EXACT string from "options".
4. "correctAnswer" is the 0-based index.
5. Return ONLY a JSON array.

EXAMPLE:
[{
  "questionText": "2+2?",
  "options": ["2", "3", "4", "5"],
  "correctAnswer": 2,
  "correctValue": "4",
  "explanation": "2+2=4.",
  "category": "${category}",
  "topic": "${topic}",
  "difficulty": "${difficulty}"
}]`;

    const prompt = `Generate ${count} high-quality ${difficulty} questions for ${topic}. Make sure your "correctAnswer" index points to your "correctValue" in the options.`;

    const content = await getAICompletion(prompt, systemMessage);
    if (!content) {
        console.error(`🚨 [AI FALLBACK] No content returned for topic: ${topic}. Returning mocks.`);
        return generateMockQuestions(category, topic, difficulty, count);
    }

    // Save for debugging
    try { fs.appendFileSync('ai-debug.log', `\n--- QUESTIONS [${category} - ${topic}] (Attempt ${retryAttempt}) ---\n${content}\n`); } catch (e) { }

    try {
        let jsonString = content;
        const startBracket = content.indexOf('[');
        const endBracket = content.lastIndexOf(']');

        if (startBracket !== -1 && endBracket !== -1) {
            jsonString = content.substring(startBracket, endBracket + 1);
        }

        jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(jsonString);

        // Quality Check: Use "Double-Entry" verification (Index + Value)
        const verified = parsed.map(q => {
            if (!q || !q.options || q.options.length < 4 || !q.questionText) {
                console.error(`❌ [AI ERROR] Question structure invalid:`, q?.questionText?.substring(0, 30));
                return null;
            }

            // Normalize for comparison
            const options = q.options.map(opt => String(opt || '').trim());
            const correctValue = String(q.correctValue || q.options[q.correctAnswer] || '').trim();

            let actualIndex = options.indexOf(correctValue);

            // Fuzzy match (ignore currency symbols and leading zeros)
            if (actualIndex === -1 && correctValue) {
                const clean = (s) => String(s).replace(/[^0-9.-]/g, '');
                const cleanValue = clean(correctValue);
                if (cleanValue) {
                    actualIndex = options.findIndex(opt => clean(opt) === cleanValue);
                }
            }

            if (actualIndex !== -1) {
                if (actualIndex !== q.correctAnswer) {
                    console.warn(`⚠️ [AI FIX] Correcting MCQ index: ${q.correctAnswer} -> ${actualIndex} for "${correctValue}"`);
                    q.correctAnswer = actualIndex;
                }
                q.options = options; // Use trimmed options
            } else {
                console.error(`❌ [AI ERROR] Correct value "${correctValue}" not found in options [${options.join(', ')}]`);
                return null;
            }

            if (q.correctAnswer < 0 || q.correctAnswer >= 4 || new Set(q.options).size < 4) {
                console.error(`❌ [AI ERROR] Duplicates or invalid index for: ${q.questionText.substring(0, 30)}`);
                return null;
            }
            return q;
        });

        if (verified.includes(null)) {
            if (retryAttempt < 1) {
                console.warn(`⚠️ [AI QUALITY] Question failed basic validation. Retrying (Attempt 1)...`);
                return generateQuestions(category, topic, difficulty, count, retryAttempt + 1);
            }
            console.error(`❌ [AI FATAL] Quality threshold not met after retry. Falling back to mocks.`);
            return generateMockQuestions(category, topic, difficulty, count);
        }

        return parsed;
    } catch (error) {
        console.error('❌ Parsing failed. Falling back to mocks.', error.message);
        return generateMockQuestions(category, topic, difficulty, count);
    }
};

/**
 * Parse notes content into structured format
 */
function parseNotesContent(content) {
    const sections = { concepts: '', formulas: '', shortcuts: '', examples: '' };

    // More robust section parsing using flexible regex
    // Looks for bold headers like **Concepts**: or 1. Concepts: 
    const extractSection = (headerNames, text) => {
        for (const name of headerNames) {
            const regex = new RegExp(`(?:\\*\\*|#|\\d\\.\\s+)?${name}(?:\\*\\*|:)?\\s*([\\s\\S]*?)(?=(?:\\*\\*|#|\\d\\.\\s+)(?:Concepts|Formulas|Shortcuts|Examples)|$)`, 'i');
            const match = text.match(regex);
            if (match && match[1].trim().length > 20) {
                return match[1].trim();
            }
        }
        return '';
    };

    sections.concepts = extractSection(['Concepts', 'Core Concepts', 'Introduction'], content);
    sections.formulas = extractSection(['Formulas', 'Equations', 'Key Formulas'], content);
    sections.shortcuts = extractSection(['Shortcuts', 'Tricks', 'Pro-Tips'], content);
    sections.examples = extractSection(['Examples', 'Solved Examples', 'Practice Problems'], content);

    // Final fallback: if everything failed, put everything into concepts
    if (!sections.concepts && !sections.formulas && !sections.examples) {
        sections.concepts = content;
    }

    return sections;
}

/**
 * Fallback Mock Data
 */
function generateMockNotes(topic, category) {
    return {
        concepts: `**Concepts**: ${topic} covers the base logic for ${category}.`,
        formulas: `**Formulas**: Essential logic for ${topic}.`,
        shortcuts: `**Shortcuts**: Time-saving tricks.`,
        examples: `**Examples**: Sample problems for ${topic}.`
    };
}

function generateMockQuestions(category, topic, difficulty, count) {
    const mocks = {
        'Quantitative': [{ questionText: 'Sample Quant [OFFLINE]', options: ['A', 'B', 'C', 'D'], correctAnswer: 0, explanation: 'Check connection.' }],
        'Logical': [{ questionText: 'Sample Logical [OFFLINE]', options: ['A', 'B', 'C', 'D'], correctAnswer: 0, explanation: 'Check connection.' }],
        'Verbal': [{ questionText: 'Sample Verbal [OFFLINE]', options: ['A', 'B', 'C', 'D'], correctAnswer: 0, explanation: 'Check connection.' }]
    };
    const template = mocks[category] || mocks['Quantitative'];
    return Array(count).fill(0).map(() => ({ ...template[0], topic, difficulty }));
}

/**
 * Check Status
 */
export const checkAIStatus = async () => {
    const PROVIDER = process.env.AI_PROVIDER || 'openai';
    if (PROVIDER === 'openai') return { status: process.env.OPENAI_API_KEY ? 'ready' : 'unconfigured', provider: 'OpenAI' };
    if (PROVIDER === 'huggingface') return { status: process.env.HUGGINGFACE_API_KEY ? 'ready' : 'unconfigured', provider: 'Hugging Face' };
    return { status: 'unknown', provider: PROVIDER };
};
