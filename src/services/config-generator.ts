/**
 * Config generation strategies for Bot Royale.
 *
 * Generates valid bot configurations using different approaches
 * to parameter selection within the allowed bounds.
 */

import { CONFIG_BOUNDS } from "../constants.js";
import type { BotConfig } from "../schemas/config.js";

type Bounds = typeof CONFIG_BOUNDS;
type ParamName = keyof Bounds;

function randBetween(min: number, max: number, decimals: number = 0): number {
  const raw = min + Math.random() * (max - min);
  const factor = Math.pow(10, decimals);
  return Math.round(raw * factor) / factor;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function randomConfig(): BotConfig {
  return {
    donchianChannel: randBetween(CONFIG_BOUNDS.donchianChannel.min, CONFIG_BOUNDS.donchianChannel.max),
    adxThreshold: randBetween(CONFIG_BOUNDS.adxThreshold.min, CONFIG_BOUNDS.adxThreshold.max),
    stopDistance: randBetween(CONFIG_BOUNDS.stopDistance.min, CONFIG_BOUNDS.stopDistance.max, 1),
    trailStop: randBetween(CONFIG_BOUNDS.trailStop.min, CONFIG_BOUNDS.trailStop.max, 1),
    timeExit: randBetween(CONFIG_BOUNDS.timeExit.min, CONFIG_BOUNDS.timeExit.max),
    riskPerTrade: randBetween(CONFIG_BOUNDS.riskPerTrade.min, CONFIG_BOUNDS.riskPerTrade.max, 2),
    atrPeriod: randBetween(CONFIG_BOUNDS.atrPeriod.min, CONFIG_BOUNDS.atrPeriod.max),
  };
}

function perturbDefault(scale: number): BotConfig {
  const b = CONFIG_BOUNDS;
  const perturb = (param: ParamName, decimals: number = 0): number => {
    const { min, max } = b[param];
    const def = b[param].default;
    const range = max - min;
    const offset = (Math.random() - 0.5) * 2 * range * scale;
    return clamp(
      Math.round((def + offset) * Math.pow(10, decimals)) / Math.pow(10, decimals),
      min,
      max
    );
  };

  return {
    donchianChannel: perturb("donchianChannel"),
    adxThreshold: perturb("adxThreshold"),
    stopDistance: perturb("stopDistance", 1),
    trailStop: perturb("trailStop", 1),
    timeExit: perturb("timeExit"),
    riskPerTrade: perturb("riskPerTrade", 2),
    atrPeriod: perturb("atrPeriod"),
  };
}

function conservativeConfig(): BotConfig {
  return {
    donchianChannel: randBetween(35, 60),         // middle-high: fewer false breakouts
    adxThreshold: randBetween(22, 30),             // higher: only strong trends
    stopDistance: randBetween(1.0, 1.5, 1),        // tighter stops
    trailStop: randBetween(1.8, 2.5, 1),           // tighter trails to lock profit
    timeExit: randBetween(40, 70),                 // moderate hold time
    riskPerTrade: randBetween(0.8, 1.2, 2),        // lower risk per trade
    atrPeriod: randBetween(14, 20),                // smoother volatility
  };
}

function aggressiveConfig(): BotConfig {
  return {
    donchianChannel: randBetween(20, 40),          // shorter: more signals
    adxThreshold: randBetween(15, 20),             // lower: enters weaker trends
    stopDistance: randBetween(1.8, 2.5, 1),        // wider stops
    trailStop: randBetween(3.0, 4.0, 1),           // wide trail: lets winners run
    timeExit: randBetween(60, 100),                // patient
    riskPerTrade: randBetween(1.5, 2.0, 2),        // higher risk
    atrPeriod: randBetween(10, 14),                // reactive volatility
  };
}

/**
 * Generate configs spread across the parameter space using Latin Hypercube-style sampling.
 */
function diverseConfigs(count: number): BotConfig[] {
  const configs: BotConfig[] = [];
  const params: ParamName[] = [
    "donchianChannel", "adxThreshold", "stopDistance",
    "trailStop", "timeExit", "riskPerTrade", "atrPeriod"
  ];
  const decimals: Record<ParamName, number> = {
    donchianChannel: 0, adxThreshold: 0, stopDistance: 1,
    trailStop: 1, timeExit: 0, riskPerTrade: 2, atrPeriod: 0,
  };

  for (let i = 0; i < count; i++) {
    const config: Record<string, number> = {};
    for (const param of params) {
      const { min, max } = CONFIG_BOUNDS[param];
      // Divide range into N buckets, pick a random point within bucket i
      const bucketSize = (max - min) / count;
      const bucketStart = min + bucketSize * i;
      const bucketEnd = bucketStart + bucketSize;
      const raw = randBetween(bucketStart, Math.min(bucketEnd, max), decimals[param]);
      config[param] = clamp(raw, min, max);
    }
    configs.push(config as unknown as BotConfig);
  }

  // Shuffle to break correlation between parameters
  for (let i = configs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [configs[i], configs[j]] = [configs[j], configs[i]];
  }

  return configs;
}

export function generateConfigs(
  count: number,
  strategy: "random" | "conservative" | "aggressive" | "balanced" | "diverse"
): BotConfig[] {
  if (strategy === "diverse") {
    return diverseConfigs(count);
  }

  const generators: Record<string, () => BotConfig> = {
    random: randomConfig,
    conservative: conservativeConfig,
    aggressive: aggressiveConfig,
    balanced: () => perturbDefault(0.15),
  };

  const gen = generators[strategy] ?? randomConfig;
  return Array.from({ length: count }, () => gen());
}
