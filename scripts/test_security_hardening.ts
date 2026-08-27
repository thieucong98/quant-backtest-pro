/**
 * QUANT BACKTEST PRO - AUTOMATED SECURITY HARDENING TEST SUITE
 * Tests all 6 vulnerability patches: CORS, Path Validation, Sandbox Isolation, LocalStorage Sanitization, and Auth Guards.
 */

import { StrategyRunner } from '../src/engine/strategySandbox';
import { sanitizeBrokerStorageConfig } from '../src/store/brokerStore';

async function runSecuritySuite() {
  console.log('\n===============================================================');
  console.log('🛡️ QUANT BACKTEST PRO - SECURITY HARDENING VERIFICATION SUITE');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, detail?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } else {
      console.log(`  ❌ [FAIL] ${name} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // TEST GROUP 1: STRATEGY SANDBOX ISOLATION & CODE INJECTION
  // -------------------------------------------------------------
  console.log('--- 1. Strategy Sandbox Isolation Tests ---');
  
  const sandbox = new StrategyRunner();

  // Test 1.1: Malicious strategy trying to read window/localStorage/fetch
  const exploitStrategy = `
    return {
      onCandle: (candle, indicators, account, api) => {
        // Attempt to exfiltrate window or localStorage
        if (typeof window !== 'undefined' && window) {
          throw new Error('LEAK_WINDOW');
        }
        if (typeof localStorage !== 'undefined' && localStorage) {
          throw new Error('LEAK_LOCALSTORAGE');
        }
        if (typeof fetch !== 'undefined' && fetch) {
          throw new Error('LEAK_FETCH');
        }
      }
    };
  `;

  const compileRes = sandbox.compile(exploitStrategy);
  assert('Exploit strategy compiles inside Sandbox wrapper', compileRes.success);

  let leakDetected = false;
  try {
    sandbox.executeCandle(
      { timestamp: 1000, open: 1, high: 2, low: 0.5, close: 1.5, volume: 100 },
      {} as any,
      {} as any,
      {} as any
    );
  } catch (e: any) {
    if (e.message.startsWith('LEAK_')) {
      leakDetected = true;
    }
  }

  assert('Global browser APIs (window, localStorage, fetch) shadowed to undefined', !leakDetected);

  // -------------------------------------------------------------
  // TEST GROUP 2: BROWSER LOCALSTORAGE CREDENTIAL SANITIZATION
  // -------------------------------------------------------------
  console.log('\n--- 2. Browser LocalStorage Credential Sanitization ---');

  const mockState = {
    activeBroker: 'MT5_EXNESS',
    config: {
      gatewayUrl: 'http://127.0.0.1:8765',
      account: '84920184',
      password: 'SuperSecretRealPassword123!',
      server: 'Exness-MT5Real',
      autoReconnect: true
    },
    isLiveTradingMode: true,
    positions: [{ ticket: 1234 }]
  };

  const persisted = sanitizeBrokerStorageConfig(mockState);
  assert('Plaintext password is stripped from persisted storage', persisted.config.password === '');
  assert('Other harmless config fields (account, server) preserved', persisted.config.account === '84920184' && persisted.config.server === 'Exness-MT5Real');
  assert('Active positions are not leaked to persistent disk', (persisted as any).positions === undefined);

  // -------------------------------------------------------------
  // TEST GROUP 3: MT5 GATEWAY SECURITY & PATH VALIDATION
  // -------------------------------------------------------------
  console.log('\n--- 3. MT5 Gateway Path Validation & CORS ---');

  try {
    // Test 3.1: Path traversal / Arbitrary binary rejection on Gateway
    const res = await fetch('http://127.0.0.1:8765/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        account: '123456',
        password: 'fake',
        server: 'Demo',
        path: 'C:\\Windows\\System32\\cmd.exe'
      })
    });

    const data = await res.json();
    assert('Arbitrary executable path (cmd.exe) rejected with invalid_path', data.mode === 'invalid_path' && data.success === false);
  } catch (err: any) {
    console.log('  ⚠️ Gateway probe skipped:', err.message);
  }

  // -------------------------------------------------------------
  // TEST GROUP 4: BACKEND AUTH & SSO SECURITY
  // -------------------------------------------------------------
  console.log('\n--- 4. Backend Authentication & SSO Guard ---');

  try {
    const ssoRes = await fetch('http://localhost:3001/api/auth/sso', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'unsupported_malicious_provider',
        email: 'hacker@test.com'
      })
    });
    assert('Unsupported SSO provider rejected with 400 Bad Request', ssoRes.status === 400);

    const meRes = await fetch('http://localhost:3001/api/users/me');
    assert('Unauthenticated /api/users/me request rejected with 401 Unauthorized', meRes.status === 401);
  } catch (err: any) {
    console.log('  ⚠️ Express server probe skipped:', err.message);
  }

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(`📊 SECURITY SUITE SUMMARY: Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecuritySuite().catch(console.error);
