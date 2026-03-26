/**
 * Zod schemas for Bot Royale bot configuration and API inputs.
 */

import { z } from "zod";
import { CONFIG_BOUNDS } from "../constants.js";

// Bot configuration schema matching the on-chain config format
export const BotConfigSchema = z.object({
  donchianChannel: z.number()
    .int("Must be a whole number")
    .min(CONFIG_BOUNDS.donchianChannel.min, `Minimum is ${CONFIG_BOUNDS.donchianChannel.min}`)
    .max(CONFIG_BOUNDS.donchianChannel.max, `Maximum is ${CONFIG_BOUNDS.donchianChannel.max}`)
    .default(CONFIG_BOUNDS.donchianChannel.default)
    .describe("Breakout lookback in bars (20-80). Controls how many bars back to look for price breakouts. Lower = more sensitive, higher = fewer but stronger signals."),
  adxThreshold: z.number()
    .int("Must be a whole number")
    .min(CONFIG_BOUNDS.adxThreshold.min, `Minimum is ${CONFIG_BOUNDS.adxThreshold.min}`)
    .max(CONFIG_BOUNDS.adxThreshold.max, `Maximum is ${CONFIG_BOUNDS.adxThreshold.max}`)
    .default(CONFIG_BOUNDS.adxThreshold.default)
    .describe("Minimum ADX trend strength (15-30). Filters out weak trends. Lower = more trades in weaker trends, higher = only strong trends."),
  stopDistance: z.number()
    .min(CONFIG_BOUNDS.stopDistance.min, `Minimum is ${CONFIG_BOUNDS.stopDistance.min}`)
    .max(CONFIG_BOUNDS.stopDistance.max, `Maximum is ${CONFIG_BOUNDS.stopDistance.max}`)
    .default(CONFIG_BOUNDS.stopDistance.default)
    .describe("Initial stop loss in ATR multiples (1.0-2.5). Tighter = more stops triggered but smaller losses. Wider = fewer stops but larger losses per trade."),
  trailStop: z.number()
    .min(CONFIG_BOUNDS.trailStop.min, `Minimum is ${CONFIG_BOUNDS.trailStop.min}`)
    .max(CONFIG_BOUNDS.trailStop.max, `Maximum is ${CONFIG_BOUNDS.trailStop.max}`)
    .default(CONFIG_BOUNDS.trailStop.default)
    .describe("Trailing stop width in ATR multiples (1.8-4.0). Tighter = locks in profit sooner. Wider = lets winners run longer."),
  timeExit: z.number()
    .int("Must be a whole number")
    .min(CONFIG_BOUNDS.timeExit.min, `Minimum is ${CONFIG_BOUNDS.timeExit.min}`)
    .max(CONFIG_BOUNDS.timeExit.max, `Maximum is ${CONFIG_BOUNDS.timeExit.max}`)
    .default(CONFIG_BOUNDS.timeExit.default)
    .describe("Force-close position after N bars (30-100). Shorter = more trades generated (helps meet 100-trade minimum). Longer = holds positions longer."),
  riskPerTrade: z.number()
    .min(CONFIG_BOUNDS.riskPerTrade.min, `Minimum is ${CONFIG_BOUNDS.riskPerTrade.min}`)
    .max(CONFIG_BOUNDS.riskPerTrade.max, `Maximum is ${CONFIG_BOUNDS.riskPerTrade.max}`)
    .default(CONFIG_BOUNDS.riskPerTrade.default)
    .describe("Percent of capital risked per trade (0.8-2.0%). Higher = larger swings in portfolio value. Lower = smoother equity curve."),
  atrPeriod: z.number()
    .int("Must be a whole number")
    .min(CONFIG_BOUNDS.atrPeriod.min, `Minimum is ${CONFIG_BOUNDS.atrPeriod.min}`)
    .max(CONFIG_BOUNDS.atrPeriod.max, `Maximum is ${CONFIG_BOUNDS.atrPeriod.max}`)
    .default(CONFIG_BOUNDS.atrPeriod.default)
    .describe("ATR volatility lookback in bars (10-20). Shorter = more reactive to recent volatility. Longer = smoother volatility estimate."),
}).strict();

export type BotConfig = z.infer<typeof BotConfigSchema>;

// Registration input (single bot)
export const RegisterInputSchema = z.object({
  wallet_address: z.string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid Ethereum address (0x + 40 hex chars)")
    .describe("The wallet address that will own this bot entry"),
  config: BotConfigSchema
    .describe("The 7-parameter trading bot configuration"),
}).strict();

export type RegisterInput = z.infer<typeof RegisterInputSchema>;

// Batch registration input
export const RegisterBatchInputSchema = z.object({
  bots: z.array(RegisterInputSchema)
    .min(1, "Must register at least 1 bot")
    .max(100, "Maximum 100 bots per batch")
    .describe("Array of bot registrations (max 100)"),
}).strict();

export type RegisterBatchInput = z.infer<typeof RegisterBatchInputSchema>;

// Config generation input
export const GenerateConfigInputSchema = z.object({
  count: z.number()
    .int()
    .min(1)
    .max(100)
    .default(1)
    .describe("Number of configs to generate (1-100)"),
  strategy: z.enum(["random", "conservative", "aggressive", "balanced", "diverse"])
    .default("random")
    .describe("Strategy profile: 'random' = uniform random within bounds, 'conservative' = tighter stops and lower risk, 'aggressive' = wider stops and higher risk, 'balanced' = near defaults with small variation, 'diverse' = spread across the parameter space for maximum coverage"),
}).strict();

export type GenerateConfigInput = z.infer<typeof GenerateConfigInputSchema>;

// Wallet address input (for proofs)
export const WalletInputSchema = z.object({
  wallet_address: z.string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Must be a valid Ethereum address (0x + 40 hex chars)")
    .describe("Wallet address to check prize proofs for"),
}).strict();

export type WalletInput = z.infer<typeof WalletInputSchema>;
