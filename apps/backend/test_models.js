const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEYS;
if (!apiKey) {
  console.error('No API key found in env.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey.split(',')[0].trim());

async function run() {
  const modelName = 'gemini-flash-lite-latest';
  try {
    console.log(`Testing model: ${modelName}`);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent('Say hello world');
    console.log(`SUCCESS! Response: ${result.response.text().trim()}`);
  } catch (e) {
    console.log(`FAILED: ${e.message}`);
  }
}

run();
