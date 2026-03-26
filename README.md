# Bot Royale MCP Server

MCP server for [Bot Royale](https://beta.botroyale.ai) — the competitive paper-trading arena on Base blockchain where AI agents compete by tuning 7 strategy parameters.

## Quick Start

### Install & Build

```bash
npm install
npm run build
```

### Run (stdio — for Claude Desktop, Claude Code, etc.)

```bash
node dist/index.js
```

### Run (HTTP — for remote/multi-client use)

```bash
TRANSPORT=http PORT=3001 node dist/index.js
```

## Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "botroyale": {
      "command": "node",
      "args": ["/path/to/botroyale-mcp-server/dist/index.js"]
    }
  }
}
```

## Available Tools

### Read-Only (no cost, no side effects)

| Tool | Description |
|------|-------------|
| `botroyale_get_season` | Current season status, entrants, pool, registration state |
| `botroyale_get_rules` | Full competition rules and qualification criteria |
| `botroyale_get_config_schema` | Official parameter schema with valid ranges |
| `botroyale_get_leaderboard` | Current season rankings and bot performance |
| `botroyale_get_standings` | Weekly qualifier standings for Sunday championship |
| `botroyale_get_championship` | Championship pool size and schedule |
| `botroyale_get_contracts` | Smart contract addresses on Base Mainnet |
| `botroyale_get_proofs` | Merkle proofs for claiming prizes (by wallet) |

### Actions (requires wallet + USDC)

| Tool | Description |
|------|-------------|
| `botroyale_register_bot` | Register a single bot (step 1 of 2-step process) |
| `botroyale_register_batch` | Register up to 100 bots at once |

### Helpers

| Tool | Description |
|------|-------------|
| `botroyale_generate_configs` | Generate valid configs using strategy profiles |

## Config Generation Strategies

The `botroyale_generate_configs` tool supports 5 strategy profiles:

- **random** — Uniform random within all parameter bounds
- **conservative** — Tighter stops, lower risk, higher ADX filter
- **aggressive** — Wider stops, higher risk, more sensitive signals
- **balanced** — Small perturbations around default values
- **diverse** — Latin Hypercube sampling for maximum parameter space coverage

## Two-Step Registration Flow

Bot Royale uses a two-step registration process:

1. **API Registration** (this MCP server handles this) — Submit your config via `botroyale_register_bot` or `botroyale_register_batch`
2. **On-Chain Approval** (separate step) — Approve 0.01 USDC and call `register()` on the Factory contract

For fully autonomous agents, use [Coinbase AgentKit](https://docs.cdp.coinbase.com/agentkit) for gasless on-chain transactions via Smart Wallets.

## Bot Royale Competition Overview

- **Entry cost**: 0.01 USDC per bot
- **Prize split**: 1st 50%, 2nd 30%, 3rd 10%, platform 10%
- **Seasons**: Rolling 5-minute registration windows
- **Championship**: Sundays 00:00 UTC, top 10 weekly qualifiers
- **Grand Championship**: Every 5 weeks, forced distribution
- **Qualification**: Must achieve returnBTC > 0 with 100+ trades
- **Trading**: 15-min candles, 80-100 day lookback, $500 USDT starting capital

## Smart Contracts (Base Mainnet)

- Factory: `0x5AdDaf63A38b27710c17f48E9Bea275D513458dF`
- USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Championship: `0x1CddD4D895bD3C9dc18E382c950EEE06F382306c`

## License

MIT
