/**
 * WebSocket STOMP Message Contracts for Muses Board Game.
 * Subscriptions for /topic/partida/{id}/*
 */

import { CartaBase, AnyCard, Partida } from './game';
import { ScoreBreakdown } from './scoring';

export type EstadoPayload = Partida;

export type CartasSeleccionadasPayload = AnyCard[];

export interface FinPartidaPayload extends Partida {
  breakdown?: ScoreBreakdown;
}

export type StompTopic =
  | `/topic/partida/${string | number}/estado`
  | `/topic/partida/${string | number}/cartas-seleccionadas`
  | `/topic/partida/${string | number}/fin`;

export type StompConnectionStatus =
  | 'CONNECTING'
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'RECONNECTING'
  | 'ERROR';

export interface StompMessageEvent<T = unknown> {
  topic: string;
  payload: T;
  timestamp: number;
}
