/**
 * Bot Royale MCP Server constants.
 */

export const API_BASE_URL = "https://botroyaleai-production.up.railway.app";
export const SITE_URL = "https://beta.botroyale.ai";
export const CHARACTER_LIMIT = 25000;

// Smart contract addresses on Base Mainnet
export const CONTRACTS = {
  FACTORY: "0x5AdDaf63A38b27710c17f48E9Bea275D513458dF",
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  CHAMPIONSHIP: "0x1CddD4D895bD3C9dc18E382c950EEE06F382306c",
} as const;

// Base Mainnet chain ID
export const BASE_CHAIN_ID = 8453;

// Config parameter bounds
export const CONFIG_BOUNDS = {
  donchianChannel: { min: 20, max: 80, default: 40 },
  adxThreshold: { min: 15, max: 30, default: 20 },
  stopDistance: { min: 1.0, max: 2.5, default: 1.5 },
  trailStop: { min: 1.8, max: 4.0, default: 2.8 },
  timeExit: { min: 30, max: 100, default: 60 },
  riskPerTrade: { min: 0.8, max: 2.0, default: 1.0 },
  atrPeriod: { min: 10, max: 20, default: 14 },
} as const;
