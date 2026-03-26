/**
 * TypeScript type definitions for Bot Royale API responses.
 */

export interface SeasonData {
  id?: string;
  status?: string;
  entrants?: number;
  pool?: string | number;
  lookback?: number;
  timeframe?: string;
  startingCapital?: number;
  minTrades?: number;
  qualificationThreshold?: string;
  registrationOpen?: boolean;
  nextSeasonAt?: string;
  tradingPair?: string;
  [key: string]: unknown;
}

export interface LeaderboardEntry {
  rank?: number;
  wallet?: string;
  address?: string;
  returnBTC?: number;
  returnUSD?: number;
  trades?: number;
  qualified?: boolean;
  pnl?: number;
  config?: Record<string, number>;
  [key: string]: unknown;
}

export interface StandingsData {
  week?: string;
  qualifiers?: LeaderboardEntry[];
  [key: string]: unknown;
}

export interface ChampionshipData {
  pool?: string | number;
  nextDate?: string;
  qualifiers?: string[];
  [key: string]: unknown;
}

export interface ProofData {
  wallet?: string;
  proofs?: Array<{
    season?: string;
    amount?: string | number;
    proof?: string[];
    claimed?: boolean;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

export interface RegisterResponse {
  success?: boolean;
  botId?: string;
  txHash?: string;
  message?: string;
  error?: string;
  [key: string]: unknown;
}

export interface RulesData {
  lookback?: string;
  timeframe?: string;
  startingCapital?: number;
  minTrades?: number;
  qualification?: string;
  prizeDistribution?: Record<string, number | string>;
  championship?: Record<string, unknown>;
  [key: string]: unknown;
}
