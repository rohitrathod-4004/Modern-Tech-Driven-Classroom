require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function test() {
  console.log('Testing gemini-2.0-flash...');
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });
    const result = await model.generateContent('Return JSON: {"status": "working", "model": "gemini-2.0-flash"}');
    console.log('✅ SUCCESS:', result.response.text().trim());
  } catch (err) {
    console.log('❌ FAILED:', err.message.substring(0, 200));
  }

  console.log('\nTesting gemini-embedding-001...');
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });
    const result = await model.embedContent('hello world');
    console.log('✅ Embedding length:', result.embedding.values.length);
  } catch (err) {
    console.log('❌ FAILED:', err.message.substring(0, 200));
  }

  process.exit(0);
}

test();
