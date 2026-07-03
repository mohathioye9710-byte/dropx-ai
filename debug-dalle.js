require('dotenv').config({ path: '.env.local' });
const OpenAI = require('openai');
const openai = new OpenAI();

async function run() {
  try {
    console.log('Testing gpt-image-2...');
    const imageRes = await openai.images.generate({
      model: "gpt-image-2",
      prompt: "A beautiful cinematic product photo of an electronic gadget. High resolution.",
      n: 1,
      size: "1024x1024"
    });
    console.log('Result:', JSON.stringify(imageRes.data));
  } catch (e) {
    console.error('Error:', e.message);
  }
}
run();
