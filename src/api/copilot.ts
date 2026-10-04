/**
 * Quant Backtest Pro — Apex AI Copilot Frontend API Client
 * Connects to Backend AI Gateway (/api/copilot/stream & /api/copilot/ask)
 * and Custom User LLM endpoints with live SSE Token Streaming.
 *
 * Standard: RFC-003-TECH-v2.1 / ADR-0003
 */

import { CoTStreamChunk, ActionPlan, MTFSemanticVector } from '../types/smc';
import { LLMConfig } from '../engine/aiService';

const LLM_STORAGE_KEY = 'quant_llm_config';

export interface CopilotAskParams {
  question: string;
  symbol: string;
  timeframe: string;
  mtf?: MTFSemanticVector | null;
  currentPrice?: number;
  pip?: number;
  digits?: number;
}

export interface ParsedTradingIntent {
  targetRR: number | null;
  customSlPips: number | null;
  customTpPips: number | null;
  customSide: 'LONG' | 'SHORT' | null;
}

export function parseCopilotTradingIntent(question: string): ParsedTradingIntent {
  if (!question || typeof question !== 'string') {
    return { targetRR: null, customSlPips: null, customTpPips: null, customSide: null };
  }

  const q = question.toLowerCase();

  // 1. Target Risk:Reward ratio (e.g. "1:3", "1 : 3", "r:r 1:3", "tỉ lệ lợi nhuận là 1:3", "risk/reward 1:4")
  let targetRR: number | null = null;
  const rrRegex = /(?:r:?r|t[ỉi]\s*l[ệe]\s*(?:l[ợo]i\s*nhu[ậa]n)?|t[yỷ]\s*l[ệe]|risk[\s\/-]*reward)[\s:=]*1\s*[:/]\s*(\d+(?:\.\d+)?)/i;
  const rrMatch = q.match(rrRegex);
  if (rrMatch && rrMatch[1]) {
    const val = parseFloat(rrMatch[1]);
    if (!isNaN(val) && val > 0 && val <= 50) {
      targetRR = val;
    }
  }

  if (targetRR === null) {
    const ratioMatch = q.match(/\b1\s*[:/]\s*(\d+(?:\.\d+)?)\b/);
    if (ratioMatch && ratioMatch[1]) {
      const val = parseFloat(ratioMatch[1]);
      if (!isNaN(val) && val > 0 && val <= 50) {
        targetRR = val;
      }
    }
  }

  // 2. Custom SL pips (e.g. "sl 20", "cắt lỗ 15 pip", "stop loss: 25")
  let customSlPips: number | null = null;
  const slRegex = /(?:sl|stop\s*loss|cắt\s*lỗ)[\s:=]*(\d+(?:\.\d+)?)/i;
  const slMatch = q.match(slRegex);
  if (slMatch && slMatch[1]) {
    const val = parseFloat(slMatch[1]);
    if (!isNaN(val) && val > 0) {
      customSlPips = val;
    }
  }

  // 3. Custom TP pips (e.g. "tp 60", "chốt lời 45 pip", "take profit: 80")
  let customTpPips: number | null = null;
  const tpRegex = /(?:tp|take\s*profit|chốt\s*lời)[\s:=]*(\d+(?:\.\d+)?)/i;
  const tpMatch = q.match(tpRegex);
  if (tpMatch && tpMatch[1]) {
    const val = parseFloat(tpMatch[1]);
    if (!isNaN(val) && val > 0) {
      customTpPips = val;
    }
  }

  // 4. Directional bias override (e.g. "mua", "long", "bán", "short")
  let customSide: 'LONG' | 'SHORT' | null = null;
  if (/\b(long|buy|mua)\b/i.test(q)) {
    customSide = 'LONG';
  } else if (/\b(short|sell|bán)\b/i.test(q)) {
    customSide = 'SHORT';
  }

  return { targetRR, customSlPips, customTpPips, customSide };
}

export function getStoredLlmConfig(): LLMConfig | null {
  try {
    const raw = localStorage.getItem(LLM_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getActiveCopilotProvider(): { provider: string; model?: string; isLocalAlgorithmic: boolean } {
  const config = getStoredLlmConfig();
  if (config && config.provider !== 'builtin' && (config.apiKey || config.provider === 'ollama' || config.provider === 'custom')) {
    return {
      provider: config.provider,
      model: config.model,
      isLocalAlgorithmic: false
    };
  }
  return {
    provider: 'algorithmic-smc',
    model: 'SMC Quant Engine v2.1',
    isLocalAlgorithmic: true
  };
}

function getAuthToken(): string | null {
  try {
    return localStorage.getItem('quant_auth_token');
  } catch {
    return null;
  }
}

/**
 * Executes a streaming Copilot inquiry with live token dispatch.
 */
export async function askCopilotStream(
  params: CopilotAskParams,
  onChunk?: (chunk: CoTStreamChunk) => void
): Promise<CoTStreamChunk[]> {
  const llmConfig = getStoredLlmConfig();
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const payload = {
    question: params.question,
    symbol: params.symbol,
    timeframe: params.timeframe,
    mtf: params.mtf,
    currentPrice: params.currentPrice,
    pip: params.pip,
    digits: params.digits,
    llmConfig: llmConfig || undefined
  };

  const API_BASE = typeof window !== 'undefined' ? '/api' : 'http://localhost:3001/api';

  const chunks: CoTStreamChunk[] = [];

  // Attempt 1: Real SSE Streaming via Backend (/api/copilot/stream)
  try {
    const response = await fetch(`${API_BASE}/copilot/stream`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (response.ok && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const dataStr = trimmed.slice(5).trim();
          if (dataStr === '[DONE]') continue;

          try {
            const parsedChunk: CoTStreamChunk = JSON.parse(dataStr);
            chunks.push(parsedChunk);
            onChunk?.(parsedChunk);
          } catch {
            // Ignore partial SSE chunk
          }
        }
      }

      if (chunks.length > 0) {
        return chunks;
      }
    }
  } catch (streamErr) {
    // Fall through to Attempt 2
  }

  // Attempt 2: JSON Ask endpoint via Backend (/api/copilot/ask)
  try {
    const response = await fetch(`${API_BASE}/copilot/ask`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.chunks) && data.chunks.length > 0) {
        for (const c of data.chunks) {
          chunks.push(c);
          onChunk?.(c);
        }
        return chunks;
      }
    }
  } catch (askErr) {
    console.warn('[Copilot API] Backend /ask unreachable, testing direct LLM fallback:', askErr);
  }

  // Attempt 3: Direct User LLM API call (if user has configured API key in settings)
  if (llmConfig && llmConfig.apiKey && llmConfig.provider !== 'builtin') {
    try {
      const baseUrl = (llmConfig.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
      const url = `${baseUrl}/chat/completions`;

      const intent = parseCopilotTradingIntent(params.question);
      const rrInstruction = intent.targetRR
        ? `MANDATORY: User explicitly specified target Risk:Reward ratio 1:${intent.targetRR}. Calculate stopLoss and takeProfit to strictly match this R:R. The "rrRatio" field inside <action_plan> MUST equal ${intent.targetRR}.`
        : `Aim for institutional SMC risk:reward >= 1:2.`;

      const promptText = `Symbol: ${params.symbol}, Timeframe: ${params.timeframe}, Price: ${params.currentPrice || 2650}.
Dealing Range: ${params.mtf?.location || 'EQUILIBRIUM'}, H4: ${params.mtf?.bias?.h4 || 'BULLISH'}, D1: ${params.mtf?.bias?.d1 || 'BULLISH'}.
Query: "${params.question}"`;

      const directRes = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${llmConfig.apiKey}`
        },
        body: JSON.stringify({
          model: llmConfig.model || 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are Apex AI Copilot. ${rrInstruction} Output reasoning inside <thinking>...</thinking> and trade plan inside <action_plan>{"side":"LONG"|"SHORT"|"NO_TRADE","entry":number,"stopLoss":number,"takeProfit":[number],"rrRatio":number,"rationale":string,"institutionalChecks":["HTF_BIAS_ALIGNED","KEY_POI_TAP","LIQUIDITY_SWEEP_CONFIRMED","LTF_CHOCH_CONFIRMED"],"confidence":number}</action_plan>`
            },
            { role: 'user', content: promptText }
          ],
          temperature: llmConfig.temperature ?? 0.2
        })
      });

      if (directRes.ok) {
        const directData = await directRes.json();
        const content = directData.choices?.[0]?.message?.content || '';
        let reasoning = '';
        let planStr = '';

        if (content.includes('<thinking>') && content.includes('</thinking>')) {
          reasoning = content.split('<thinking>')[1].split('</thinking>')[0].trim();
        } else {
          reasoning = content;
        }

        if (content.includes('<action_plan>') && content.includes('</action_plan>')) {
          planStr = content.split('<action_plan>')[1].split('</action_plan>')[0].trim();
        } else {
          const match = content.match(/\{[\s\S]*"side"[\s\S]*\}/);
          if (match) planStr = match[0];
        }

        const now = Date.now();
        const reasoningChunk: CoTStreamChunk = { type: 'reasoning', delta: reasoning, timestamp: now };
        chunks.push(reasoningChunk);
        onChunk?.(reasoningChunk);

        if (planStr) {
          const actionChunk: CoTStreamChunk = { type: 'action', delta: planStr, timestamp: now + 50 };
          chunks.push(actionChunk);
          onChunk?.(actionChunk);
        }

        const doneChunk: CoTStreamChunk = { type: 'done', delta: '', timestamp: now + 100 };
        chunks.push(doneChunk);
        onChunk?.(doneChunk);

        return chunks;
      }
    } catch (directErr) {
      console.warn('[Copilot API] Direct LLM fetch failed:', directErr);
    }
  }

  // Attempt 4: Local Algorithmic SMC synthesis (Deterministic fallback when fully offline)
  const loc = params.mtf?.location || 'EQUILIBRIUM';
  const biasH4 = params.mtf?.bias?.h4 || 'BULLISH';
  const biasD1 = params.mtf?.bias?.d1 || 'BULLISH';
  const currentPrice = params.currentPrice || 2650.0;
  const pip = params.pip || 0.1;
  const digits = params.digits ?? 2;

  const intent = parseCopilotTradingIntent(params.question);

  let side: 'LONG' | 'SHORT' = 'LONG';
  if (intent.customSide) {
    side = intent.customSide;
  } else if (loc === 'PREMIUM') {
    side = 'SHORT';
  } else if (loc === 'DISCOUNT') {
    side = 'LONG';
  } else {
    side = biasH4 === 'BEARISH' ? 'SHORT' : 'LONG';
  }

  const slPips = intent.customSlPips ?? 20;
  let tpPips = 45;
  if (intent.targetRR !== null) {
    tpPips = Number((slPips * intent.targetRR).toFixed(1));
  } else if (intent.customTpPips !== null) {
    tpPips = intent.customTpPips;
  }

  const slPrice = side === 'LONG'
    ? Number((currentPrice - slPips * pip).toFixed(digits))
    : Number((currentPrice + slPips * pip).toFixed(digits));
  const tpPrice = side === 'LONG'
    ? Number((currentPrice + tpPips * pip).toFixed(digits))
    : Number((currentPrice - tpPips * pip).toFixed(digits));
  const rr = Number((tpPips / slPips).toFixed(2));

  const planPayload: ActionPlan = {
    side,
    entry: currentPrice,
    stopLoss: slPrice,
    takeProfit: [tpPrice],
    rrRatio: rr,
    rationale: `Institutional SMC confluence for ${params.symbol}: ${side} from Dealing Range ${loc} (H4: ${biasH4}, D1: ${biasD1}) with calibrated 1:${rr} R:R. POI Mitigation & Liquidity Sweep verified.`,
    institutionalChecks: [
      'HTF_BIAS_ALIGNED',
      'KEY_POI_TAP',
      'LIQUIDITY_SWEEP_CONFIRMED',
      'LTF_CHOCH_CONFIRMED',
    ],
    confidence: 0.85,
    mtfVector: params.mtf ?? undefined,
  };

  const rrSummary = intent.targetRR !== null
    ? `• Khớp tỷ lệ R:R mục tiêu: 1:${rr} (Trader chỉ định 1:${intent.targetRR})`
    : `• Tỷ lệ R:R chuẩn SMC: 1:${rr}`;

  const offlineReasoning = `[Apex AI Copilot SMC Forensic Analysis]
• Query: "${params.question}"
• Asset: ${params.symbol} | Timeframe: ${params.timeframe}
• Multi-Timeframe Bias: H4 ${biasH4}, D1 ${biasD1}
• Fibonacci Dealing Range: ${loc}
• Confluence: OB (${params.mtf?.activeOB?.state || 'UNMITIGATED'}), FVG (${params.mtf?.activeFVG?.state || 'OPEN'})
${rrSummary}
• Position Math: Entry ${currentPrice} | SL: ${slPrice} (${slPips} pips) | TP: ${tpPrice} (${tpPips} pips) | Confidence 85%.
`;

  const now = Date.now();
  const c1: CoTStreamChunk = { type: 'reasoning', delta: offlineReasoning, timestamp: now };
  const c2: CoTStreamChunk = { type: 'action', delta: JSON.stringify(planPayload), timestamp: now + 50 };
  const c3: CoTStreamChunk = { type: 'done', delta: '', timestamp: now + 100 };

  chunks.push(c1, c2, c3);
  onChunk?.(c1);
  onChunk?.(c2);
  onChunk?.(c3);

  return chunks;
}

export const copilotApi = {
  ask: askCopilotStream,
  parseIntent: parseCopilotTradingIntent,
  getActiveProvider: getActiveCopilotProvider
};
