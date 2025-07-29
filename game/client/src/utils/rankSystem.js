// 랭크 시스템 유틸리티 함수들

// 랭크 등급 정의
export const RANK_LEVELS = {
  NEWBIE: { name: '신규', icon: '', color: '#808080', minDays: 1, maxDays: 5 },
  BRONZE: { name: '브론즈', icon: '🥉', color: '#CD7F32', minDays: 6, maxDays: 30 },
  SILVER: { name: '실버', icon: '', color: '#C0C0C0', minDays: 31, maxDays: 100 },
  GOLD: { name: '골드', icon: '', color: '#FFD700', minDays: 101, maxDays: 1000 },
  DIAMOND: { name: '다이아몬드', icon: '', color: '#87CEEB', minDays: 1001, maxDays: 3000 },
  MASTER: { name: '마스터', icon: '👑', color: '#9370DB', minDays: 3001, maxDays: Infinity }
};

// 가입일로부터 경과일 계산
export const calculateDaysSinceJoin = (createdAt) => {
  if (!createdAt) return 0;
  
  const joinDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
  const now = new Date();
  const diffTime = now - joinDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(1, diffDays); // 최소 1일
};

// 경과일을 기준으로 랭크 계산
export const calculateRank = (createdAt) => {
  const daysSinceJoin = calculateDaysSinceJoin(createdAt);
  
  for (const [key, rank] of Object.entries(RANK_LEVELS)) {
    if (daysSinceJoin >= rank.minDays && daysSinceJoin <= rank.maxDays) {
      return {
        level: key,
        name: rank.name,
        icon: rank.icon,
        color: rank.color,
        daysSinceJoin
      };
    }
  }
  
  // 기본값
  return {
    level: 'NEWBIE',
    name: RANK_LEVELS.NEWBIE.name,
    icon: RANK_LEVELS.NEWBIE.icon,
    color: RANK_LEVELS.NEWBIE.color,
    daysSinceJoin: 1
  };
};

// 랭크 표시 컴포넌트용 스타일 생성
export const getRankStyle = (rank) => {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: rank.color,
    padding: '2px 6px',
    borderRadius: '12px',
    background: `${rank.color}20`,
    border: `1px solid ${rank.color}40`
  };
};

// 다음 랭크까지 남은 일수 계산
export const getDaysToNextRank = (currentRank, daysSinceJoin) => {
  const currentRankInfo = RANK_LEVELS[currentRank.level];
  const nextRank = Object.values(RANK_LEVELS).find(rank => 
    rank.minDays > currentRankInfo.maxDays
  );
  
  if (!nextRank) return null; // 이미 최고 랭크
  
  return nextRank.minDays - daysSinceJoin;
}; 