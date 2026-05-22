const mongoose = require('mongoose');
const { generateQuiz } = require('./src/infrastructure/queue/processors/quiz.processor');
const { initializeAIProviders } = require('./src/infrastructure/ai/providers');
require('dotenv').config();

async function run() {
  await mongoose.connect('mongodb://localhost:27017/lecture-transcription');
  initializeAIProviders();
  
  const blocks = [
    {
      index: 0,
      startTime: 0,
      endTime: 10,
      text: "This is a test transcript about the solar system. The solar system contains 8 planets. The earth is the 3rd planet."
    }
  ];
  
  console.log('Testing quiz generation...');
  try {
    const quiz = await generateQuiz(blocks);
    console.log('Success:', JSON.stringify(quiz, null, 2));
  } catch (err) {
    console.error('Quiz error:', err);
  }
  
  process.exit(0);
}

run().catch(console.error);
