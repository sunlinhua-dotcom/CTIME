const fs = require('fs');
const path = require('path');

// Read env directly
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

// A tiny 1x1 transparent PNG base64
const BASE64_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

async function debugProxy() {
    console.log('--- Debugging Proxy WITH IMAGE ---');
    console.log('URL:', `${BASE_URL}/chat/completions`);
    console.log('Model:', 'gemini-3-flash-preview');

    const payload = {
        model: 'gemini-3-flash-preview',
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: "What is in this image?" },
                    { type: "image_url", image_url: { url: BASE64_IMAGE } }
                ]
            }
        ],
        stream: true
    };

    try {
        const response = await fetch(`${BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify(payload)
        });

        console.log('Status:', response.status);
        console.log('StatusText:', response.statusText);

        if (!response.body) {
            console.error('No response body!');
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        console.log('--- Start Streaming ---');
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            // Log only if it contains content to avoid noise
            if (chunk.includes('"content"')) {
                console.log('CONTENT CHUNK:', chunk);
            } else {
                console.log('OTHER CHUNK:', chunk);
            }
        }
        console.log('--- End Streaming ---');

    } catch (error) {
        console.error('Fetch Error:', error);
    }
}

debugProxy();
