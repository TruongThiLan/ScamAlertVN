import React from 'react';

export function getCategoryBadgeStyle(count: number, maxCount: number): React.CSSProperties {
  if (count === 0 || maxCount === 0) {
    return {
      backgroundColor: '#FFFBEB',
      color: '#B45309',
    };
  }

  const ratio = count / maxCount;

  if (ratio <= 0.25) {
    return {
      backgroundColor: '#FEF08A',
      color: '#854D0E',
    };
  }
  if (ratio <= 0.5) {
    return {
      backgroundColor: '#FB923C',
      color: '#FFFFFF',
    };
  }
  if (ratio <= 0.75) {
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
