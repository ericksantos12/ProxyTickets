# Research: Discord Proxy Bot

**Date**: 2026-02-24 (Corrected)  
**Purpose**: Phase 0 research to resolve technical unknowns and establish implementation approach

## Critical Correction: Constatic Framework DOES Exist

**Correction**: Previous research incorrectly concluded Constatic doesn't exist. **Constatic IS a real Discord bot development framework** with active development and comprehensive documentation.

**Resources**:
- **Documentation**: https://constatic-docs.vercel.app/pt
- **GitHub**: https://github.com/rinckodev/constatic
- **Package**: `@constatic/base` on npm
- **CLI**: `npx constatic@latest` for project scaffolding
- **Status**: Actively maintained (last commit 5 days ago)

---

## Decision 1: Discord Bot Framework Selection

### Framework Architecture: Constatic

**Selected**: **Constatic** - Modern Discord bot development framework built on discord.js

**Package**: `@constatic/base`  
**CLI**: `npx constatic@latest create-bot`  
**Base Library**: discord.js 14.x  
**Language**: TypeScript 5.0+ with ESM modules

### How Constatic Works

Constatic provides structure and conventions WITHOUT replacing discord.js - it's a **development framework**, not an abstraction layer.

**Core Components**:

1. **Bootstrap Function** - Entry point that:
   - Creates Discord client with all intents enabled by default
   - Auto-loads modules from `src/discord/**` via glob patterns
   - Registers commands, events, and interaction handlers
   - Configures error handling

   ```typescript
   // src/index.ts
   import { bootstrap } from "@constatic/base";
   import { env } from "#env";
   
   await bootstrap({ meta: import.meta, env });
   ```

2. **Creators Pattern** - Functions to define Discord structures:
   
   ```typescript
   // src/discord/commands/ticket.ts
   import { createCommand } from "#base";
   
   createCommand({
     name: "ticket",
     description: "Create support ticket",
     type: ApplicationCommandType.ChatInput,
     async run(interaction) {
       // Full discord.js API available
     }
   });
   ```

   - `createCommand()` - Slash commands with autocomplete
   - `createEvent()` - Event listeners (ready, messageCreate, etc.)
   - `createResponder()` - Button/modal/select menu handlers

3. **Project Structure Convention**:
   ```
   src/
   ├── discord/
   │   ├── commands/      # Auto-loaded slash commands
   │   ├── events/        # Auto-loaded event listeners
   │   ├── responders/    # Auto-loaded interaction handlers
   │   └── index.ts       # setupCreators() exports
   ├── functions/         # Business logic (services)
   ├── database/          # Data access layer
   ├── server/            # Express/Fastify API (optional)
   ├── env.ts            # Zod-based environment validation
   ├── constants.ts      # Type-safe constants from JSON
   └── index.ts          # Entry point with bootstrap()
   ```

4. **Path Aliases** - Built-in TypeScript paths:
   - `#base` → `src/discord/index.ts`
   - `#env` → `src/env.ts`
   - `#database` → `src/database/index.ts`
   - `#functions` → `src/functions/index.ts`
   - `#server` → `src/server/index.ts`

5. **Integration Templates**:
   - **Databases**: Prisma, Firelord (Firebase), Quick.db
   - **Servers**: Express, Fastify
   - **Hosting**: Discloud deployment files
   - **Build Tools**: tsup compiler option

### Why Constatic (Principle II Compliance)

**Constatic SIMPLIFIES development** by providing:

✅ **Convention over Configuration**:
- Standard folder structure eliminates setup decisions
- CLI scaffolding generates complete project in seconds
- No manual command registration needed (auto-loaded)

✅ **Reduces Boilerplate**:
- `createCommand()` vs manual `SlashCommandBuilder` + registration
- Auto-loading vs manual file imports and `client.commands.set()`
- Built-in environment validation with Zod

✅ **Type Safety Without Complexity**:
- Full discord.js types preserved
- TypeScript path aliases improve import clarity
- Zod environment validation catches config errors early

✅ **Standard Library First**:
- Built ON discord.js, not replacing it
- Express/Fastify for HTTP server (proven libraries)
- Prisma for database (type-safe ORM standard)

❌ **Doesn't Add Unnecessary Complexity**:
- No custom abstractions hiding discord.js API
- No magic middleware or decorators
- No plugin system or dependency injection
- Simple functions (`createCommand`) not class hierarchies

### Comparison: Constatic vs Pure discord.js

| Aspect | Pure discord.js | Constatic |
|--------|----------------|-----------|
| **Setup** | Manual client creation, intents config, command registration | CLI scaffolds complete project, auto-loads everything |
| **Commands** | Manual `SlashCommandBuilder` + `client.commands.set()` | `createCommand()` with auto-registration |
| **Structure** | No conventions - developer decides | Standard folders (`commands/`, `events/`, `responders/`) |
| **Events** | Manual `client.on()` registration | `createEvent()` with auto-registration |
| **Interactions** | Manual `interactionCreate` listener with routing logic | `createResponder()` with customId pattern matching |
| **Env Validation** | Manual or third-party library | Built-in Zod validation |
| **Boilerplate** | High (command handlers, loaders, registration) | Low (creators handle registration) |
| **Complexity** | Medium (manual setup) | **Low (conventions eliminate decisions)** |

**Verdict**: Constatic **simplifies** Discord bot development while preserving full discord.js API access. It reduces setup time and boilerplate WITHOUT introducing framework magic or abstractions that hide the underlying library.

### Alternatives Considered

**Option B: Pure discord.js**
- ❌ More boilerplate for command registration
- ❌ No standard project structure (decisions needed)
- ❌ Manual module loading and file imports
- ✅ Maximum flexibility
- **Verdict**: Adds unnecessary complexity through lack of conventions

**Option C: Sapphire Framework**
- ✅ Preconditions, listeners, plugins
- ❌ Heavy abstraction layer (hides discord.js)
- ❌ Plugin system is overkill for single-purpose bot
- **Verdict**: Too complex for project scope

**Option D: Discordx**
- ✅ Decorator-based syntax
- ❌ Requires experimental TypeScript decorators
- ❌ Violates Principle II (speculative/non-standard features)
- **Verdict**: Unnecessary complexity via decorators

### Final Decision

**Use Constatic (@constatic/base)** as the Discord bot framework.

**Rationale**:
1. **Simplicity First** (Principle II): Conventions eliminate boilerplate and decisions
2. **Best Practices** (Principle III): Modern ESM, TypeScript, path aliases, environment validation
3. **Discord.js Compatible**: Full API access preserved, just adds structure on top
4. **CLI Productivity**: `npx constatic@latest` scaffolds entire project instantly
5. **Express Integration**: Official template for HTTP server (needed for Mercado Pago webhooks)
6. **Database Support**: Prisma template compatible with better-sqlite3

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
## Decision 4: Testing Stack (Optional)

**Note**: Per Constitution v2.0.0, unit tests are **optional but encouraged**. This section documents the recommended setup IF tests are implemented.

### Unit Testing: Jest (Recommended if testing)

**Installation**:
```bash
npm install --save-dev jest ts-jest @types/jest
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
  ]
  // Note: No coverage threshold (tests are optional)
};
```

**Mocking Discord.js** (if implementing tests):
- Use Jest mocks for Discord client, messages, interactions
- Create test fixtures for Discord entities
- Avoid actual Discord API calls in tests

**Database Testing** (if implementing tests):
- Use in-memory SQLite database (`:memory:`)
- Each test gets fresh database instance
- No test pollution between tests

**Decision**: Jest + ts-jest is RECOMMENDED **if/when** tests are added, but tests themselves are **optional** per Constitution v2.0.0.

---

## Decision 5: TypeScript Configuration

### Strict Mode Configuration with ESM

**tsconfig.json** for Constatic project (ESM modules):

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",               // ESM modules (Constatic uses ESM)
    "lib": ["ES2022"],
    "outDir": "./build",              // Constatic convention: build/ not dist/
    "rootDir": "./src",
    "moduleResolution": "bundler",    // Modern ESM resolution
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
    "noFallthroughCasesInSwitch": true,
    "baseUrl": "./src",               // For path aliases
    "paths": {                         // Constatic path aliases
      "#base": ["./discord/index.ts"],
      "#env": ["./env.ts"],
      "#database": ["./database/index.ts"],
      "#functions": ["./functions/index.ts"],
      "#server": ["./server/index.ts"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "build", "tests"]
}
```

**package.json** (required for ESM):
```json
{
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node build/index.js"
  }
}
```

**Key Decisions**:
- `module: "ESNext"` for ESM modules (Constatic requirement)
- `"type": "module"` in package.json enables ESM
- `moduleResolution: "bundler"` for modern import resolution
- Path aliases match Constatic conventions (`#base`, `#env`, etc.)
- `outDir: "./build"` follows Constatic convention
- `strict: true` enables all strict type checking (Principle III: Best Practices)
- `noUnusedLocals` and `noUnusedParameters` catch dead code
- `sourceMap: true` for debugging
- ES2022 target for modern Node.js features (required: Node 20.12+)

**Decision**: TypeScript strict mode with ESM modules and Constatic path aliases.

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

### Zod-based Environment Validation (Constatic Built-in)

Constatic provides built-in environment validation using **Zod** - no dotenv needed manually.

**Environment File** (`src/env.ts` - Constatic convention):
```typescript
import "./constants.js";  // Load constants first
import { validateEnv } from "@constatic/base";
import { z } from "zod";

export const env = await validateEnv(z.object({
  // Discord (required by Constatic)
  BOT_TOKEN: z.string().min(1, "Discord Bot Token is required"),
  
  // Discord Configuration (optional)
  GUILD_ID: z.string().optional(),
  ADMIN_USER_ID: z.string().optional(),
  
  // Mercado Pago (required)
  MERCADOPAGO_ACCESS_TOKEN: z.string().min(1, "Mercado Pago token required"),
  MERCADOPAGO_PUBLIC_KEY: z.string().min(1, "Mercado Pago public key required"),
  WEBHOOK_URL: z.string().url("Valid webhook URL required"),
  
  // Server Configuration
  SERVER_PORT: z.coerce.number().default(3000),
  
  // Database
  DATABASE_PATH: z.string().default("./database/proxytickets.db"),
  
  // Pricing Defaults (auto-converted to numbers)
  DEFAULT_SHEET_PRICE: z.coerce.number().default(5.00),
  DEFAULT_INK_COST: z.coerce.number().default(2.00),
  DEFAULT_LAMINATION_COST: z.coerce.number().default(1.50),
  DEFAULT_DECKBOX_PRICE: z.coerce.number().default(15.00),
  DEFAULT_SLEEVES_PRICE: z.coerce.number().default(10.00),
  
  // Logging
  WEBHOOK_LOGS_URL: z.string().url().optional(),
}));
```

**.env.example**:
```env
# Discord Bot Configuration (REQUIRED)
BOT_TOKEN=your_bot_token_here

# Discord Server Configuration (OPTIONAL)
GUILD_ID=your_server_id_here
ADMIN_USER_ID=your_discord_user_id_here

# Mercado Pago Configuration (REQUIRED)
MERCADOPAGO_ACCESS_TOKEN=your_access_token_here
MERCADOPAGO_PUBLIC_KEY=your_public_key_here
WEBHOOK_URL=https://your-domain.com/webhooks/mercadopago

# Server Configuration
SERVER_PORT=3000

# Database Configuration
DATABASE_PATH=./database/proxytickets.db

# Pricing Configuration (defaults can be overridden via admin commands)
DEFAULT_SHEET_PRICE=5.00
DEFAULT_INK_COST=2.00
DEFAULT_LAMINATION_COST=1.50
DEFAULT_DECKBOX_PRICE=15.00
DEFAULT_SLEEVES_PRICE=10.00

# Logging (Optional webhook for errors)
WEBHOOK_LOGS_URL=https://discord.com/api/webhooks/...
```

**How validateEnv works**:
- Reads `.env` file automatically (Constatic handles this)
- Validates against Zod schema
- Throws error on startup if validation fails (fail-fast)
- Returns fully typed environment object
- Auto-converts strings to numbers with `z.coerce.number()`
- Provides defaults with `.default()`

**Decision**: Use Constatic's **validateEnv** with Zod schemas (built-in, no dotenv needed).

---

## Decision 8: Logging Strategy

### Constatic Built-in Logging + Optional Discord Webhooks

Constatic has **built-in console logging** for bot lifecycle events. For production error tracking, add Discord webhook logging.

**Built-in Logging** (automatic):
- Bot ready event with client username
- Command/event registration logs
- Error handler integration (via `bootstrap()`)

**Optional: Discord Webhook Logger** (`src/functions/logger.ts`):
```typescript
import { env } from "#env";
import { EmbedBuilder, WebhookClient } from "discord.js";

export class Logger {
  private webhook?: WebhookClient;
  
  constructor() {
    if (env.WEBHOOK_LOGS_URL) {
      this.webhook = new WebhookClient({ url: env.WEBHOOK_LOGS_URL });
    }
  }
  
  async error(error: Error, context?: string) {
    console.error(`[ERROR] ${context}:`, error);
    
    if (this.webhook) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle("❌ Error")
        .setDescription(`\`\`\`${error.message}\`\`\``)
        .addFields(
          { name: "Context", value: context || "Unknown" },
          { name: "Stack", value: `\`\`\`${error.stack?.slice(0, 1000) || "No stack"}\`\`\`` }
        )
        .setTimestamp();
      
      await this.webhook.send({ embeds: [embed] }).catch(console.error);
    }
  }
  
  info(message: string) {
    console.log(`[INFO] ${message}`);
  }
  
  warn(message: string) {
    console.warn(`[WARN] ${message}`);
  }
}

export const logger = new Logger();
```

**Usage in Error Handler**:
```typescript
// src/index.ts
import { bootstrap } from "@constatic/base";
import { env } from "#env";
import { logger } from "#functions";

await bootstrap({ 
  meta: import.meta, 
  env,
  errorHandler: (error, client) => {
    logger.error(error as Error, "Uncaught Exception");
  }
});
```

**Decision**: Use Constatic's **built-in logging** + optional **Discord webhook** for production errors (simpler than Winston).

---

## Summary of Technical Stack

| Category | Technology | Rationale |
|----------|-----------|-----------|
| **Language** | TypeScript 5.0+ (ESM) | Type safety, modern modules, best practices |
| **Framework** | Constatic (@constatic/base) | Convention over configuration, simplifies Discord bot dev |
| **Discord Library** | discord.js 14.x | Industry standard (via Constatic integration) |
| **Payment SDK** | mercadopago (official) | Official SDK, webhook support |
| **Database** | better-sqlite3 | Fast, synchronous, simple |
| **Database Integration** | Prisma (optional) | Constatic template available, type-safe ORM |
| **Testing** | Jest + ts-jest | TypeScript support (OPTIONAL per Constitution v2.0.0) |
| **HTTP Server** | Express | Webhook endpoint for Mercado Pago (Constatic template) |
| **Environment Validation** | Zod (via Constatic) | Built-in with validateEnv(), type-safe |
| **Linting** | ESLint + TypeScript plugin | Code quality enforcement |
| **Formatting** | Prettier | Consistent code style |
| **Logging** | Constatic built-in + Discord webhooks | Simple console logging + optional error webhooks |
| **CLI** | npx constatic@latest | Project scaffolding |

**Constitution Alignment (v2.0.0)**:
- ✅ **Principle I**: Tests are ENCOURAGED but OPTIONAL (Constitution v2.0.0)
- ✅ **Principle II**: **Constatic simplifies by providing conventions** - eliminates boilerplate for command registration, module loading, and project structure setup WITHOUT adding framework magic
- ✅ **Principle III**: Industry-standard tools (ESLint, Prettier, TypeScript strict, discord.js core)
- ✅ **Principle IV**: Clear testing strategy available (optional to implement)
- ✅ **Principle V**: Architecture supports independent user story implementation via modular command structure

---

## Resolved Technical Context Updates

**Original unknowns now resolved**:

1. ~~Constatic (NEEDS CLARIFICATION)~~ → **Constatic (@constatic/base) VERIFIED** - modern Discord bot framework with CLI, conventions, and templates
2. Discord base → **discord.js 14.x** integrated via Constatic framework
3. Project structure → **Constatic conventions** (`src/discord/commands/`, `src/functions/`, etc.)
4. Testing approach → **Jest + ts-jest** (OPTIONAL per Constitution v2.0.0)
5. Webhook strategy → **Express server** using Constatic template for Mercado Pago webhooks
6. Database patterns → **better-sqlite3** with optional Prisma integration (Constatic template available)
7. TypeScript config → **Strict mode with ESM modules** and path aliases (`#base`, `#env`, etc.)
8. Environment validation → **Zod-based** via Constatic's validateEnv()
9. Code quality → **ESLint + Prettier** with TypeScript rules
10. Logging → **Constatic built-in** + optional Discord webhook for errors

**All NEEDS CLARIFICATION markers resolved. Ready for Phase 1: Design.**

---

## Additional Resources for Implementation

### Constatic Documentation References:
- **Getting Started**: https://constatic-docs.vercel.app/pt/docs/discord/start
- **Commands**: https://constatic-docs.vercel.app/pt/docs/discord/commands
- **Events**: https://constatic-docs.vercel.app/pt/docs/discord/events
- **Responders**: https://constatic-docs.vercel.app/pt/docs/discord/responders (buttons, modals, selects)
- **Conventions**: https://constatic-docs.vercel.app/pt/docs/discord/conventions
- **Express Server Preset**: https://constatic-docs.vercel.app/pt/docs/discord/presets/servers/express
- **Prisma Database Preset**: Documentation available for Prisma integration

### Key Constatic Commands:
```bash
# Generate project
npx constatic@latest create-bot

# During setup, select:
- Database: Prisma (SQLite with better-sqlite3)
- Server: Express
- Extras: Discloud files (optional)

# Development
npm run dev        # Watch mode with tsx
npm run build      # Compile TypeScript to build/
npm start          # Run compiled bot
```

**End of Research Phase**
