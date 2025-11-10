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
    console.log('System prompt contains Nass Er:', messages[0].content.includes('Nass Er'));
    console.log('System prompt contains rules:', messages[0].content.includes('RULES:'));
    console.log('System prompt contains decline message:', messages[0].content.includes('I\'m here to answer questions about Nass Er\'s work'));
    
    console.log('\n=== SYSTEM PROMPT CONTENT ===');
    console.log(messages[0].content);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testSystemPrompt();