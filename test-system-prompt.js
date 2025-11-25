// Simple test to verify system prompt construction
const { buildChatMessages } = require('./lib/prompt.ts');

async function testSystemPrompt() {
  try {
    const messages = await buildChatMessages(
      "What skills do you have?",
      [],
      { language: 'en' }
    );
    
    console.log('=== SYSTEM PROMPT TEST ===');
    console.log('Number of messages:', messages.length);
    console.log('First message role:', messages[0].role);
    console.log('System prompt contains Beewant:', messages[0].content.includes('Beewant'));
    console.log('System prompt contains Marrakech:', messages[0].content.includes('Marrakech'));
    console.log('System prompt contains Critical Rules:', messages[0].content.includes('Critical Rules:'));
    
    console.log('\n=== SYSTEM PROMPT CONTENT ===');
    console.log(messages[0].content);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testSystemPrompt();