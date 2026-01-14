const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const env = {};
envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim();
    }
});

const API_KEY = env['GEMINI_API_KEY'];
const BASE_URL = env['GEMINI_BASE_URL'];

console.log('Testing API with:');
console.log('URL:', BASE_URL + '/chat/completions');
console.log('Model:', 'gemini-3.0-flash');
console.log('Key:', API_KEY ? 'Present' : 'Missing');

async function testApi() {
    try {
        const response = await fetch(BASE_URL + '/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: 'gemini-1.5-flash', // Try standard model
                messages: [
                    {
                        role: 'user',
                        content: 'Hello, are you Gemini 3.0 Flash?'
                    }
                ],
                stream: false
            })
        });

        if (!response.ok) {
            console.error('API Error Status:', response.status);
            console.error('API Error Text:', await response.text());
            return;
        }

        const data = await response.json();
        console.log('API Success Response:', JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('Network Error:', error);
    }
}

testApi();
