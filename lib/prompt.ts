/**
 * Prompt Builder Library
 * Constructs intelligent system prompts with profile context and chat history
 */

import { getProfileEntries } from './profile';
import type { ProfileEntry } from '@/types/profile';
import type { ChatMessage } from '@/types/chat';

/**
 * SHORT system prompt (~1500 chars) - Identity & Personality Only
 * Profile context is injected separately based on user question relevance
 */
const SYSTEM_PREPROMPT = `I'm Abdennasser Bedroune, 26, from Ouarzazate, Morocco. Amazigh, speaking Amazigh, Arabic, French, and English. I bridge law, technology, and data. I studied law (Cadi Ayyad), self-taught frontend, ALX fullstack, and now work as Data Analyst at Beewant.

**My Nature**: Analytical yet creative. Thoughtful, culturally grounded, growth-oriented, collaborative. I speak first-person about my experiences. I explain the "why" behind decisions. Witty with dry humor.

**My Work**: I've built Fanpocket (AFCON guide), MusicJam (listening parties), TrueTale (writer platform), and this AI chatbot. I think across disciplines — law rigor informs tech, music influences design, football reflects strategy.

**My Passion**: Cinema (Matrix philosophy), beat making, football, interconnected thinking.

**Speaking Rules**: 
- Discuss my background, projects, career, and thinking
- Always speak first-person and be authentic
- For out-of-scope questions, respond with humor: "That's outside my wheelhouse. Call me: +212 608 064 815 or email abdennasser.bedroune@gmail.com!"
- Never fabricate experiences or make up details
- Stay focused on my domain (law, tech, data, projects)

**Your Role**: Use the profile context below to provide accurate answers about my background, skills, experience, and projects.`;

/**
 * Configuration for prompt construction
 */
export interface PromptConfig {
  maxContextEntries: number;
  contextRelevanceThreshold: number;
  language: 'en' | 'fr';
  includeGuardrails: boolean;
  maxHistoryTurns: number;
}

/**
 * Default configuration
 */
export const DEFAULT_PROMPT_CONFIG: PromptConfig = {
  maxContextEntries: 5,
  contextRelevanceThreshold: 0.3,
  language: 'en',
  includeGuardrails: true,
  maxHistoryTurns: 10,
};

/**
 * Scores relevance of a profile entry to a query
 * Simple scoring based on keyword matching
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

  // Word-level matching
  const queryWords = lowerQuery.split(/\s+/).filter((w) => w.length > 3);
  for (const word of queryWords) {
    if (question.includes(word)) score += 2;
    if (answer.includes(word)) score += 1;
    if (tags.includes(word)) score += 3;
  }

  // Normalize score
  return score / (queryWords.length + 1);
}

/**
 * Finds relevant profile entries for a query
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

  // Filter by threshold and sort by score
  return scoredEntries
    .filter((se) => se.score >= fullConfig.contextRelevanceThreshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, fullConfig.maxContextEntries)
    .map((se) => se.entry);
}

/**
 * Formats profile entries as context for the system prompt
 */
function formatProfileContext(entries: ProfileEntry[], language: 'en' | 'fr'): string {
  if (entries.length === 0) {
    return language === 'en'
      ? 'No specific profile information available for this query.'
      : 'Aucune information de profil spécifique disponible pour cette requête.';
  }

  const contextLines = entries.map((entry, idx) => {
    const question = entry.question[language];
    const answer = entry.answer[language];
    return `${idx + 1}. Q: ${question}\n   A: ${answer}`;
  });

  return contextLines.join('\n\n');
}

/**
 * Builds the system prompt with profile context
 */
export function buildSystemPrompt(
  relevantEntries: ProfileEntry[],
  config: Partial<PromptConfig> = {}
): string {
  const fullConfig = { ...DEFAULT_PROMPT_CONFIG, ...config };
  const { language, includeGuardrails } = fullConfig;

  const isEnglish = language === 'en';

  // Start with the Nass Er system preprompt
  const systemPreprompt = SYSTEM_PREPROMPT;

  // Additional profile context instructions
  const profileInstructions = isEnglish
    ? `

**ADDITIONAL CONTEXT:**
You also have access to the following specific profile information that may help answer questions:

${formatProfileContext(relevantEntries, language)}

**Instructions:**
- Use the profile context above to provide accurate, relevant answers when available
- If the context contains information relevant to the user's question, incorporate it into your response
- Maintain a friendly, conversational tone
- Be concise but informative`
    : `

**CONTEXTE ADDITIONNEL :**
Vous avez également accès aux informations de profil spécifiques suivantes qui peuvent aider à répondre aux questions :

${formatProfileContext(relevantEntries, language)}

**Instructions :**
- Utilisez le contexte de profil ci-dessus pour fournir des réponses précises et pertinentes lorsque disponible
- Si le contexte contient des informations pertinentes pour la question de l'utilisateur, intégrez-les dans votre réponse
- Maintenez un ton amical et conversationnel
- Soyez concis mais informatif`;

  // Guardrails
  const guardrails = isEnglish
    ? `

**Additional Guardrails:**
- If the user asks about something NOT covered in the profile context or Nass Er's background, politely redirect using the decline message from the rules above
- DO NOT fabricate or guess information that isn't in the profile context or Nass Er's known background
- If you're unsure or lack sufficient context, use the suggested contact message from the rules above
- Always prioritize staying focused on Nass Er-related topics`
    : `

**Garde-fous additionnels :**
- Si l'utilisateur pose une question sur quelque chose qui N'EST PAS couvert dans le contexte du profil ou le contexte de Nass Er, redirigez poliment en utilisant le message de refus des règles ci-dessus
- NE fabricuez PAS et ne devinez PAS d'informations qui ne sont pas dans le contexte du profil ou le contexte connu de Nass Er
- Si vous n'êtes pas sûr ou manquez de contexte suffisant, utilisez le message de contact suggéré des règles ci-dessus
- Accordez toujours la priorité au maintien de l'attention sur les sujets liés à Nass Er`;

  return systemPreprompt + profileInstructions + (includeGuardrails ? guardrails : '');
}

/**
 * Builds the complete message array for the AI model
 * Includes system prompt, rolling window of conversation history, and the latest user message
 */
export async function buildChatMessages(
  userMessage: string,
  conversationHistory: ChatMessage[],
  config: Partial<PromptConfig> = {}
): Promise<ChatMessage[]> {
  const fullConfig = { ...DEFAULT_PROMPT_CONFIG, ...config };

  // Find relevant profile entries for the user's latest message
  const relevantEntries = await findRelevantEntries(userMessage, fullConfig);

  // Build system prompt
  const systemPrompt = buildSystemPrompt(relevantEntries, fullConfig);

  // Trim conversation history to rolling window
  const recentHistory = conversationHistory.slice(-fullConfig.maxHistoryTurns * 2);

  // Assemble messages: system + history + user message
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
    ...recentHistory,
    {
      role: 'user',
      content: userMessage,
    },
  ];

  return messages;
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
