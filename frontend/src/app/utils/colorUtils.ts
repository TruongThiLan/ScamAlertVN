import React from 'react';

export function getCategoryBadgeStyle(count: number, maxCount: number): React.CSSProperties {
  if (count === 0 || maxCount === 0) {
    return {
      backgroundColor: '#FFFBEB',
      color: '#B45309',
    };
  }

  const ratio = count / maxCount;

  if (ratio <= 0.33) {
    return {
      backgroundColor: '#F87171',
      color: '#FFFFFF',
    };
  }
  
  if (ratio <= 0.66) {
    return {
      backgroundColor: '#EF4444',
      color: '#FFFFFF',
    };
  }

  return {
    backgroundColor: '#E01515',
    color: '#FFFFFF',
  };
}
