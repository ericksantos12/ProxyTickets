# Research: Discord Proxy Bot

**Date**: 2026-02-24  
**Purpose**: Phase 0 research to resolve technical unknowns and establish implementation approach

## Critical Finding: Constatic Framework Does Not Exist

**Issue**: The initial plan referenced "Constatic" as the Discord bot framework base. Research confirms this framework **does not exist** - there is no npm package, GitHub repository, or documentation for a Discord framework called "Constatic".

**Impact**: Technical Context needs update to use an actual Discord bot framework.

---

## Decision 1: Discord Bot Framework Selection

### Options Evaluated

#### Option A: discord.js (Pure Library) ⭐ **RECOMMENDED**

**Description**: Most popular JavaScript/TypeScript library for Discord API (14M+ weekly downloads)

**Pros**:
- ✅ Maximum flexibility and control
- ✅ Simplest approach (Principle II: Simplicity First)
- ✅ Complete Discord API coverage
- ✅ Massive community support
- ✅ Comprehensive documentation
- ✅ No framework magic or abstraction layers
- ✅ Built-in TypeScript support

**Cons**:
- ❌ Requires manual command structure organization
- ❌ No built-in preconditions or middleware
- ❌ More boilerplate for large bots

**Installation**:
```bash
npm install discord.js
```

**Rationale for Recommendation**: 
Aligns with **Principle II (Simplicity First)** - start with the simplest approach. discord.js provides everything needed without framework overhead. For a single-purpose bot with 5 user stories, the additional structure from frameworks is unnecessary complexity.

---

#### Option B: Sapphire Framework

**Description**: Opinionated framework built on discord.js with plugin system and advanced features

**Pros**:
- ✅ Built-in command structure
- ✅ Preconditions for permission checks
- ✅ Plugin system for modularity
- ✅ Argument parsing and validation
- ✅ Auto-loading of commands

**Cons**:
- ❌ Additional abstraction layer (complexity)
- ❌ Learning curve for framework-specific patterns
- ❌ Potential overkill for small bot

**Installation**:
```bash
npm install @sapphire/framework discord.js
```

**When to Consider**: If bot grows beyond initial 5 user stories and needs plugin architecture.

---

#### Option C: Discordx

**Description**: Decorator-based framework using TypeScript experimental decorators

**Pros**:
- ✅ Clean, declarative syntax
- ✅ Automatic command registration
- ✅ Built-in dependency injection

**Cons**:
- ❌ Requires experimental decorators (non-standard TypeScript)
- ❌ Adds complexity through decorators
- ❌ Smaller community than discord.js

**Installation**:
```bash
npm install discordx discord.js
```

**Verdict**: Not recommended - experimental decorators violate Principle II (avoid speculative features).

---

### **Final Decision**: discord.js (Pure Library)

Use **discord.js 14.x** directly without framework wrapper.

**Justification**:
1. **Simplicity First** (Principle II): Avoids framework abstraction layers
2. **Best Practices** (Principle III): Industry standard for Discord bots
3. **Learning Curve**: Minimal - direct API interaction
4. **Community**: Largest support community (14M+ weekly downloads)
5. **Scope Appropriate**: Project has 5 well-defined user stories, doesn't need framework

**Alternative Path**: If complexity grows during implementation and command organization becomes unwieldy, Sapphire Framework can be introduced. This follows YAGNI - we'll add it when actually needed, not speculatively.

---

## Decision 2: Mercado Pago Integration

### SDK Research

**Package**: `mercadopago` (Official SDK)

**Installation**:
```bash
npm install mercadopago
```

**Key Features**:
- Pix payment generation
- QR Code creation
- Webhook support for payment notifications
- TypeScript types available via `@types/mercadopago`

**Webhook Approach**:
- Mercado Pago sends POST requests to configured endpoint when payment status changes
- Bot needs HTTP server to receive webhooks (use **express** or **fastify**)
- Webhook validates payment and updates ticket status

**Alternative - Polling**:
- SDK allows checking payment status via API
- Less efficient than webhooks but simpler
- **Recommendation**: Use webhooks for real-time updates (better UX)

**Decision**: Use official `mercadopago` SDK with webhook-based payment monitoring.

**Express Integration**:
```bash
npm install express @types/express
```

Simple HTTP server for webhook endpoint only (not a web app).

---

## Decision 3: SQLite Configuration

### Library: better-sqlite3 ⭐ **RECOMMENDED**

**Why better-sqlite3 over alternatives**:

**better-sqlite3**:
- ✅ Synchronous API (simpler than async for SQLite)
- ✅ Fastest SQLite library for Node.js
- ✅ TypeScript support
- ✅ Simple, straightforward API
- ✅ Well-maintained (400K+ weekly downloads)

**Alternatives Rejected**:

**sqlite3** (async):
- ❌ Async API unnecessary for local SQLite
- ❌ Adds complexity with callbacks/promises
- ❌ Slower than better-sqlite3

**typeorm** (ORM):
- ❌ Heavyweight ORM is complexity overkill (Principle II violation)
- ❌ Abstracts SQL significantly
- ❌ Not needed for simple schema

**Installation**:
```bash
npm install better-sqlite3
npm install --save-dev @types/better-sqlite3
```

**Migration Strategy**:
- Manual SQL migrations in `src/database/migrations/`
- Simple approach: version-numbered .sql files
- Migration tracking table in database
- No migration framework needed (Principle II: Simplicity First)

**Decision**: Use **better-sqlite3** with manual SQL migrations.

---

## Decision 4: Testing Stack

### Unit Testing: Jest

**Installation**:
```bash
npm install --save-dev jest ts-jest @types/jest
npm install --save-dev @discord.js/voice # for mocking voice if needed
```

**Configuration** (`jest.config.js`):
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

**Mocking Discord.js**:
- Use Jest mocks for Discord client, messages, interactions
- Create test fixtures for Discord entities
- Avoid actual Discord API calls in tests

**Database Testing**:
- Use in-memory SQLite database (`:memory:`)
- Each test gets fresh database instance
- No test pollution between tests

**Decision**: Jest + ts-jest with 80% coverage requirement (Principle I compliance).

---

## Decision 5: TypeScript Configuration

### Strict Mode Configuration

**tsconfig.json** follows best practices:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**Key Decisions**:
- `strict: true` enables all strict type checking (Principle III: Best Practices)
- `noUnusedLocals` and `noUnusedParameters` catch dead code
- `sourceMap: true` for debugging
- ES2022 target for modern Node.js features

**Decision**: TypeScript strict mode with all safety flags enabled.

---

## Decision 6: Code Quality Tools

### ESLint + Prettier

**ESLint** (linting):
```bash
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

**Prettier** (formatting):
```bash
npm install --save-dev prettier eslint-config-prettier eslint-plugin-prettier
```

**.eslintrc.js**:
```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
  }
};
```

**.prettierrc**:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

**Decision**: ESLint + Prettier with TypeScript-specific rules.

---

## Decision 7: Environment Configuration

### dotenv for Environment Variables

**Installation**:
```bash
npm install dotenv
npm install --save-dev @types/node
```

**.env.example**:
```env
# Discord Bot Configuration
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_GUILD_ID=your_server_id_here
ADMIN_USER_ID=your_discord_user_id_here

# Mercado Pago Configuration
MERCADOPAGO_ACCESS_TOKEN=your_access_token_here
MERCADOPAGO_PUBLIC_KEY=your_public_key_here
WEBHOOK_URL=https://your-domain.com/webhooks/mercadopago
WEBHOOK_PORT=3000

# Database Configuration
DATABASE_PATH=./database/proxytickets.db

# Pricing Configuration (default values, can be overridden via admin commands)
DEFAULT_SHEET_PRICE=5.00
DEFAULT_INK_COST=2.00
DEFAULT_LAMINATION_COST=1.50
DEFAULT_DECKBOX_PRICE=15.00
DEFAULT_SLEEVES_PRICE=10.00

# Application Configuration
NODE_ENV=development
LOG_LEVEL=info
```

**Configuration Loading** (`src/config/env.ts`):
```typescript
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  discord: {
    token: process.env.DISCORD_TOKEN!,
    clientId: process.env.DISCORD_CLIENT_ID!,
    guildId: process.env.DISCORD_GUILD_ID!,
    adminUserId: process.env.ADMIN_USER_ID!,
  },
  mercadopago: {
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    publicKey: process.env.MERCADOPAGO_PUBLIC_KEY!,
    webhookUrl: process.env.WEBHOOK_URL!,
    webhookPort: parseInt(process.env.WEBHOOK_PORT || '3000'),
  },
  database: {
    path: process.env.DATABASE_PATH || './database/proxytickets.db',
  },
  pricing: {
    defaultSheetPrice: parseFloat(process.env.DEFAULT_SHEET_PRICE || '5.00'),
    defaultInkCost: parseFloat(process.env.DEFAULT_INK_COST || '2.00'),
    defaultLaminationCost: parseFloat(process.env.DEFAULT_LAMINATION_COST || '1.50'),
    defaultDeckboxPrice: parseFloat(process.env.DEFAULT_DECKBOX_PRICE || '15.00'),
    defaultSleevesPrice: parseFloat(process.env.DEFAULT_SLEEVES_PRICE || '10.00'),
  },
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
  },
};

// Validation
const requiredVars = [
  'DISCORD_TOKEN',
  'DISCORD_CLIENT_ID',
  'DISCORD_GUILD_ID',
  'ADMIN_USER_ID',
  'MERCADOPAGO_ACCESS_TOKEN',
];

for (const varName of requiredVars) {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
}
```

**Decision**: dotenv for environment management with strict validation.

---

## Decision 8: Logging Strategy

### Winston for Logging

**Why Winston**:
- Industry standard for Node.js logging
- Structured logging support
- Multiple transports (console, file)
- Log levels (error, warn, info, debug)
- JSON output for production

**Installation**:
```bash
npm install winston
```

**Logger Configuration** (`src/utils/logger.ts`):
```typescript
import winston from 'winston';
import { config } from '../config/env';

export const logger = winston.createLogger({
  level: config.app.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Console logging in development
if (config.app.nodeEnv !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}
```

**Decision**: Winston logger with file + console transports.

---

## Summary of Technical Stack

| Category | Technology | Rationale |
|----------|-----------|-----------|
| **Language** | TypeScript 5.0+ | Type safety, best practices |
| **Discord Library** | discord.js 14.x | Industry standard, simplicity first |
| **Payment SDK** | mercadopago (official) | Official SDK, webhook support |
| **Database** | better-sqlite3 | Fast, synchronous, simple |
| **Testing** | Jest + ts-jest | TypeScript support, 80% coverage |
| **HTTP Server** | Express | Webhook endpoint for Mercado Pago |
| **Linting** | ESLint + TypeScript plugin | Code quality enforcement |
| **Formatting** | Prettier | Consistent code style |
| **Logging** | Winston | Structured logging |
| **Config** | dotenv | Environment management |

**Constitution Alignment**:
- ✅ **Principle I**: Jest configured for 80% coverage
- ✅ **Principle II**: No frameworks beyond necessity (pure discord.js)
- ✅ **Principle III**: Industry-standard tools (ESLint, Prettier, TypeScript strict)
- ✅ **Principle IV**: Clear testing strategy established
- ✅ **Principle V**: Architecture supports independent user story implementation

---

## Resolved Technical Context Updates

**Original unknowns now resolved**:

1. ~~Constatic (NEEDS CLARIFICATION)~~ → **discord.js 14.x** (pure library)
2. Testing approach → **Jest + ts-jest** with 80% coverage requirement
3. Webhook strategy → **Express server** for Mercado Pago webhooks
4. Database patterns → **better-sqlite3** with manual SQL migrations
5. TypeScript config → **Strict mode** with all safety flags
6. Code quality → **ESLint + Prettier** with TypeScript rules

**All NEEDS CLARIFICATION markers resolved. Ready for Phase 1: Design.**
