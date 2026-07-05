import React from 'react';
import { DevotionTokenSvg } from '@/components/svg/DevotionTokenSvg';

export interface DevotionTokenProps {
  id?: number | string;
  playerId?: number;
  playerNumber?: number;
  size?: number | string;
  className?: string;
  count?: number;
}

const PLAYER_THEMES: Record<number, { ring: string; glow: string }> = {
  1: { ring: 'ring-amber-400', glow: 'shadow-amber-500/50' },
  2: { ring: 'ring-blue-400', glow: 'shadow-blue-500/50' },
  3: { ring: 'ring-red-400', glow: 'shadow-red-500/50' },
  4: { ring: 'ring-emerald-400', glow: 'shadow-emerald-500/50' },
  5: { ring: 'ring-purple-400', glow: 'shadow-purple-500/50' },
};

export const DevotionToken: React.FC<DevotionTokenProps> = ({
  id,
  playerId = 1,
  playerNumber,
  size = 32,
  className = '',
  count,
}) => {
  const pNum = playerNumber ?? playerId ?? 1;
  const theme = PLAYER_THEMES[pNum] || PLAYER_THEMES[1];

  return (
    <div
      data-testid={id !== undefined ? `devotion-token-${id}` : `devotion-token-${pNum}`}
      data-player-id={String(playerId ?? pNum)}
      data-motion="token"
      className={`relative inline-flex items-center justify-center rounded-full transition-transform duration-200 hover:scale-110 shadow-md ${theme.glow} ${className}`}
      style={{ width: typeof size === 'number' ? `${size}px` : size, height: typeof size === 'number' ? `${size}px` : size }}
    >
      <DevotionTokenSvg playerNumber={pNum} size={size} count={count} />
    </div>
  );
};

export default DevotionToken;
