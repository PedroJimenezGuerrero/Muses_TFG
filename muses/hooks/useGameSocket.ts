import { useEffect } from 'react';
import { gameStore } from '@/store';
import { socketService } from '@/lib/socket';

export function useGameSocket() {
  useEffect(() => {
    socketService.connect(
      () => {
        gameStore.setConnected(true);
      },
      () => {
        gameStore.setConnected(false);
      }
    );

    return () => {
      // Disconnect on cleanup if needed
    };
  }, []);
}
