/**
 * Chat Page
 * Main chat interface with typing animations and responsive design
 */

import type { ReactElement } from 'react';
import { useState, useCallback, useEffect } from 'react';
import Head from 'next/head';
import { ChatLayout, MessageList, ChatComposer, ErrorBanner, LanguageSwitcher } from '@/components/chat';
import { useChatStore } from '@/lib/chatStore';
import { useTranslations } from '@/lib/i18n';
import { detectLanguage } from '@/lib/languageDetection';
import type { ChatMessage } from '@/types/chat';

export default function Chat(): ReactElement {
  const {
    messages,
    isTyping,
    streamingText,
    isStreaming,
    language,
    error,
    userName,
    addMessage,
    setTyping,
    startStreaming,
    stopStreaming,
    setLanguage,
    setError,
    setUserName,
  } = useChatStore();

  const { t } = useTranslations(language);
  const [lastMessageRef, setLastMessageRef] = useState<string>('');

  const handleSendMessage = useCallback(
    async (content: string) => {
      // Detect language from user message if not manually set
      const detectedLang = detectLanguage(content);
      if (detectedLang !== language) {
        setLanguage(detectedLang);
      }

      // Add user message
      addMessage({
        content,
        role: 'user',
      });

      setLastMessageRef(content);
      setTyping(true);
      setError(null);

      // Name extraction is now handled in the backend
      // The backend will extract names from conversation history

      try {
        // Build conversation history
        const conversationHistory: ChatMessage[] = messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        // Send to API
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [...conversationHistory, { role: 'user', content }],
            language: detectedLang,
            userName: userName,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || t('apiError'));
        }

        if (!response.body) {
          throw new Error('No response stream available');
        }

        // Handle SSE streaming
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedText = '';

        let streaming = true;
        while (streaming) {
          const { done, value } = await reader.read();

          if (done) {
            streaming = false;
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6);
              try {
                const data = JSON.parse(jsonStr);

                if (data.type === 'content') {
                  accumulatedText += data.data;
                  startStreaming(accumulatedText);
                } else if (data.type === 'done') {
                  stopStreaming();
                  setTyping(false);
                } else if (data.type === 'error') {
                  throw new Error(data.error);
                }
              } catch (parseError) {
                console.error('Failed to parse SSE data:', parseError);
              }
            }
          }
        }
      } catch (err) {
        console.error('Chat error:', err);
        setError(err instanceof Error ? err.message : t('apiError'));
        setTyping(false);
        stopStreaming();
      }
    },
    [messages, language, userName, addMessage, setTyping, startStreaming, stopStreaming, setLanguage, setError, t, setUserName]
  );

  const handleRetry = useCallback(() => {
    if (lastMessageRef) {
      handleSendMessage(lastMessageRef);
    }
  }, [lastMessageRef, handleSendMessage]);

  // Handle suggestion clicks from the empty state
  useEffect(() => {
    const handleSuggestionClick = (event: CustomEvent) => {
      handleSendMessage(event.detail);
    };

    window.addEventListener('suggestionClick', handleSuggestionClick as EventListener);
    return () => {
      window.removeEventListener('suggestionClick', handleSuggestionClick as EventListener);
    };
  }, [handleSendMessage]);

  return (
    <>
      <Head>
        <title>{t('chatTitle')}</title>
        <meta name="description" content="AI-powered chat assistant" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {error && (
        <ErrorBanner
          message={error}
          onRetry={handleRetry}
          onDismiss={() => setError(null)}
          retryLabel={t('errorRetry')}
          dismissLabel={t('errorDismiss')}
        />
      )}

      <ChatLayout
        title={t('chatTitle')}
        subtitle={language === 'en' ? 'Always here to help' : 'Toujours là pour aider'}
        languageSwitcher={
          <LanguageSwitcher
            currentLanguage={language}
            onLanguageChange={setLanguage}
          />
        }
      >
        <MessageList
          messages={messages}
          isTyping={isTyping}
          typingMessage={streamingText}
        />
        <ChatComposer
          onSendMessage={handleSendMessage}
          disabled={isStreaming}
          placeholder={t('chatPlaceholder')}
        />
      </ChatLayout>
    </>
  );
}
