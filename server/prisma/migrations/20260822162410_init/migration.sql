-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "tier" TEXT NOT NULL DEFAULT 'PRO',
    "passwordHash" TEXT,
    "ssoProvider" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'vi',
    "llmProvider" TEXT NOT NULL DEFAULT 'gemini',
    "llmApiKey" TEXT,
    "llmModel" TEXT,
    "llmBaseUrl" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "defaultLot" REAL NOT NULL DEFAULT 0.1,
    "autoSLPips" INTEGER NOT NULL DEFAULT 300,
    "autoTPPips" INTEGER NOT NULL DEFAULT 600,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "initialBalance" REAL NOT NULL,
    "finalBalance" REAL NOT NULL,
    "finalEquity" REAL NOT NULL,
    "currentIndex" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "strategyId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "lotSize" REAL NOT NULL,
    "entryPrice" REAL NOT NULL,
    "closePrice" REAL,
    "stopLoss" REAL,
    "takeProfit" REAL,
    "trailingStopPips" REAL,
    "commission" REAL NOT NULL DEFAULT 0,
    "swap" REAL NOT NULL DEFAULT 0,
    "floatingPnL" REAL NOT NULL DEFAULT 0,
    "realizedPnL" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL,
    "closeReason" TEXT,
    "comment" TEXT,
    "tags" TEXT,
    "note" TEXT,
    "openTime" BIGINT NOT NULL,
    "closeTime" BIGINT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Trade_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Drawing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "points" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#2196F3',
    "lineWidth" INTEGER NOT NULL DEFAULT 1,
    "text" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Drawing_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EquityPoint" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "balance" REAL NOT NULL,
    "equity" REAL NOT NULL,
    CONSTRAINT "EquityPoint_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Strategy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "parameters" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "isBuiltIn" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Strategy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Dataset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "timeframe" TEXT NOT NULL,
    "candleCount" INTEGER NOT NULL,
    "startDate" BIGINT NOT NULL,
    "endDate" BIGINT NOT NULL,
    "candles" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'import',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Dataset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnalyticsSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "totalTrades" INTEGER NOT NULL DEFAULT 0,
    "winTrades" INTEGER NOT NULL DEFAULT 0,
    "lossTrades" INTEGER NOT NULL DEFAULT 0,
    "winRate" REAL NOT NULL DEFAULT 0,
    "grossProfit" REAL NOT NULL DEFAULT 0,
    "grossLoss" REAL NOT NULL DEFAULT 0,
    "netProfit" REAL NOT NULL DEFAULT 0,
    "profitFactor" REAL NOT NULL DEFAULT 0,
    "expectedPayoff" REAL NOT NULL DEFAULT 0,
    "maxDrawdownAmount" REAL NOT NULL DEFAULT 0,
    "maxDrawdownPercent" REAL NOT NULL DEFAULT 0,
    "avgWin" REAL NOT NULL DEFAULT 0,
    "avgLoss" REAL NOT NULL DEFAULT 0,
    "riskRewardRatio" REAL NOT NULL DEFAULT 0,
    "consecutiveWins" INTEGER NOT NULL DEFAULT 0,
    "consecutiveLosses" INTEGER NOT NULL DEFAULT 0,
    "sharpeRatio" REAL NOT NULL DEFAULT 0,
    "sortinoRatio" REAL NOT NULL DEFAULT 0,
    "heatmapData" TEXT,
    "monteCarloData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AnalyticsSnapshot_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_status_idx" ON "Session"("status");

-- CreateIndex
CREATE INDEX "Trade_sessionId_idx" ON "Trade"("sessionId");

-- CreateIndex
CREATE INDEX "Trade_symbol_idx" ON "Trade"("symbol");

-- CreateIndex
CREATE INDEX "Trade_status_idx" ON "Trade"("status");

-- CreateIndex
CREATE INDEX "Drawing_sessionId_idx" ON "Drawing"("sessionId");

-- CreateIndex
CREATE INDEX "EquityPoint_sessionId_idx" ON "EquityPoint"("sessionId");

-- CreateIndex
CREATE INDEX "Strategy_userId_idx" ON "Strategy"("userId");

-- CreateIndex
CREATE INDEX "Dataset_userId_idx" ON "Dataset"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Dataset_userId_symbol_timeframe_key" ON "Dataset"("userId", "symbol", "timeframe");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsSnapshot_sessionId_key" ON "AnalyticsSnapshot"("sessionId");
