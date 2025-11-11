// Simple test to verify guardrails work
const { isProjectInquiry, isOutOfScope, getProjectInquiryResponse, getOutOfScopeResponse } = require('./lib/prompt.ts');

console.log('Testing project inquiries:');
console.log('Create website:', isProjectInquiry('Can you help me create a website?'));
console.log('Collaborate:', isProjectInquiry('Let\'s collaborate on a project'));
console.log('Personal question:', isProjectInquiry('What are your hobbies?'));

console.log('\nTesting out of scope:');
console.log('Weather question:', isOutOfScope('What is the weather like today?'));
console.log('Medical advice:', isOutOfScope('Can you give me medical advice?'));
console.log('Personal question:', isOutOfScope('What do you do for work?'));

console.log('\nTesting responses:');
console.log('Project response EN:', getProjectInquiryResponse('en'));
console.log('Project response FR:', getProjectInquiryResponse('fr'));
console.log('Out of scope response EN:', getOutOfScopeResponse('en'));
console.log('Out of scope response FR:', getOutOfScopeResponse('fr'));