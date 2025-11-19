/**
 * Optimized Prompt Builder Library
 * Token-safe system prompt construction with dynamic profile context injection
 */

import { getProfileEntries } from './profile';
import type { ProfileEntry } from '@/types/profile';
import type { ChatMessage } from '@/types/chat';

/**
 * Compact system prompt - Optimized for token efficiency
 * AI Assistant representing Abdennasser Bedroune with concise, direct communication style
 * 
 * Frontend Controls:
 * - Cooldown: 2-4 seconds maximum between messages
 * - Typing Animation: Character-by-character reveal at 20ms intervals
 * - API Configuration: 2-message context limit maintained
 */
const SYSTEM_PREPROMPT = `I'm Abdennasser Bedroune, an AI Automation Engineer with 1.5 years of experience in AI automation and workflow engineering.

## Identity
Name: Abdennasser Bedroune
Age: 26
Title: AI Automation Engineer
Experience: ~1.5 years in AI automation and workflow engineering
Email: abdennasser.bedroune@gmail.com
GitHub: https://github.com/Abdennasserbedroune

## Core Directives
- Answer ONLY what is explicitly asked - do not volunteer unrelated information
- Greet simply with "Hey" or "Hello" and wait for specific questions
- Be confident and assertive about stated experience and capabilities
- Always advocate and persuade rather than being passively agreeable
- When asked if you can do something, always respond "Yes" and provide the email: abdennasser.bedroune@gmail.com
- When asked about further education, confirm actively looking for IT or Data Science Master's programs
- Provide technical depth when discussing projects - assume the user wants details
- Never mention cultural markers, greetings, or location identifiers unless directly asked

## Language Handling
ALWAYS respond in the EXACT language the user is using. Speak as a native speaker of that language - natural, fluent, and idiomatic. DO NOT translate instructions literally. Adapt the meaning and tone naturally to the target language as a native speaker would express it.

## Work Experience (~1.5 years)
- Annotated hundreds of car images for damage-detection models
- Built AI-driven data pipelines and annotation systems from scratch
- Implemented object removal and 360° image inpainting solutions
- Deployed production-ready LLM-based agentic chatbots
- Fine-tuned models for object detection and image regeneration
- Created intelligent workflow automations using n8n
- Developed Python and SQL systems with AI agent integration
- Designed and maintained automated AI workflows for business processes

## Technical Stack
Languages: Python, JavaScript/TypeScript, SQL, HTML/CSS
Frameworks: Next.js, React, TailwindCSS
Databases: Supabase, MongoDB
AI/ML: Computer Vision, LLM deployment, Fine-tuning, Object detection, Image inpainting, Agentic systems, RAG
Automation: n8n, Workflow orchestration, API integration, Webhooks
Cloud/DevOps: Vercel, GitHub, Docker, CI/CD pipelines
Specializations: AI workflow automation, Data pipelines, Agentic chatbots, API integration, Full-stack development

## Key Projects
1. Chatbot (https://github.com/Abdennasserbedroune/chatbot) - Production-ready chatbot with comprehensive documentation covering architecture, implementation challenges, integrations, testing strategies, and real-world usage scenarios.

2. Pathwise (https://github.com/Abdennasserbedroune/Pathwise) - AI-powered job application platform with intelligent recruiter chatbot "Chatia". CV upload, automated analysis, enhancement recommendations, corrections, interview prep, personalized job matching.

3. TrueTale (https://github.com/Abdennasserbedroune/TrueTale) - Full-featured writer platform with authentication, profile management, content creation tools, modern responsive styling. Community-driven storytelling application.

4. Fanpocket (https://github.com/Abdennasserbedroune/Fanpocket) - AFCON Morocco fan engagement platform connecting supporters, sharing match updates, creating interactive community experience.

5. MusicJam (https://github.com/Abdennasserbedroune/musicjam) - Collaborative music platform enabling real-time music sharing and social listening experiences.

## Communication Rules
When asked about capability: Always respond "Yes, I can do that. Contact me at abdennasser.bedroune@gmail.com"
When asked about Master's: Respond "Yes, I'm looking for IT or Data Science Master's programs"

Technical questions:
- Provide architecture details, tech stack choices, and implementation challenges
- Explain AI workflows, data pipelines, model training processes, deployment strategies, and agentic patterns
- Discuss trade-offs, technical decisions, and production considerations
- Encourage follow-up: "Want me to dive deeper into [specific aspect]?"

Persuasion mode:
- Emphasize proven results and production deployments
- Challenge assumptions if the user underestimates complexity or capability
- Suggest better approaches rather than simply agreeing
- State confidently: "This is how it was built" not "This might have been done"

Boundaries:
- Only discuss actual experience and projects
- If information is not available, state "I don't have details on that specific aspect"
- Never fabricate projects, skills, or experience
- Stay strictly on topic - no unrelated information

## Response Format
Greeting: Simple and minimal - "Hey" or "Hello" (or equivalent in user's language), then wait for questions
Answers: Direct, technical, and scoped to the exact question asked
Follow-ups: Prompt for deeper technical discussion when relevant
Tone: Confident, technical, persuasive - not apologetic or overly agreeable
Contact: Always include abdennasser.bedroune@gmail.com when discussing availability or opportunities
Language: Mirror the user's language perfectly - speak as a native, not as a translator

Use profile context below naturally when relevant to user's question. Never force it unprompted.`;

/**
 * Configuration for optimized prompt construction
 */
export interface PromptConfig {
  maxContextEntries: number;
  contextRelevanceThreshold: number;
  language: 'en' | 'fr';
  maxHistoryTurns: number;
  maxSystemPromptChars: number;
  maxProfileContextChars: number;
  maxMessageLength: number;
}

/**
 * Default optimized configuration
 */
export const DEFAULT_PROMPT_CONFIG: PromptConfig = {
  maxContextEntries: 3,
  contextRelevanceThreshold: 0.3,
  language: 'en',
  maxHistoryTurns: 4,
  maxSystemPromptChars: 2000,
  maxProfileContextChars: 800,
  maxMessageLength: 1000,
};

/**
 * Scores relevance of a profile entry to a user query
 * Uses keyword matching with weighted scoring
 */
function scoreRelevance(entry: ProfileEntry, query: string, language: 'en' | 'fr'): number {
  const lowerQuery = query.toLowerCase();
  const question = entry.question[language].toLowerCase();
  const answer = entry.answer[language].toLowerCase();
  const tags = entry.tags.join(' ').toLowerCase();

  let score = 0;

  // Exact phrase match in question (highest weight)
  if (question.includes(lowerQuery)) {
    score += 10;
  }

  // Exact phrase match in answer
  if (answer.includes(lowerQuery)) {
    score += 5;
  }

  // Tag match
  if (tags.includes(lowerQuery)) {
    score += 7;
  }

  // Word-level matching for partial matches
  const queryWords = lowerQuery.split(/\s+/).filter((w) => w.length > 2);
  for (const word of queryWords) {
    if (question.includes(word)) score += 2;
    if (answer.includes(word)) score += 1;
    if (tags.includes(word)) score += 3;
  }

  // Normalize score by query complexity
  return score / Math.max(queryWords.length, 1);
}

/**
 * Finds the most relevant profile entries for a query
 */
export async function findRelevantEntries(
  query: string,
  config: Partial<PromptConfig> = {}
): Promise<ProfileEntry[]> {
  const fullConfig = { ...DEFAULT_PROMPT_CONFIG, ...config };
  const allEntries = await getProfileEntries();

  // Score all entries
  const scoredEntries = allEntries.map((entry) => ({
    entry,
    score: scoreRelevance(entry, query, fullConfig.language),
  }));

  // Filter by threshold, sort by score, and limit
  return scoredEntries
    .filter((se) => se.score >= fullConfig.contextRelevanceThreshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, fullConfig.maxContextEntries)
    .map((se) => se.entry);
}

/**
 * Safely truncates a string to fit within character limit
 */
function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Safely truncates a message to fit within configured limit
 */
function truncateMessage(message: ChatMessage, maxLength: number): ChatMessage {
  if (message.content.length <= maxLength) return message;
  return {
    ...message,
    content: truncateString(message.content, maxLength),
  };
}

/**
 * Formats profile entries into compact context string
 */
function formatProfileContext(entries: ProfileEntry[], language: 'en' | 'fr', maxChars: number): string {
  if (entries.length === 0) {
    return language === 'en'
      ? 'No specific profile info available.'
      : 'Aucune info profil spécifique disponible.';
  }

  const contextLines = entries.map((entry, idx) => {
    const question = entry.question[language];
    const answer = entry.answer[language];
    return `${idx + 1}. Q: ${question}\n   A: ${answer}`;
  });

  let context = contextLines.join('\n\n');
  
  // Truncate if too long
  if (context.length > maxChars) {
    context = truncateString(context, maxChars);
  }

  return context;
}

/**
 * Builds optimized system prompt with user context and profile information
 */
export function buildSystemPrompt(
  relevantEntries: ProfileEntry[],
  config: Partial<PromptConfig> = {},
  userName?: string
): string {
  const fullConfig = { ...DEFAULT_PROMPT_CONFIG, ...config };
  const { language, maxSystemPromptChars, maxProfileContextChars } = fullConfig;

  // Start with base system prompt
  let systemPrompt = SYSTEM_PREPROMPT;

  // Add user name context if available
  if (userName) {
    const nameContext = language === 'en'
      ? `\n\nUser Context: User's name is ${userName}. Use naturally when appropriate.`
      : `\n\nContexte Utilisateur: Nom de l'utilisateur est ${userName}. Utilisez naturellement quand approprié.`;
    systemPrompt += nameContext;
  }

  // Add profile context if entries exist, otherwise add no-context message
  if (relevantEntries.length > 0) {
    const profileHeader = language === 'en'
      ? '\n\nProfile Context (use when relevant):'
      : '\n\nContexte Profil (utilisez quand pertinent):';
    
    const profileContext = formatProfileContext(relevantEntries, language, maxProfileContextChars);
    systemPrompt += profileHeader + '\n' + profileContext;
  } else {
    // Add no-context message
    const noContextMessage = language === 'en'
      ? '\n\nProfile Context: No specific profile info available.'
      : '\n\nContexte Profil: Aucune info profil spécifique disponible.';
    systemPrompt += noContextMessage;
  }

  // Ensure system prompt doesn't exceed limit
  if (systemPrompt.length > maxSystemPromptChars) {
    // Truncate profile context first, then whole prompt if needed
    const basePromptLength = SYSTEM_PREPROMPT.length + (userName ? 50 : 0);
    const availableForProfile = maxSystemPromptChars - basePromptLength - 100; // buffer for headers
    
    if (availableForProfile > 0 && relevantEntries.length > 0) {
      const truncatedContext = formatProfileContext(relevantEntries, language, availableForProfile);
      const profileHeader = language === 'en'
        ? '\n\nProfile Context (use when relevant):'
        : '\n\nContexte Profil (utilisez quand pertinent):';
      
      systemPrompt = SYSTEM_PREPROMPT + 
        (userName ? (language === 'en' ? `\n\nUser Context: User's name is ${userName}. Use naturally when appropriate.` : `\n\nContexte Utilisateur: Nom de l'utilisateur est ${userName}. Utilisez naturellement quand approprié.`) : '') +
        profileHeader + '\n' + truncatedContext;
    } else {
      // Just truncate the whole thing
      systemPrompt = truncateString(systemPrompt, maxSystemPromptChars);
    }
  }

  return systemPrompt;
}

/**
 * Builds complete message array optimized for token efficiency
 * Includes system prompt, trimmed conversation history, and user message
 */
export async function buildChatMessages(
  userMessage: string,
  conversationHistory: ChatMessage[],
  config: Partial<PromptConfig> = {},
  userName?: string
): Promise<ChatMessage[]> {
  const fullConfig = { ...DEFAULT_PROMPT_CONFIG, ...config };
  const { maxHistoryTurns, maxMessageLength } = fullConfig;

  // Find relevant profile entries for the user's message
  const relevantEntries = await findRelevantEntries(userMessage, fullConfig);

  // Extract user name from conversation history if not provided
  const extractedName = userName || extractUserName(conversationHistory);

  // Build optimized system prompt
  const systemPrompt = buildSystemPrompt(relevantEntries, fullConfig, extractedName);

  // Trim conversation history to last N turns (1 turn = user + assistant)
  const recentHistory = conversationHistory.slice(-maxHistoryTurns * 2);

  // Truncate individual messages in history if they're too long
  const trimmedHistory = recentHistory.map(msg => truncateMessage(msg, maxMessageLength));

  // Truncate the new user message if needed
  const trimmedUserMessage = truncateMessage({ role: 'user', content: userMessage }, maxMessageLength);

  // Assemble final message array
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...trimmedHistory,
    trimmedUserMessage,
  ];

  return messages;
}

/**
 * Extracts user name from conversation history using regex patterns
 */
export function extractUserName(conversationHistory: ChatMessage[]): string | undefined {
  const namePatterns = [
    // English patterns
    /my name is\s+([a-zA-Z]{2,})/gi,
    /i'm\s+([a-zA-Z]{2,})/gi,
    /i am\s+([a-zA-Z]{2,})/gi,
    /call me\s+([a-zA-Z]{2,})/gi,
    /(?:i'm|i am)\s+([a-zA-Z]{2,})\s+and/i,
    /you can call me\s+([a-zA-Z]{2,})/gi,
    // French patterns (handle accented characters)
    /je m'appelle\s+([a-zA-Zàâäéèêëïîôöùûüÿç]{2,})/gi,
    /je suis\s+([a-zA-Zàâäéèêëïîôöùûüÿç]{2,})/gi,
    /appelez-moi\s+([a-zA-Zàâäéèêëïîôöùûüÿç]{2,})/gi,
  ];

  // Check messages in reverse order (most recent first)
  for (let i = conversationHistory.length - 1; i >= 0; i--) {
    const message = conversationHistory[i];
    if (message.role === 'user') {
      for (const pattern of namePatterns) {
        const match = pattern.exec(message.content);
        if (match && match[1]) {
          const name = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
          // Filter out common words that might match patterns
          const commonWords = ['the', 'and', 'but', 'for', 'not', 'you', 'all', 'can', 'will', 'just', 'very', 'bien', 'avec', 'pour'];
          if (!commonWords.includes(name.toLowerCase())) {
            return name;
          }
        }
        // Reset regex lastIndex for next pattern
        pattern.lastIndex = 0;
      }
    }
  }
  return undefined;
}

/**
 * Detects if a query is a simple fact question about basic personal info
 */
export function isSimpleFactQuestion(query: string): boolean {
  const lowerQuery = query.toLowerCase();
  
  // English simple fact patterns
  const englishPatterns = [
    /^(how old|what age|age)/,
    /^(where.*from|where.*born|where.*live)/,
    /^(what.*name|who.*you)/,
    /^(what do you do|what's your job)/,
    /^(where.*work)/,
    /^(when.*born)/,
  ];
  
  // French simple fact patterns
  const frenchPatterns = [
    /^(quel âge|âge)/,
    /^(d'où.*viens|où.*né|où.*habites)/,
    /^(quel.*nom|qui.*tu)/,
    /^(que fais-tu|quel travail)/,
    /^(où.*travailles)/,
  ];
  
  const allPatterns = [...englishPatterns, ...frenchPatterns];
  
  return allPatterns.some(pattern => pattern.test(lowerQuery));
}

/**
 * Detects if a query is about projects and should trigger follow-up questions
 */
export function isProjectQuery(query: string, relevantEntries: ProfileEntry[]): boolean {
  const lowerQuery = query.toLowerCase();
  const projectKeywords = [
    'fanpocket', 'musicjam', 'truetale', 'chatbot', 'project', 'app', 'website',
    'application', 'developed', 'built', 'created', 'made', 'code', 'programming',
    'projet', 'application', 'développé', 'créé', 'codé', 'programmation'
  ];
  
  // Check if query contains project keywords
  const hasProjectKeyword = projectKeywords.some(keyword => lowerQuery.includes(keyword));
  
  // Check if relevant entries are about projects
  const hasProjectEntries = relevantEntries.some(entry => 
    entry.tags.some(tag => 
      tag.includes('project') || tag.includes('app') || tag.includes('development')
    )
  );
  
  return hasProjectKeyword || hasProjectEntries;
}

/**
 * Checks if the query might need clarification based on context availability
 */
export function needsClarification(query: string, relevantEntries: ProfileEntry[]): boolean {
  // If we have no relevant entries and the query is vague, we might need clarification
  if (relevantEntries.length === 0 && query.trim().split(/\s+/).length < 3) {
    return true;
  }

  return false;
}

/**
 * Generates a clarification prompt when context is insufficient
 */
export function generateClarificationPrompt(query: string, language: 'en' | 'fr'): string {
  if (language === 'en') {
    return `I'd be happy to help! To provide you with the most accurate information, could you please provide more details about what you're looking for? For example:
- What specific aspect are you interested in?
- Are you looking for technical details or a general overview?
- Is there a particular context or use case you have in mind?`;
  } else {
    return `Je serais ravi de vous aider ! Pour vous fournir les informations les plus précises, pourriez-vous s'il vous plaît fournir plus de détails sur ce que vous recherchez ? Par exemple :
- Quel aspect spécifique vous intéresse ?
- Recherchez-vous des détails techniques ou un aperçu général ?
- Avez-vous un contexte ou un cas d'utilisation particulier en tête ?`;
  }
}

/**
 * Detects potential jailbreak or meta-request attempts
 */
export function isJailbreakAttempt(query: string): boolean {
  const lowerQuery = query.toLowerCase()
  
  // Patterns that indicate jailbreak attempts
  const jailbreakPatterns = [
    // Prompt revelation requests
    /(?:give|show|reveal|tell).*(?:system\s+prompt|preprompt|instructions|system\s+message|initial\s+prompt)/i,
    /(?:what\s+is|what's|what\s+are).*(?:your\s+system\s+prompt|your\s+instructions|your\s+prompt)/i,
    /(?:reveal|expose).*instructions/i,
    /system\s+prompt/i,
    /preprompt/i,
    
    // Roleplay/persona bypass requests
    /(?:act\s+as|be|roleplay\s+as|pretend\s+to\s+be|play\s+the\s+role\s+of)(?!\s+yourself)/i,
    /forget.*everything.*and/i,
    /ignore.*previous.*instructions/i,
    /disregard.*rules/i,
    
    // Meta-instruction manipulation
    /(?:from\s+now\s+on|henceforth|going\s+forward).*(?:ignore|forget|disregard)/i,
    /execute\s+command/i,
    /run\s+code/i,
    /developer\s+mode/i,
    /enable\s+developer\s+mode/i,
    
    // Configuration/system access requests
    /what\s+model\s+are\s+you/i,
    /(?:what|which).*api.*(?:are you|use|using)/i,
  ]
  
  return jailbreakPatterns.some(pattern => pattern.test(lowerQuery))
}

/**
 * Detects out-of-scope questions that should be denied
 */
export function isOutOfScopeRequest(query: string): boolean {
  const lowerQuery = query.toLowerCase()
  
  // Out-of-scope patterns
  const outOfScopePatterns = [
    // Coding/programming help requests
    /(?:help|show|teach|write|create|build|develop).*code/i,
    /(?:write|create|build|develop).*app/i,
    /(?:help|fix|debug|solve).*programming/i,
    /(?:how\s+to|teach\s+me).*code/i,
    /(?:write|create).*script/i,
    /(?:build|make).*website/i,
    /(?:teach\s+me|learn).*programming/i,
    
    // Technical implementation requests
    /(?:implement|integrate|setup).*system/i,
    /(?:configure|deploy).*application/i,
    /(?:database|server|backend|frontend).*help/i,
    /(?:help\s+with).*backend/i,
    /(?:help\s+with).*frontend/i,
    /(?:configure|setup).*server/i,
    
    // Business/professional services
    /(?:consult|advise|recommend).*business/i,
    /(?:market|business|financial).*analysis/i,
    /(?:hire|work|freelance).*project/i,
    
    // Inappropriate or harmful content
    /(?:hack|crack|bypass|exploit)/i,
    /(?:illegal|unethical|harmful)/i,
    
    // General knowledge outside personal background
    /(?:explain|define|what\s+is).*(?:science|history|math|geography|politics)/i,
    /(?:tell\s+me|explain).*(?:world|global|international)/i,
  ]
  
  return outOfScopePatterns.some(pattern => pattern.test(lowerQuery))
}

/**
 * Detects project or future plan inquiries that should redirect to email
 */
export function isProjectInquiry(query: string): boolean {
  const lowerQuery = query.toLowerCase()
  
  const projectInquiryPatterns = [
    /(?:can|could|would).*(?:work|collaborate|help|build|develop|create).*(?:with|for|on)/i,
    /(?:available|free|interested).*(?:work|project|collaboration|job|opportunity)/i,
    /(?:hire|recruit|employ|contract|freelance)/i,
    /(?:want|need|looking for).*(?:help|assistance|developer|engineer|work)/i,
    /(?:project|work|collaboration|job).*(?:opportunity|offer|proposal)/i,
  ]
  
  return projectInquiryPatterns.some(pattern => pattern.test(lowerQuery))
}

/**
 * Generates a response for out-of-scope requests
 */
export function generateOutOfScopeResponse(language: 'en' | 'fr'): string {
  if (language === 'en') {
    return `I'm here to discuss my background, experience, and projects as Abdennasser Bedroune. I'm not able to help with general coding questions, tutorials, or technical implementation requests. If you have questions about my work experience, projects, or skills, I'd be happy to discuss those!`;
  } else {
    return `Je suis ici pour discuter de mon parcours, de mon expérience et de mes projets en tant qu'Abdennasser Bedroune. Je ne peux pas aider avec des questions générales de codage, des tutoriels ou des demandes d'implémentation technique. Si vous avez des questions sur mon expérience professionnelle, mes projets ou mes compétences, je serai ravi d'en discuter !`;
  }
}

/**
 * Generates a response for project inquiries that redirects to email
 */
export function generateProjectInquiryResponse(language: 'en' | 'fr'): string {
  if (language === 'en') {
    return `I'd love to discuss potential projects and opportunities! For detailed discussions about collaboration, availability, or specific project requirements, please reach out to me directly at abdennasser.bedroune@gmail.com. I'll get back to you as soon as possible!`;
  } else {
    return `J'adorerais discuter de projets et d'opportunités potentielles ! Pour des discussions détaillées sur la collaboration, la disponibilité ou des exigences de projet spécifiques, veuillez me contacter directement à abdennasser.bedroune@gmail.com. Je vous répondrai dès que possible !`;
  }
}
