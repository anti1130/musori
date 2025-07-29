import React from 'react';
import { calculateRank, getRankStyle } from '../utils/rankSystem';

const RankDisplay = ({ createdAt, showIcon = true, showText = true, size = 'small' }) => {
  const rank = calculateRank(createdAt);
  
  const getSizeStyle = () => {
    switch (size) {
      case 'large':
        return { fontSize: '16px', padding: '4px 8px' };
      case 'medium':
        return { fontSize: '14px', padding: '3px 6px' };
      case 'small':
      default:
        return { fontSize: '12px', padding: '2px 6px' };
    }
  };

  const rankStyle = {
    ...getRankStyle(rank),
    ...getSizeStyle()
  };

  return (
    <span style={rankStyle}>
      {showIcon && rank.icon && <span>{rank.icon}</span>}
      {showText && <span>{rank.name}</span>}
    </span>
  );
};

export default RankDisplay; 