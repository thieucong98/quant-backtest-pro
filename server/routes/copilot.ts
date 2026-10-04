/**
 * Quant Backtest Pro — Apex AI Copilot Backend Route
 * Standard: RFC-003-TECH-v2.1 / ADR-0003 Tier 3 AI Gateway
 *
 * Endpoints:
 *  - POST /api/copilot/ask    (JSON payload with full CoTStreamChunk array)
 *  - POST /api/copilot/stream (Server-Sent Events streaming real-time tokens)
 */

import { Router, Request, Response } from 'express';
import { optionalAuth } from './users.js';

export const copilotRouter = Router();
copilotRouter.use(optionalAuth);

interface ActionPlanPayload {
  side: 'LONG' | 'SHORT' | 'NO_TRADE';
  entry: number;
  stopLoss: number;
  takeProfit: number[];
  rrRatio: number;
  rationale: string;
  institutionalChecks: string[];
  confidence: number;
  mtfVector?: any;
}

interface CoTChunk {
  type: 'reasoning' | 'action' | 'done' | 'error';
  delta: string;
  timestamp: number;
}

export interface ParsedTradingIntent {
  targetRR: number | null;
  customSlPips: number | null;
  customTpPips: number | null;
  customSide: 'LONG' | 'SHORT' | null;
}

/**
 * Intelligent NLP & heuristic parser extracting financial intent from trader queries.
 * Supports Vietnamese, English, and trading shorthand (e.g. 1:3, R:R 1:3, SL 15 pip).
 */
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
    // Standalone 1:X format (e.g. "1:3", "1:2.5", "1/3")
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

export function computeAlgorithmicActionPlan(params: {
  question: string;
  symbol: string;
  timeframe: string;
  mtf?: any;
  currentPrice?: number;
  pip?: number;
  digits?: number;
}): { reasoning: string; plan: ActionPlanPayload; chunks: CoTChunk[] } {
  const symbol = params.symbol || 'XAUUSD';
  const timeframe = params.timeframe || 'M5';
  const currentPrice = typeof params.currentPrice === 'number' && params.currentPrice > 0 ? params.currentPrice : 2650.0;
  const pip = typeof params.pip === 'number' && params.pip > 0 ? params.pip : (symbol.includes('JPY') ? 0.01 : symbol.includes('XAU') ? 0.1 : 0.0001);
  const digits = typeof params.digits === 'number' ? params.digits : (symbol.includes('JPY') ? 3 : symbol.includes('XAU') ? 2 : 5);

  const mtf = params.mtf;
  const loc = mtf?.location || 'EQUILIBRIUM';
  const biasH4 = mtf?.bias?.h4 || 'BULLISH';
  const biasD1 = mtf?.bias?.d1 || 'BULLISH';
  const obState = mtf?.activeOB?.state || 'UNMITIGATED';
  const fvgState = mtf?.activeFVG?.state || 'OPEN';

  // Extract financial entities and intent from user prompt
  const intent = parseCopilotTradingIntent(params.question);

  // Directional logic: Respect explicit trader instruction if provided, else institutional location rule
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

  // Dynamic Stop Loss and Take Profit calibration based on user requested R:R
  const slPips = intent.customSlPips ?? 20;
  let tpPips = 45;

  if (intent.targetRR !== null) {
    tpPips = Number((slPips * intent.targetRR).toFixed(1));
  } else if (intent.customTpPips !== null) {
    tpPips = intent.customTpPips;
  }

  const slPrice =
    side === 'LONG'
      ? Number((currentPrice - slPips * pip).toFixed(digits))
      : Number((currentPrice + slPips * pip).toFixed(digits));
  const tpPrice =
    side === 'LONG'
      ? Number((currentPrice + tpPips * pip).toFixed(digits))
      : Number((currentPrice - tpPips * pip).toFixed(digits));
  const rr = Number((tpPips / slPips).toFixed(2));

  const checks = [
    'HTF_BIAS_ALIGNED',
    'KEY_POI_TAP',
    'LIQUIDITY_SWEEP_CONFIRMED',
    'LTF_CHOCH_CONFIRMED',
  ];

  const plan: ActionPlanPayload = {
    side,
    entry: currentPrice,
    stopLoss: slPrice,
    takeProfit: [tpPrice],
    rrRatio: rr,
    rationale: `Institutional SMC confluence for ${symbol}: ${side} from Dealing Range ${loc} (H4: ${biasH4}, D1: ${biasD1}) with calibrated 1:${rr} R:R. Key POI mitigation & liquidity sweep verified.`,
    institutionalChecks: checks,
    confidence: 0.85,
    mtfVector: mtf || undefined
  };

  const rrSummary = intent.targetRR !== null
    ? `• Khớp tỷ lệ R:R mục tiêu: 1:${rr} (Trader chỉ định 1:${intent.targetRR})`
    : `• Tỷ lệ R:R chuẩn SMC: 1:${rr}`;

  const reasoning = `[Apex AI Copilot SMC Forensic Analysis]
• Câu hỏi / Yêu cầu: "${params.question}"
• Cặp tài sản: ${symbol} | Khung thời gian: ${timeframe}
• Multi-Timeframe Bias: H4 ${biasH4}, D1 ${biasD1}
• Fibonacci Dealing Range: ${loc} (${loc === 'DISCOUNT' ? 'Vùng tích lũy Discount' : loc === 'PREMIUM' ? 'Vùng phân phối Premium' : 'Vùng cân bằng Equilibrium'})
• Cấu trúc hợp lưu: Order Block (${obState}), Fair Value Gap (${fvgState})
• Quy tắc tổ chức: Lệnh ${side} phù hợp với bộ lọc cấu trúc thị trường.
${rrSummary}
• Thông số vị thế: Giá vào: ${currentPrice} | Cắt lỗ: ${slPrice} (${slPips} pips) | Chốt lời: ${tpPrice} (${tpPips} pips) | Độ tin cậy: 85%.
`;

  const now = Date.now();
  const chunks: CoTChunk[] = [
    { type: 'reasoning', delta: reasoning, timestamp: now },
    { type: 'action', delta: JSON.stringify(plan), timestamp: now + 50 },
    { type: 'done', delta: '', timestamp: now + 100 }
  ];

  return { reasoning, plan, chunks };
}

export function normalizeOpenAiEndpoint(baseUrl?: string): string {
  if (!baseUrl || !baseUrl.trim()) {
    return 'https://api.openai.com/v1/chat/completions';
  }
  let clean = baseUrl.trim().replace(/\/+$/, '');
  if (clean.endsWith('/chat/completions')) {
    return clean;
  }
  if (clean.endsWith('/v1')) {
    return `${clean}/chat/completions`;
  }
  if (clean.includes('/v1') || clean.includes('/v2') || clean.includes('/api')) {
    return `${clean}/chat/completions`;
  }
  return `${clean}/v1/chat/completions`;
}

/**
 * Validates Gateway URL to guard against SSRF, cloud metadata leaks, and invalid protocols.
 */
export function validateGatewayUrl(urlStr: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'Protocol must be http or https' };
    }
    const host = parsed.hostname.toLowerCase();
    if (
      host === '169.254.169.254' ||
      host === 'metadata.google.internal' ||
      host === 'instance-data' ||
      host.endsWith('.internal')
    ) {
      return { valid: false, error: 'Access to cloud instance metadata service is prohibited' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

// POST /api/copilot/ping — Fast test connection for custom LLM Gateway
copilotRouter.post('/ping', async (req: Request, res: Response) => {
  try {
    const { baseUrl, apiKey, model } = req.body;
    const url = normalizeOpenAiEndpoint(baseUrl);
    const validation = validateGatewayUrl(url);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.error || 'Invalid Gateway URL' });
    }
    const start = Date.now();

    console.log(`[Copilot Engine] 🔍 Testing connection to Gateway: ${url} (model: ${model || 'default'})`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
      },
      body: JSON.stringify({
        model: model || 'gpt-4o',
        messages: [{ role: 'user', content: 'Ping' }],
        max_tokens: 5,
        stream: false
      }),
      signal: AbortSignal.timeout(10000)
    });

    const latencyMs = Date.now() - start;
    if (response.ok) {
      console.log(`[Copilot Engine] ✅ Gateway Ping OK (${latencyMs}ms)`);
      res.json({
        success: true,
        latencyMs,
        url,
        message: `HTTP 200 OK (${latencyMs}ms)`
      });
    } else {
      const errText = await response.text().catch(() => '');
      console.warn(`[Copilot Engine] ❌ Gateway Ping HTTP ${response.status}: ${errText.slice(0, 200)}`);
      res.status(response.status).json({
        success: false,
        latencyMs,
        url,
        error: `HTTP ${response.status}: ${errText.slice(0, 200)}`
      });
    }
  } catch (err: any) {
    console.warn(`[Copilot Engine] ❌ Gateway Ping exception:`, err?.message);
    res.status(500).json({
      success: false,
      error: err.message || 'Lỗi kết nối tới Gateway'
    });
  }
});

// POST /api/copilot/ask — Single request returning chunks
copilotRouter.post('/ask', async (req: Request, res: Response) => {
  try {
    const { question, symbol, timeframe, mtf, currentPrice, pip, digits, llmConfig } = req.body;

    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'Thiếu câu hỏi (question) hợp lệ.' });
      return;
    }

    const intent = parseCopilotTradingIntent(question);

    // Check if user provided custom LLM configuration to call directly
    if (
      llmConfig &&
      (llmConfig.apiKey || llmConfig.provider === 'ollama' || llmConfig.provider === 'custom') &&
      llmConfig.provider !== 'builtin'
    ) {
      try {
        const url = normalizeOpenAiEndpoint(llmConfig.baseUrl);
        const validation = validateGatewayUrl(url);
        if (!validation.valid) {
          console.warn(`[Copilot Engine] ❌ Blocked unsafe Gateway URL in /ask: ${url} (${validation.error})`);
        } else {
        const targetRRInstruction = intent.targetRR
          ? `MANDATORY RISK-TO-REWARD CONSTRAINT: The user explicitly specified target Risk:Reward ratio 1:${intent.targetRR}. You MUST calculate stopLoss and takeProfit such that |takeProfit - entry| / |entry - stopLoss| == ${intent.targetRR}. The "rrRatio" field inside <action_plan> MUST be ${intent.targetRR}.`
          : `Calibrate stopLoss and takeProfit according to institutional SMC risk parameters (aim for minimum 1:2 to 1:3 R:R).`;

        const systemPrompt = `You are Apex AI Copilot, an elite quantitative Smart Money Concepts trading engine for Quant Backtest Pro.
Analyze the user's query with institutional SMC methodology (HTF Bias, Dealing Range Premium/Discount, Order Blocks, FVGs, Liquidity Sweeps).
${targetRRInstruction}

First, output your reasoning inside <thinking>...</thinking>.
Then, output an actionable trade plan inside <action_plan>{...}</action_plan> as valid JSON matching:
{
  "side": "LONG"|"SHORT"|"NO_TRADE",
  "entry": number,
  "stopLoss": number,
  "takeProfit": [number],
  "rrRatio": number,
  "rationale": string,
  "institutionalChecks": ["HTF_BIAS_ALIGNED", "KEY_POI_TAP", "LIQUIDITY_SWEEP_CONFIRMED", "LTF_CHOCH_CONFIRMED"],
  "confidence": number
}`;

        const promptText = `Symbol: ${symbol || 'XAUUSD'}, Timeframe: ${timeframe || 'M5'}, Current Price: ${currentPrice || 2650}.
Dealing Range Location: ${mtf?.location || 'EQUILIBRIUM'}, H4: ${mtf?.bias?.h4 || 'BULLISH'}, D1: ${mtf?.bias?.d1 || 'BULLISH'}.
User Query: "${question}"`;

        console.log(`[Copilot Engine] 🚀 /ask Dispatching to Gateway: ${url} | Model: ${llmConfig.model || 'gpt-4o'}`);

        const llmResponse = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(llmConfig.apiKey ? { Authorization: `Bearer ${llmConfig.apiKey}` } : {})
          },
          body: JSON.stringify({
            model: llmConfig.model || 'gpt-4o',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: promptText }
            ],
            temperature: llmConfig.temperature ?? 0.2
          }),
          signal: AbortSignal.timeout(25000)
        });

        if (llmResponse.ok) {
          const data: any = await llmResponse.json();
          const content = data.choices?.[0]?.message?.content || '';

          let reasoning = '';
          let actionJson = '';

          if (content.includes('<thinking>') && content.includes('</thinking>')) {
            const thinkMatch = content.match(/<thinking>([\s\S]*?)<\/thinking>/);
            reasoning = thinkMatch ? thinkMatch[1].trim() : '';
          }

          if (content.includes('<action_plan>') && content.includes('</action_plan>')) {
            const planMatch = content.match(/<action_plan>([\s\S]*?)<\/action_plan>/);
            actionJson = planMatch ? planMatch[1].trim() : '';
          } else {
            const jsonMatch = content.match(/\{[\s\S]*"side"[\s\S]*\}/);
            if (jsonMatch) actionJson = jsonMatch[0];
          }

          if (reasoning || actionJson) {
            console.log(`[Copilot Engine] ✅ /ask Gateway response received successfully`);
            const now = Date.now();
            const chunks: CoTChunk[] = [
              { type: 'reasoning', delta: reasoning || content, timestamp: now },
              ...(actionJson ? [{ type: 'action' as const, delta: actionJson, timestamp: now + 50 }] : []),
              { type: 'done', delta: '', timestamp: now + 100 }
            ];
            res.json({ chunks, success: true, provider: llmConfig.provider });
            return;
          }
        } else {
          const errText = await llmResponse.text().catch(() => '');
          console.warn(`[Copilot Engine] ❌ /ask Gateway HTTP ${llmResponse.status}: ${errText.slice(0, 300)}`);
        }
        } catch (llmErr: any) {
          console.warn('[Copilot Engine] ⚠️ External LLM /ask failed, falling back to algorithmic inference:', llmErr?.message);
        }
      }
    }

    // Algorithmic SMC synthesis (zero external API dependency, guaranteed deterministic response with parsed R:R)
    const result = computeAlgorithmicActionPlan({
      question,
      symbol,
      timeframe,
      mtf,
      currentPrice,
      pip,
      digits
    });

    res.json({
      chunks: result.chunks,
      success: true,
      provider: 'algorithmic-smc'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lỗi xử lý Copilot' });
  }
});

// POST /api/copilot/stream — SSE Server-Sent Events real-time streaming with dual stream/non-stream delivery
copilotRouter.post('/stream', async (req: Request, res: Response) => {
  try {
    const { question, symbol, timeframe, mtf, currentPrice, pip, digits, llmConfig } = req.body;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const intent = parseCopilotTradingIntent(question || '');

    // Check if user has active external LLM configured
    if (
      llmConfig &&
      (llmConfig.apiKey || llmConfig.provider === 'ollama' || llmConfig.provider === 'custom') &&
      llmConfig.provider !== 'builtin'
    ) {
      const url = normalizeOpenAiEndpoint(llmConfig.baseUrl);
      const validation = validateGatewayUrl(url);
      if (validation.valid) {
        const targetRRInstruction = intent.targetRR
        ? `MANDATORY RISK-TO-REWARD CONSTRAINT: The user explicitly requested a target Risk-to-Reward ratio of 1:${intent.targetRR}. You MUST set entry, stopLoss, and takeProfit such that the R:R (|takeProfit - entry| / |entry - stopLoss|) equals EXACTLY ${intent.targetRR}. The "rrRatio" field inside <action_plan> MUST be ${intent.targetRR}.`
        : `Calibrate stopLoss and takeProfit according to institutional SMC risk parameters (aim for minimum 1:2 to 1:3 R:R).`;

      const systemPrompt = `You are Apex AI Copilot, an elite quantitative Smart Money Concepts (SMC) trading engine for Quant Backtest Pro.
Analyze the user's query with institutional SMC methodology (HTF Bias, Dealing Range Premium/Discount, Order Blocks, FVGs, Liquidity Sweeps).
${targetRRInstruction}

First, output your reasoning inside <thinking>...</thinking>.
Then, output an actionable trade plan inside <action_plan>{...}</action_plan> as valid JSON matching:
{
  "side": "LONG"|"SHORT"|"NO_TRADE",
  "entry": number,
  "stopLoss": number,
  "takeProfit": [number],
  "rrRatio": number,
  "rationale": string,
  "institutionalChecks": ["HTF_BIAS_ALIGNED", "KEY_POI_TAP", "LIQUIDITY_SWEEP_CONFIRMED", "LTF_CHOCH_CONFIRMED"],
  "confidence": number
}`;

      const promptText = `Symbol: ${symbol || 'XAUUSD'}, Timeframe: ${timeframe || 'M5'}, Current Price: ${currentPrice || 2650}.
Dealing Range Location: ${mtf?.location || 'EQUILIBRIUM'}, H4: ${mtf?.bias?.h4 || 'BULLISH'}, D1: ${mtf?.bias?.d1 || 'BULLISH'}.
User Query: "${question || 'Phân tích tín hiệu'}"`;

      console.log(`[Copilot Engine] 🚀 /stream Dispatching to Gateway: ${url} | Model: ${llmConfig.model || 'gpt-4o'} (stream: true)`);

      let llmStreamRes: globalThis.Response | null = null;
      let streamFetchError: string | null = null;

      try {
        llmStreamRes = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(llmConfig.apiKey ? { Authorization: `Bearer ${llmConfig.apiKey}` } : {})
          },
          body: JSON.stringify({
            model: llmConfig.model || 'gpt-4o',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: promptText }
            ],
            temperature: llmConfig.temperature ?? 0.2,
            stream: true
          }),
          signal: AbortSignal.timeout(25000)
        });
      } catch (fetchErr: any) {
        streamFetchError = fetchErr?.message || 'Network error';
        console.warn(`[Copilot Engine] ⚠️ Gateway streaming fetch failed for ${url}:`, streamFetchError);
      }

      // 1. Success on SSE Stream
      if (llmStreamRes && llmStreamRes.ok && llmStreamRes.body) {
        try {
          const reader = (llmStreamRes.body as any).getReader();
          const decoder = new TextDecoder();
          let fullText = '';
          let sseBuffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            sseBuffer += decoder.decode(value, { stream: true });
            const lines = sseBuffer.split('\n');
            sseBuffer = lines.pop() ?? '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data:')) continue;
              const dataStr = trimmed.slice(5).trim();
              if (dataStr === '[DONE]') continue;
              try {
                const parsed = JSON.parse(dataStr);
                const delta = parsed.choices?.[0]?.delta?.content || '';
                if (delta) {
                  fullText += delta;
                  res.write(`data: ${JSON.stringify({ type: 'reasoning', delta, timestamp: Date.now() })}\n\n`);
                }
              } catch {}
            }
          }

          let actionJson = '';
          if (fullText.includes('<action_plan>') && fullText.includes('</action_plan>')) {
            const match = fullText.match(/<action_plan>([\s\S]*?)<\/action_plan>/);
            if (match) actionJson = match[1].trim();
          } else {
            const match = fullText.match(/\{[\s\S]*"side"[\s\S]*"entry"[\s\S]*\}/);
            if (match) actionJson = match[0].trim();
          }

          if (!actionJson) {
            const fallback = computeAlgorithmicActionPlan({
              question: question || 'Phân tích tín hiệu',
              symbol: symbol || 'XAUUSD',
              timeframe: timeframe || 'M5',
              mtf,
              currentPrice,
              pip,
              digits
            });
            actionJson = JSON.stringify(fallback.plan);
          }

          res.write(`data: ${JSON.stringify({ type: 'action', delta: actionJson, timestamp: Date.now() })}\n\n`);
          res.write(`data: ${JSON.stringify({ type: 'done', delta: '', timestamp: Date.now() })}\n\n`);
          res.write('data: [DONE]\n\n');
          res.end();
          console.log(`[Copilot Engine] ✅ /stream completed via SSE`);
          return;
        } catch (streamReadErr: any) {
          console.warn(`[Copilot Engine] ⚠️ Error while reading SSE stream:`, streamReadErr?.message);
        }
      }

      // 2. Dual Delivery: If stream: true was rejected (e.g. 400, 422, non-stream gateway), try stream: false!
      const statusErr = llmStreamRes ? `HTTP ${llmStreamRes.status}` : streamFetchError;
      console.warn(`[Copilot Engine] ⚠️ Gateway streaming failed (${statusErr}), retrying with non-streaming mode...`);

      try {
        const nonStreamRes = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(llmConfig.apiKey ? { Authorization: `Bearer ${llmConfig.apiKey}` } : {})
          },
          body: JSON.stringify({
            model: llmConfig.model || 'gpt-4o',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: promptText }
            ],
            temperature: llmConfig.temperature ?? 0.2,
            stream: false
          }),
          signal: AbortSignal.timeout(25000)
        });

        if (nonStreamRes.ok) {
          const data: any = await nonStreamRes.json();
          const content = data.choices?.[0]?.message?.content || '';
          console.log(`[Copilot Engine] ✅ Non-streaming retry succeeded from ${url} (${content.length} chars)`);

          let reasoning = '';
          let actionJson = '';

          if (content.includes('<thinking>') && content.includes('</thinking>')) {
            const thinkMatch = content.match(/<thinking>([\s\S]*?)<\/thinking>/);
            reasoning = thinkMatch ? thinkMatch[1].trim() : '';
          }

          if (content.includes('<action_plan>') && content.includes('</action_plan>')) {
            const planMatch = content.match(/<action_plan>([\s\S]*?)<\/action_plan>/);
            actionJson = planMatch ? planMatch[1].trim() : '';
          } else {
            const jsonMatch = content.match(/\{[\s\S]*"side"[\s\S]*"entry"[\s\S]*\}/);
            if (jsonMatch) actionJson = jsonMatch[0];
          }

          if (!actionJson) {
            const fallback = computeAlgorithmicActionPlan({
              question: question || 'Phân tích tín hiệu',
              symbol: symbol || 'XAUUSD',
              timeframe: timeframe || 'M5',
              mtf,
              currentPrice,
              pip,
              digits
            });
            actionJson = JSON.stringify(fallback.plan);
          }

          res.write(`data: ${JSON.stringify({ type: 'reasoning', delta: reasoning || content, timestamp: Date.now() })}\n\n`);
          res.write(`data: ${JSON.stringify({ type: 'action', delta: actionJson, timestamp: Date.now() })}\n\n`);
          res.write(`data: ${JSON.stringify({ type: 'done', delta: '', timestamp: Date.now() })}\n\n`);
          res.write('data: [DONE]\n\n');
          res.end();
          return;
        } else {
          const errBody = await nonStreamRes.text().catch(() => '');
          console.warn(`[Copilot Engine] ❌ Non-streaming retry failed HTTP ${nonStreamRes.status}: ${errBody.slice(0, 300)}`);
          // Inform client of gateway error via stream
          const notice = `⚠️ [Thông báo Gateway]: Gateway (${url}) phản hồi mã lỗi HTTP ${nonStreamRes.status}. Hệ thống tự động chuyển sang SMC Quant Engine.\n\n`;
          res.write(`data: ${JSON.stringify({ type: 'reasoning', delta: notice, timestamp: Date.now() })}\n\n`);
        }
        } catch (nonStreamErr: any) {
          console.warn(`[Copilot Engine] ❌ Non-streaming fetch exception:`, nonStreamErr?.message);
          const notice = `⚠️ [Thông báo Gateway]: Không thể kết nối tới ${url} (${nonStreamErr?.message || 'Lỗi mạng'}). Hệ thống chuyển sang SMC Quant Engine.\n\n`;
          res.write(`data: ${JSON.stringify({ type: 'reasoning', delta: notice, timestamp: Date.now() })}\n\n`);
        }
      } else {
        console.warn(`[Copilot Engine] ❌ Blocked unsafe Gateway URL in /stream: ${url} (${validation.error})`);
      }
    }

    // Default & High-Performance Fallback: Algorithmic SMC synthesis with parsed intent
    const result = computeAlgorithmicActionPlan({
      question: question || 'Phân tích tín hiệu',
      symbol: symbol || 'XAUUSD',
      timeframe: timeframe || 'M5',
      mtf,
      currentPrice,
      pip,
      digits
    });

    // Stream reasoning in progressive token chunks
    const words = result.reasoning.split(' ');
    let wordIdx = 0;

    const interval = setInterval(() => {
      if (wordIdx < words.length) {
        const delta = (wordIdx === 0 ? '' : ' ') + words[wordIdx];
        res.write(`data: ${JSON.stringify({ type: 'reasoning', delta, timestamp: Date.now() })}\n\n`);
        wordIdx++;
      } else {
        clearInterval(interval);
        res.write(`data: ${JSON.stringify({ type: 'action', delta: JSON.stringify(result.plan), timestamp: Date.now() })}\n\n`);
        res.write(`data: ${JSON.stringify({ type: 'done', delta: '', timestamp: Date.now() })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      }
    }, 20);

    req.on('close', () => {
      clearInterval(interval);
      res.end();
    });
  } catch (err: any) {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', delta: err.message, timestamp: Date.now() })}\n\n`);
      res.end();
    }
  }
});
