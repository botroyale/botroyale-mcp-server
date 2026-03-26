#!/usr/bin/env node
/**
 * Bot Royale MCP Server
 *
 * Provides AI agents with tools to interact with Bot Royale — the competitive
 * paper-trading arena on Base blockchain. Agents can check season status,
 * view leaderboards, generate optimized configurations, register bots, and
 * claim prizes.
 *
 * Website: https://beta.botroyale.ai
 * API: https://botroyaleai-production.up.railway.app
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { z } from "zod";

import { API_BASE_URL, CONTRACTS, CONFIG_BOUNDS } from "./constants.js";
import { apiGet, apiPost, siteGet, handleApiError } from "./services/api.js";
import { generateConfigs } from "./services/config-generator.js";
import {
  BotConfigSchema,
  RegisterInputSchema,
  RegisterBatchInputSchema,
  GenerateConfigInputSchema,
  WalletInputSchema,
} from "./schemas/config.js";
import type {
  SeasonData,
  LeaderboardEntry,
  StandingsData,
  ChampionshipData,
  ProofData,
  RegisterResponse,
  RulesData,
} from "./types.js";

// ─── Server Instance ────────────────────────────────────────────────────────

const server = new McpServer({
  name: "botroyale-mcp-server",
  version: "1.0.0",
});

// ─── Read-Only Tools ────────────────────────────────────────────────────────

server.registerTool(
  "botroyale_get_season",
  {
    title: "Get Current Season",
    description: `Get the current Bot Royale season status including registration state, entrant count, prize pool, and timing.

Returns the current season's status (open/sealed/evaluating), number of entrants, prize pool size, and when the next season starts. Use this to determine if registration is currently open before attempting to register a bot.

Returns:
  JSON object with season details including:
  - status: Current phase (registration_open, sealed, evaluating, etc.)
  - entrants: Number of registered bots
  - pool: Current prize pool in USDC
  - registrationOpen: Whether new bots can join
  - nextSeasonAt: Timestamp for next season start

Example use: Check if registration is open before calling botroyale_register_bot.`,
    inputSchema: {},
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async () => {
    try {
      const data = await apiGet<SeasonData>("/api/season/current");
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text" as const, text: handleApiError(error) }],
      };
    }
  }
);

server.registerTool(
  "botroyale_get_rules",
  {
    title: "Get Competition Rules",
    description: `Get the full Bot Royale competition rules including qualification criteria, prize distribution, and season mechanics.

Returns all rules governing the competition: lookback period (80-100 days), timeframe (15min candles), starting capital ($500 USDT), minimum trades (100), qualification threshold (returnBTC > 0), prize splits (1st: 50%, 2nd: 30%, 3rd: 10%, platform: 10%), and championship structure.

Returns:
  JSON object with complete rule set.

Example use: Review rules before designing a bot configuration strategy.`,
    inputSchema: {},
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async () => {
    try {
      const data = await apiGet<RulesData>("/api/rules");
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text" as const, text: handleApiError(error) }],
      };
    }
  }
);

server.registerTool(
  "botroyale_get_config_schema",
  {
    title: "Get Config Schema",
    description: `Get the official JSON schema for bot configuration parameters with valid ranges and defaults.

Returns the 7 tunable parameters with their types, ranges, defaults, and descriptions:
- donchianChannel (20-80, default 40): Breakout lookback window
- adxThreshold (15-30, default 20): Minimum trend strength
- stopDistance (1.0-2.5, default 1.5): Initial stop in ATR multiples
- trailStop (1.8-4.0, default 2.8): Trailing stop width
- timeExit (30-100, default 60): Force-close after N bars
- riskPerTrade (0.8-2.0%, default 1.0%): Capital risked per position
- atrPeriod (10-20, default 14): Volatility lookback

Use this to understand valid ranges before generating configs or registering bots.`,
    inputSchema: {},
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async () => {
    try {
      const data = await apiGet<unknown>("/api/config-schema.json");
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(CONFIG_BOUNDS, null, 2),
        }],
      };
    }
  }
);

server.registerTool(
  "botroyale_get_leaderboard",
  {
    title: "Get Leaderboard",
    description: `Get the current season leaderboard showing all bot rankings by performance.

Returns an array of entrants sorted by performance, including wallet addresses, BTC returns, trade counts, qualification status, and their configurations. Use this to analyze what configs are performing well.

Example use: Analyze top performers to inform your config strategy.`,
    inputSchema: {},
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async () => {
    try {
      const data = await siteGet<LeaderboardEntry[]>("/data/leaderboard.json");
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text" as const, text: handleApiError(error) }],
      };
    }
  }
);

server.registerTool(
  "botroyale_get_standings",
  {
    title: "Get Weekly Standings",
    description: `Get the weekly standings showing qualified bots heading toward the Sunday Championship.

Returns the current week's qualifiers who will compete in the Sunday 00:00 UTC championship round.`,
    inputSchema: {},
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async () => {
    try {
      const data = await siteGet<StandingsData>("/data/standings.json");
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text" as const, text: handleApiError(error) }],
      };
    }
  }
);

server.registerTool(
  "botroyale_get_championship",
  {
    title: "Get Championship Info",
    description: `Get the championship pool status including accumulated prize money and upcoming championship dates.

The championship runs every Sunday at 00:00 UTC featuring the top 10 weekly qualifiers.`,
    inputSchema: {},
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async () => {
    try {
      const data = await siteGet<ChampionshipData>("/data/championship.json");
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text" as const, text: handleApiError(error) }],
      };
    }
  }
);

// ─── Action Tools ───────────────────────────────────────────────────────────

server.registerTool(
  "botroyale_register_bot",
  {
    title: "Register a Bot",
    description: `Register a single trading bot for the current Bot Royale season.

This submits a bot configuration to the Bot Royale API. After API registration, the wallet owner must also approve USDC and call register() on-chain to complete the two-step process. Entry costs 0.01 USDC + ~0.001 ETH gas on Base.

IMPORTANT: This only completes step 1 (API submission). Step 2 (on-chain approval) must be done separately via wallet interaction or Coinbase AgentKit.`,
    inputSchema: RegisterInputSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async (params) => {
    try {
      const data = await apiPost<RegisterResponse>("/api/register", params);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text" as const, text: handleApiError(error) }],
      };
    }
  }
);

server.registerTool(
  "botroyale_register_batch",
  {
    title: "Register Multiple Bots",
    description: `Register up to 100 trading bots in a single batch for the current season.

Submits multiple bot configurations at once. Each bot needs its own wallet address and config. This is step 1 of a 2-step process — each wallet must also complete on-chain approval separately.`,
    inputSchema: RegisterBatchInputSchema,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async (params) => {
    try {
      const data = await apiPost<RegisterResponse>("/api/register-batch", params);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text" as const, text: handleApiError(error) }],
      };
    }
  }
);

server.registerTool(
  "botroyale_get_proofs",
  {
    title: "Get Prize Claim Proofs",
    description: `Get Merkle proofs for claiming prizes for a specific wallet address.

If a wallet has won prizes in any season, this returns the cryptographic proofs needed to claim those winnings on-chain.`,
    inputSchema: WalletInputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params) => {
    try {
      const data = await apiGet<ProofData>(`/api/proofs/wallet/${params.wallet_address}`);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{ type: "text" as const, text: handleApiError(error) }],
      };
    }
  }
);

// ─── Helper Tools ───────────────────────────────────────────────────────────

server.registerTool(
  "botroyale_generate_configs",
  {
    title: "Generate Bot Configs",
    description: `Generate valid bot configurations using different strategy profiles.

Creates 1-100 trading bot configurations within the valid parameter bounds. Strategy profiles: random, conservative, aggressive, balanced, diverse (Latin Hypercube sampling).`,
    inputSchema: GenerateConfigInputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
  },
  async (params) => {
    try {
      const configs = generateConfigs(params.count, params.strategy);
      const output = {
        count: configs.length,
        strategy: params.strategy,
        configs,
        hint: "Use these configs with botroyale_register_bot or botroyale_register_batch to enter the competition.",
      };
      return {
        content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }],
      };
    } catch (error) {
      return {
        isError: true,
        content: [{
          type: "text" as const,
          text: `Error generating configs: ${error instanceof Error ? error.message : String(error)}`,
        }],
      };
    }
  }
);

server.registerTool(
  "botroyale_get_contracts",
  {
    title: "Get Smart Contract Addresses",
    description: `Get the Bot Royale smart contract addresses on Base Mainnet.

Returns the deployed contract addresses needed for on-chain interactions.`,
    inputSchema: {},
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  async () => {
    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          chainId: 8453,
          network: "Base Mainnet",
          contracts: CONTRACTS,
          usdc_decimals: 6,
          entry_cost_raw: 10000,
          entry_cost_display: "0.01 USDC",
        }, null, 2),
      }],
    };
  }
);

// ─── Transport Setup ────────────────────────────────────────────────────────

async function runStdio(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Bot Royale MCP server running via stdio");
}

async function runHTTP(): Promise<void> {
  const app = express();
  app.use(express.json());

  app.post("/mcp", async (req, res) => {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    res.on("close", () => transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", server: "botroyale-mcp-server", version: "1.0.0" });
  });

  const port = parseInt(process.env.PORT || "3001");
  app.listen(port, () => {
    console.error(`Bot Royale MCP server running on http://localhost:${port}/mcp`);
  });
}

// Choose transport
const transport = process.env.TRANSPORT || "stdio";
if (transport === "http") {
  runHTTP().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
} else {
  runStdio().catch((error) => {
    console.error("Server error:", error);
    process.exit(1);
  });
}
