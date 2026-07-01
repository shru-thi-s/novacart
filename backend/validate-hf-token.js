import dotenv from 'dotenv';
dotenv.config();

async function validateHFToken() {
    const apiKey = process.env.HUGGINGFACE_API_KEY;

    console.log('🔍 Validating Hugging Face API Key...');
    console.log(`Key (first 10 chars): ${apiKey?.substring(0, 10)}...`);
    console.log(`Key length: ${apiKey?.length} characters`);

    if (!apiKey) {
        console.error('❌ No API key found in .env file!');
        return;
    }

    // Test 1: Check if token is valid by calling whoami endpoint
    try {
        console.log('\n📡 Test 1: Checking token validity...');
        const whoamiResponse = await fetch('https://huggingface.co/api/whoami-v2', {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });

        if (whoamiResponse.ok) {
            const userData = await whoamiResponse.json();
            console.log('✅ Token is VALID');
            console.log(`   User: ${userData.name || 'Unknown'}`);
            console.log(`   Type: ${userData.type || 'Unknown'}`);
        } else {
            const error = await whoamiResponse.text();
            console.error('❌ Token is INVALID or EXPIRED');
            console.error(`   Status: ${whoamiResponse.status}`);
            console.error(`   Error: ${error}`);
            return;
        }
    } catch (error) {
        console.error('❌ Failed to validate token:', error.message);
        return;
    }

    // Test 2: Try a simple chat completion
    try {
        console.log('\n📡 Test 2: Testing chat completion API...');
        const model = process.env.HUGGINGFACE_MODEL || 'Qwen/Qwen2.5-72B-Instruct';

        const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'user', content: 'Say "API is working" in exactly 3 words.' }
                ],
                max_tokens: 20,
                temperature: 0.1
            })
        });

        if (response.ok) {
            const data = await response.json();
            const reply = data.choices?.[0]?.message?.content;
            console.log('✅ Chat completion API is WORKING');
            console.log(`   Model: ${model}`);
            console.log(`   Response: "${reply}"`);
        } else {
            const error = await response.json();
            console.error('❌ Chat completion API FAILED');
            console.error(`   Status: ${response.status}`);
            console.error(`   Error:`, error);
        }
    } catch (error) {
        console.error('❌ Chat completion test failed:', error.message);
    }
}

validateHFToken();
