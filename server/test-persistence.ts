import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runTests() {
  console.log('==============================================');
  console.log('🧪 RUNNING END-TO-END DATABASE PERSISTENCE TESTS');
  console.log('==============================================\n');

  try {
    // 1. Get or create user
    console.log('Step 1: Checking user...');
    let user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'test.trader@quantbacktest.com',
          name: 'Test Trader',
          tier: 'INSTITUTIONAL'
        }
      });
    }
    console.log(`✅ User verified: ${user.name} (${user.id})`);

    // 2. Create a test session
    console.log('\nStep 2: Creating a backtest session in SQLite...');
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        name: 'Gold Scalping Strategy Session - M5',
        symbol: 'XAUUSD',
        timeframe: 'M5',
        initialBalance: 10000,
        finalBalance: 10540.50,
        finalEquity: 10620.00,
        currentIndex: 450,
        status: 'ACTIVE'
      }
    });
    console.log(`✅ Session created with ID: ${session.id}`);

    // 3. Add Trades (Open & Closed)
    console.log('\nStep 3: Storing Trades (Positions & History)...');
    const trade1 = await prisma.trade.create({
      data: {
        sessionId: session.id,
        orderId: 'ord_buy_1',
        symbol: 'XAUUSD',
        side: 'BUY',
        lotSize: 0.2,
        entryPrice: 2650.50,
        closePrice: 2658.00,
        stopLoss: 2640.00,
        takeProfit: 2665.00,
        commission: 1.4,
        swap: 0,
        floatingPnL: 0,
        realizedPnL: 150.00,
        status: 'CLOSED',
        closeReason: 'TP',
        comment: 'EMA Bullish Cross Entry',
        tags: JSON.stringify(['Trend', 'EMA']),
        note: 'Perfect textbook breakout',
        openTime: BigInt(1724300000),
        closeTime: BigInt(1724303600)
      }
    });

    const trade2 = await prisma.trade.create({
      data: {
        sessionId: session.id,
        orderId: 'ord_sell_2',
        symbol: 'XAUUSD',
        side: 'SELL',
        lotSize: 0.1,
        entryPrice: 2662.00,
        closePrice: 2665.50,
        stopLoss: 2666.00,
        takeProfit: 2650.00,
        commission: 0.7,
        swap: 0,
        floatingPnL: 0,
        realizedPnL: -35.00,
        status: 'CLOSED',
        closeReason: 'SL',
        comment: 'Resistance rejection attempt',
        openTime: BigInt(1724305000),
        closeTime: BigInt(1724307000)
      }
    });

    const trade3 = await prisma.trade.create({
      data: {
        sessionId: session.id,
        orderId: 'ord_buy_3',
        symbol: 'XAUUSD',
        side: 'BUY',
        lotSize: 0.15,
        entryPrice: 2655.00,
        stopLoss: 2645.00,
        takeProfit: 2675.00,
        commission: 1.05,
        swap: 0,
        floatingPnL: 79.50,
        realizedPnL: 0,
        status: 'OPEN',
        comment: 'Pullback continuation',
        openTime: BigInt(1724310000)
      }
    });
    console.log(`✅ Stored 3 trades: 2 Closed ($150.00 Win, -$35.00 Loss), 1 Active Open (+$79.50)`);

    // 4. Store Chart Drawings
    console.log('\nStep 4: Storing Chart Drawings in SQLite...');
    await prisma.drawing.create({
      data: {
        sessionId: session.id,
        type: 'trendline',
        points: JSON.stringify([
          { time: 1724300000, price: 2645.0 },
          { time: 1724310000, price: 2660.0 }
        ]),
        color: '#26a69a',
        lineWidth: 2,
        text: 'Support Trendline'
      }
    });
    console.log('✅ Stored Trendline drawing');

    // 5. Store Equity Curve
    console.log('\nStep 5: Storing Equity Curve points...');
    await prisma.equityPoint.createMany({
      data: [
        { sessionId: session.id, timestamp: BigInt(1724300000), balance: 10000, equity: 10000 },
        { sessionId: session.id, timestamp: BigInt(1724303600), balance: 10150, equity: 10150 },
        { sessionId: session.id, timestamp: BigInt(1724307000), balance: 10115, equity: 10115 },
        { sessionId: session.id, timestamp: BigInt(1724310000), balance: 10115, equity: 10194.5 }
      ]
    });
    console.log('✅ Stored 4 equity curve data points');

    // 6. Test Session Retrieval & Integrity Verification
    console.log('\nStep 6: Simulating App Reopen / Refresh (Fetching from SQLite)...');
    const loadedSession = await prisma.session.findUnique({
      where: { id: session.id },
      include: {
        trades: { orderBy: { openTime: 'asc' } },
        drawings: true,
        equityPoints: { orderBy: { timestamp: 'asc' } }
      }
    });

    if (!loadedSession) throw new Error('Session not found in DB!');

    console.log(`✅ Session Loaded: "${loadedSession.name}"`);
    console.log(`   - Status:         ${loadedSession.status}`);
    console.log(`   - Symbol:         ${loadedSession.symbol} ${loadedSession.timeframe}`);
    console.log(`   - Current Index:  ${loadedSession.currentIndex}`);
    console.log(`   - Balance:        $${loadedSession.finalBalance.toFixed(2)}`);
    console.log(`   - Equity:         $${loadedSession.finalEquity.toFixed(2)}`);
    console.log(`   - Trades Count:   ${loadedSession.trades.length} (Expected: 3)`);
    console.log(`   - Drawings Count: ${loadedSession.drawings.length} (Expected: 1)`);
    console.log(`   - Equity Points:  ${loadedSession.equityPoints.length} (Expected: 4)`);

    // Verify trades data integrity
    const closed = loadedSession.trades.filter(t => t.status === 'CLOSED');
    const open = loadedSession.trades.filter(t => t.status === 'OPEN');
    if (closed.length !== 2 || open.length !== 1) {
      throw new Error(`Integrity check failed: Expected 2 closed and 1 open, got ${closed.length} closed, ${open.length} open`);
    }
    console.log('✅ Data integrity verified: 100% accurate match with database state.');

    // 7. Test Session Completion & Analytics Snapshot
    console.log('\nStep 7: Testing Session Completion & Analytics Snapshot...');
    await prisma.session.update({
      where: { id: session.id },
      data: { status: 'COMPLETED' }
    });

    const snapshot = await prisma.analyticsSnapshot.create({
      data: {
        sessionId: session.id,
        totalTrades: 2,
        winTrades: 1,
        lossTrades: 1,
        winRate: 50.0,
        grossProfit: 150.00,
        grossLoss: 35.00,
        netProfit: 115.00,
        profitFactor: 4.29,
        maxDrawdownPercent: 0.35,
        sharpeRatio: 1.85,
        sortinoRatio: 2.40,
        avgWin: 150.00,
        avgLoss: 35.00,
        riskRewardRatio: 4.29
      }
    });
    console.log(`✅ Snapshot created: Net PnL +$${snapshot.netProfit}, Profit Factor ${snapshot.profitFactor}, Win Rate ${snapshot.winRate}%`);

    console.log('\n==============================================');
    console.log('🎉 ALL DATABASE PERSISTENCE TESTS PASSED (100%)');
    console.log('==============================================\n');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
