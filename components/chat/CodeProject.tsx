/**
 * CodeProject Component
 * Task indicator wrapper for coding projects
 */

import type { ReactElement } from 'react';
import { motion } from 'framer-motion';
import { Code2, GitBranch, Package, Rocket } from 'lucide-react';

interface CodeProjectProps {
  children: ReactElement;
  title: string;
  status: 'planning' | 'development' | 'testing' | 'completed';
  technologies?: string[];
  description?: string;
}

const statusConfig = {
  planning: {
    icon: GitBranch,
    label: 'Planning',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    borderColor: 'border-blue-200 dark:border-blue-700',
  },
  development: {
    icon: Code2,
    label: 'Development',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    borderColor: 'border-yellow-200 dark:border-yellow-700',
  },
  testing: {
    icon: Package,
    label: 'Testing',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    borderColor: 'border-purple-200 dark:border-purple-700',
  },
  completed: {
    icon: Rocket,
    label: 'Completed',
    color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    borderColor: 'border-green-200 dark:border-green-700',
  },
};

export function CodeProject({ 
  children, 
  title, 
  status, 
  technologies = [], 
  description 
}: CodeProjectProps): ReactElement {
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card border-l-4 ${config.borderColor} mb-6`}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${config.color}`}>
            <StatusIcon className="w-4 h-4" />
            {config.label}
          </div>
        </div>

        {/* Description */}
        {description && (
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-balance">
            {description}
          </p>
        )}

        {/* Technologies */}
        {technologies.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {technologies.map((tech, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md font-mono"
              >
                {tech}
              </span>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="mt-4">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

// Smaller version for inline use
interface CodeProjectBadgeProps {
  title: string;
  status: CodeProjectProps['status'];
  size?: 'sm' | 'md';
}

export function CodeProjectBadge({ 
  title, 
  status, 
  size = 'md' 
}: CodeProjectBadgeProps): ReactElement {
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
  };

  return (
    <div className={`inline-flex items-center rounded-full border ${config.borderColor} ${config.color} ${sizeClasses[size]}`}>
      <StatusIcon className={iconSizes[size]} />
      <span className="font-medium">{title}</span>
    </div>
  );
}