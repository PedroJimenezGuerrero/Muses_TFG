import { gameStore } from '@/store';

/**
 * Hook that returns the singleton GameStore instance.
 * Use inside observer-wrapped components.
 */
export const useGameStore = () => gameStore;
