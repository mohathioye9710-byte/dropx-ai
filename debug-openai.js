require('dotenv').config({ path: '.env.local' });
const OpenAI = require('openai');
const openai = new OpenAI();
async function run() {
  try {
    const models = await openai.models.list();
    console.log('All models:', models.data.map(m => m.id).join(', '));
  } catch (e) {
    console.error('Error:', e.message);
  }
}
run();
