/**
 * Status Badge Component
 * Displays emotion/status detection for messages
 */

import type { ReactElement } from 'react';
import { 
  Brain, 
  Lightbulb, 
  Code2, 
  BookOpen, 
  Heart, 
  Zap,
  MessageCircle,
  HelpCircle
} from 'lucide-react';

interface StatusBadgeProps {
  type: 'thinking' | 'creative' | 'technical' | 'learning' | 'friendly' | 'energetic' | 'conversational' | 'question';
  size?: 'sm' | 'md';
}

const statusConfig = {
  thinking: {
    icon: Brain,
    label: 'Thinking',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },
  creative: {
    icon: Lightbulb,
    label: 'Creative',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  },
  technical: {
    icon: Code2,
    label: 'Technical',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  },
  learning: {
    icon: BookOpen,
    label: 'Learning',
    color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  },
  friendly: {
    icon: Heart,
    label: 'Friendly',
    color: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
  },
  energetic: {
    icon: Zap,
    label: 'Energetic',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  },
  conversational: {
    icon: MessageCircle,
    label: 'Conversational',
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  },
  question: {
    icon: HelpCircle,
    label: 'Question',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  },
};

export function StatusBadge({ type, size = 'sm' }: StatusBadgeProps): ReactElement {
  const config = statusConfig[type];
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
  };

  return (
    <div 
      className={`inline-flex items-center rounded-full font-medium ${config.color} ${sizeClasses[size]}`}
      title={config.label}
    >
      <Icon className={iconSizes[size]} />
      <span>{config.label}</span>
    </div>
  );
}

// Helper function to detect emotion/status from message content
export function detectMessageStatus(content: string): StatusBadgeProps['type'] {
  const lowerContent = content.toLowerCase();
  
  // Technical keywords
  if (lowerContent.match(/\b(code|programming|javascript|react|api|database|algorithm|function|variable|class)\b/)) {
    return 'technical';
  }
  
  // Learning/educational keywords
  if (lowerContent.match(/\b(learn|study|explain|understand|concept|theory|knowledge|education)\b/)) {
    return 'learning';
  }
  
  // Creative keywords
  if (lowerContent.match(/\b(create|design|innovate|imagine|creative|artistic|inspire)\b/)) {
    return 'creative';
  }
  
  // Friendly/emotional keywords
  if (lowerContent.match(/\b(happy|glad|excited|love|awesome|wonderful|fantastic|great)\b/)) {
    return 'friendly';
  }
  
  // Energy keywords
  if (lowerContent.match(/\b(energy|passionenthusiasm|dynamic|powerful|strong)\b/)) {
    return 'energetic';
  }
  
  // Question indicators
  if (lowerContent.includes('?') || lowerContent.match(/\b(what|how|why|when|where|who)\b/)) {
    return 'question';
  }
  
  // Thinking indicators
  if (lowerContent.match(/\b(think|consider|analyze|ponder|reflect|believe|suppose)\b/)) {
    return 'thinking';
  }
  
  // Default to conversational
  return 'conversational';
}