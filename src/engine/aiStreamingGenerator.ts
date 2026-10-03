/**
 * Quant Backtest Pro — Real-Time Streaming Strategy Code Generator
 * Features:
 *  - SSE Token Streaming Parser
 *  - Chain-of-Thought (<think>...</think>) Extraction
 *  - Real-time Token Speed Telemetry (tokens/sec)
 *  - AbortController Cancel Support
 *  - Built-in Offline Fallback Synthesizer
 */

import { LLMConfig, AI_PROVIDER_MODELS } from './aiService';

export interface StreamingProgress {
  reasoning: string;
  code: string;
  tokensGenerated: number;
  tokensPerSec: number;
  isThinking: boolean;
  status: 'IDLE' | 'GENERATING' | 'DONE' | 'CANCELLED' | 'ERROR';
  errorMessage?: string;
}

export interface StreamingCallbacks {
  onProgress?: (progress: StreamingProgress) => void;
  onReasoningDelta?: (delta: string) => void;
  onCodeDelta?: (delta: string) => void;
  onComplete?: (result: { name: string; description: string; code: string; reasoning: string }) => void;
  onError?: (err: Error) => void;
}

const STREAMING_SYSTEM_PROMPT = `Bạn là một Chuyên gia Lập trình Thuật toán Giao dịch Định lượng (Quant Strategy Developer) hàng đầu thế giới cho nền tảng Quant Backtest Pro.
Quy trình tư duy:
1. Hãy đặt suy luận toán học và logic chỉ báo trong thẻ <think>...</think>.
2. Sau thẻ </think>, trả về duy nhất một khối mã nguồn JavaScript bắt đầu bằng "return {" và kết thúc bằng "};".

Cấu trúc mã bắt buộc:
\`\`\`javascript
return {
  parameters: {
    emaFast: 9,
    emaSlow: 21,
    slPips: 20,
    tpPips: 40,
    lotSize: 0.1
  },
  onCandle(candle, indicators, account, api) {
    // indicators.sma(period, offset=0)
    // indicators.ema(period, offset=0)
    // indicators.rsi(period, offset=0)
    // indicators.macd(fast, slow, signal, offset=0) -> { macd, signal, hist }
    // indicators.bollingerBands(period, stdDev, offset=0) -> { upper, middle, lower }
    // indicators.atr(period, offset=0)
    // api.buy({ lotSize, stopLossPips, takeProfitPips })
    // api.sell({ lotSize, stopLossPips, takeProfitPips })
    // api.closeAll()
  }
};
\`\`\`
QUY TẮC: TUYỆT ĐỐI không giải thích thêm sau khối return. offset luôn là số nguyên (0 là nến hiện tại).`;

export class AIStreamingGenerator {
  private abortController: AbortController | null = null;

  public cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  public async generateStrategyStream(
    prompt: string,
    config: LLMConfig,
    symbol: string,
    callbacks: StreamingCallbacks
  ): Promise<void> {
    this.cancel();
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    const startTime = Date.now();
    let tokensCount = 0;
    let rawAccumulator = '';
    let reasoning = '';
    let code = '';
    let insideThink = false;

    const reportProgress = (status: StreamingProgress['status'], errMsg?: string) => {
      const elapsedSec = Math.max((Date.now() - startTime) / 1000, 0.1);
      const tokensPerSec = Math.round(tokensCount / elapsedSec);
      callbacks.onProgress?.({
        reasoning,
        code,
        tokensGenerated: tokensCount,
        tokensPerSec,
        isThinking: insideThink,
        status,
        errorMessage: errMsg
      });
    };

    reportProgress('GENERATING');

    try {
      // Nếu là chế độ Builtin Offline hoặc không có API key ở chế độ online, sử dụng Simulated Token Stream
      if (config.provider === 'builtin' || (!config.apiKey && config.provider !== 'ollama')) {
        await this.simulateTokenStream(prompt, symbol, signal, {
          onToken: (token, isThink) => {
            tokensCount++;
            if (isThink) {
              reasoning += token;
              callbacks.onReasoningDelta?.(token);
            } else {
              code += token;
              callbacks.onCodeDelta?.(token);
            }
            insideThink = isThink;
            reportProgress('GENERATING');
          }
        });

        reportProgress('DONE');
        callbacks.onComplete?.({
          name: `AI Strategy (${symbol}) - ` + prompt.slice(0, 25),
          description: `Generated strategy for ${symbol}: ${prompt}`,
          code: cleanCodeOutput(code),
          reasoning
        });
        return;
      }

      // Xử lý OpenAI / Custom / DeepSeek qua standard OpenAI-compatible SSE
      const baseUrl = (config.baseUrl || AI_PROVIDER_MODELS[config.provider]?.defaultBaseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
      const url = `${baseUrl}/chat/completions`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model || 'gpt-4o',
          messages: [
            { role: 'system', content: STREAMING_SYSTEM_PROMPT },
            { role: 'user', content: `Cặp tiền: ${symbol}\nYêu cầu: ${prompt}` }
          ],
          stream: true,
          temperature: config.temperature ?? 0.2
        }),
        signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `API Error HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported on this response body');
      }

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
          const payload = trimmed.slice(5).trim();
          if (payload === '[DONE]') continue;

          try {
            const parsed = JSON.parse(payload);
            const deltaContent = parsed.choices?.[0]?.delta?.content || '';
            const deltaReasoning = parsed.choices?.[0]?.delta?.reasoning_content || parsed.choices?.[0]?.delta?.reasoning || '';

            if (deltaReasoning) {
              tokensCount++;
              insideThink = true;
              reasoning += deltaReasoning;
              callbacks.onReasoningDelta?.(deltaReasoning);
              reportProgress('GENERATING');
            }

            if (deltaContent) {
              tokensCount++;
              rawAccumulator += deltaContent;

              // Parse <think> tokens if model embeds them in content
              if (rawAccumulator.includes('<think>') && !rawAccumulator.includes('</think>')) {
                insideThink = true;
                const thinkIndex = rawAccumulator.indexOf('<think>') + 7;
                const currentThink = rawAccumulator.substring(thinkIndex);
                reasoning = currentThink;
                callbacks.onReasoningDelta?.(deltaContent);
              } else if (rawAccumulator.includes('</think>')) {
                insideThink = false;
                const parts = rawAccumulator.split('</think>');
                reasoning = parts[0].replace('<think>', '').trim();
                code = parts[1].trim();
                callbacks.onCodeDelta?.(deltaContent);
              } else {
                if (insideThink && !deltaReasoning) {
                  insideThink = false;
                }
                code += deltaContent;
                callbacks.onCodeDelta?.(deltaContent);
              }

              reportProgress('GENERATING');
            }
          } catch {
            // Ignore partial SSE json chunks
          }
        }
      }

      reportProgress('DONE');
      callbacks.onComplete?.({
        name: `AI Strategy (${symbol}) - ` + prompt.slice(0, 25),
        description: `Generated strategy for ${symbol}: ${prompt}`,
        code: cleanCodeOutput(code || rawAccumulator),
        reasoning
      });
    } catch (err: any) {
      if (err.name === 'AbortError' || signal.aborted) {
        reportProgress('CANCELLED');
      } else {
        reportProgress('ERROR', err.message);
        callbacks.onError?.(err);
      }
    }
  }

  /**
   * Bộ tổng hợp Token Stream cục bộ mượt mà (60Hz) khi offline hoặc dùng provider 'builtin'
   */
  private async simulateTokenStream(
    prompt: string,
    symbol: string,
    signal: AbortSignal,
    onStep: { onToken: (token: string, isThink: boolean) => void }
  ): Promise<void> {
    const isRsi = prompt.toLowerCase().includes('rsi');
    const isMacd = prompt.toLowerCase().includes('macd');
    const isEma = prompt.toLowerCase().includes('ema') || (!isRsi && !isMacd);

    const thinkText = `Phân tích yêu cầu chiến lược: "${prompt}" cho cặp tiền ${symbol}.
• Mô hình tối ưu: ${isRsi ? 'Mean Reversion dựa trên RSI 14' : isMacd ? 'Momentum Crossover dựa trên MACD (12, 26, 9)' : 'Trend Following dựa trên đường trung bình EMA (9, 21)'}.
• Quản lý rủi ro: Đặt Stop Loss 25 pips và Take Profit 50 pips (Tỷ lệ R:R = 1:2 chuẩn quỹ).
• Kiểm tra điều kiện nến đóng: Tránh false breakout và hạn chế giao dịch nhiều lệnh cùng lúc.
• Khởi tạo khung mã nguồn JavaScript tương thích 100% với Backtest Engine v2.1.`;

    const codeText = isRsi
      ? `return {
  parameters: {
    rsiPeriod: 14,
    oversoldLevel: 30,
    overboughtLevel: 70,
    slPips: 25,
    tpPips: 50,
    lotSize: 0.1
  },
  onCandle(candle, indicators, account, api) {
    if (account.openPositionsCount > 0) return;
    const rsi = indicators.rsi(this.parameters.rsiPeriod, 0);
    const rsiPrev = indicators.rsi(this.parameters.rsiPeriod, 1);
    
    // Tín hiệu Buy khi RSI cắt lên từ vùng quá bán
    if (rsiPrev < this.parameters.oversoldLevel && rsi >= this.parameters.oversoldLevel) {
      api.buy({
        lotSize: this.parameters.lotSize,
        stopLossPips: this.parameters.slPips,
        takeProfitPips: this.parameters.tpPips,
        comment: 'AI RSI Oversold Pullback'
      });
    }
    // Tín hiệu Sell khi RSI cắt xuống từ vùng quá mua
    else if (rsiPrev > this.parameters.overboughtLevel && rsi <= this.parameters.overboughtLevel) {
      api.sell({
        lotSize: this.parameters.lotSize,
        stopLossPips: this.parameters.slPips,
        takeProfitPips: this.parameters.tpPips,
        comment: 'AI RSI Overbought Pullback'
      });
    }
  }
};`
      : isMacd
      ? `return {
  parameters: {
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    slPips: 20,
    tpPips: 45,
    lotSize: 0.1
  },
  onCandle(candle, indicators, account, api) {
    if (account.openPositionsCount > 0) return;
    const curr = indicators.macd(this.parameters.fastPeriod, this.parameters.slowPeriod, this.parameters.signalPeriod, 0);
    const prev = indicators.macd(this.parameters.fastPeriod, this.parameters.slowPeriod, this.parameters.signalPeriod, 1);

    if (prev.macd < prev.signal && curr.macd >= curr.signal) {
      api.buy({
        lotSize: this.parameters.lotSize,
        stopLossPips: this.parameters.slPips,
        takeProfitPips: this.parameters.tpPips,
        comment: 'AI MACD Bullish Cross'
      });
    } else if (prev.macd > prev.signal && curr.macd <= curr.signal) {
      api.sell({
        lotSize: this.parameters.lotSize,
        stopLossPips: this.parameters.slPips,
        takeProfitPips: this.parameters.tpPips,
        comment: 'AI MACD Bearish Cross'
      });
    }
  }
};`
      : `return {
  parameters: {
    emaFast: 9,
    emaSlow: 21,
    slPips: 20,
    tpPips: 40,
    lotSize: 0.1
  },
  onCandle(candle, indicators, account, api) {
    if (account.openPositionsCount > 0) return;
    const fast = indicators.ema(this.parameters.emaFast, 0);
    const slow = indicators.ema(this.parameters.emaSlow, 0);
    const prevFast = indicators.ema(this.parameters.emaFast, 1);
    const prevSlow = indicators.ema(this.parameters.emaSlow, 1);

    // EMA Golden Cross
    if (prevFast <= prevSlow && fast > slow) {
      api.buy({
        lotSize: this.parameters.lotSize,
        stopLossPips: this.parameters.slPips,
        takeProfitPips: this.parameters.tpPips,
        comment: 'AI EMA Golden Cross'
      });
    }
    // EMA Death Cross
    else if (prevFast >= prevSlow && fast < slow) {
      api.sell({
        lotSize: this.parameters.lotSize,
        stopLossPips: this.parameters.slPips,
        takeProfitPips: this.parameters.tpPips,
        comment: 'AI EMA Death Cross'
      });
    }
  }
};`;

    // 1. Stream reasoning tokens
    const thinkWords = thinkText.split(' ');
    for (const w of thinkWords) {
      if (signal.aborted) throw new Error('AbortError');
      onStep.onToken(w + ' ', true);
      await new Promise(r => setTimeout(r, 20));
    }

    await new Promise(r => setTimeout(r, 120));

    // 2. Stream code tokens
    const codeLines = codeText.split('\n');
    for (const line of codeLines) {
      if (signal.aborted) throw new Error('AbortError');
      onStep.onToken(line + '\n', false);
      await new Promise(r => setTimeout(r, 35));
    }
  }
}

function cleanCodeOutput(raw: string): string {
  let text = raw.trim();
  if (text.includes('```javascript')) {
    text = text.split('```javascript')[1].split('```')[0].trim();
  } else if (text.includes('```js')) {
    text = text.split('```js')[1].split('```')[0].trim();
  } else if (text.includes('```')) {
    text = text.split('```')[1].split('```')[0].trim();
  }
  const returnIdx = text.indexOf('return {');
  if (returnIdx !== -1) {
    text = text.substring(returnIdx);
  }
  return text;
}
