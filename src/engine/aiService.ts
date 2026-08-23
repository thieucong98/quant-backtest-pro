import { Candle } from '../types/market';
import { IndicatorLibrary } from '../types/strategy';

export type AIProvider = 'custom' | 'openai' | 'gemini' | 'deepseek' | 'claude' | 'ollama' | 'builtin';

export interface LLMConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
  temperature: number;
}

export const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: 'custom',
  apiKey: 'sk-bd86ea7ea3f6f5b9-6fcxtf-3941c578',
  model: 'ag/gemini-pro-agent',
  baseUrl: 'https://r5yym74.abc-tunnel.us/v1',
  temperature: 0.2
};

export const AI_PROVIDER_MODELS: Record<AIProvider, { name: string; models: string[]; defaultBaseUrl?: string; placeholder?: string }> = {
  custom: {
    name: 'Custom OpenAI-Compatible API / Reverse Proxy Tunnel',
    models: ['ag/gemini-pro-agent', 'gpt-4o', 'claude-3-5-sonnet', 'deepseek-chat', 'gemini-1.5-pro'],
    defaultBaseUrl: 'https://r5yym74.abc-tunnel.us/v1',
    placeholder: 'e.g. ag/gemini-pro-agent'
  },
  openai: {
    name: 'OpenAI / OpenRouter / Groq',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1-mini', 'meta-llama/llama-3.3-70b-instruct'],
    defaultBaseUrl: 'https://api.openai.com/v1'
  },
  gemini: {
    name: 'Google Gemini Official API',
    models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp']
  },
  deepseek: {
    name: 'DeepSeek Official AI',
    models: ['deepseek-chat', 'deepseek-coder'],
    defaultBaseUrl: 'https://api.deepseek.com/v1'
  },
  claude: {
    name: 'Anthropic Claude Official',
    models: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
    defaultBaseUrl: 'https://api.anthropic.com/v1'
  },
  ollama: {
    name: 'Ollama Local LLM (Chạy trên máy tính cá nhân)',
    models: ['llama3.2', 'deepseek-coder-v2', 'qwen2.5-coder', 'mistral'],
    defaultBaseUrl: 'http://localhost:11434'
  },
  builtin: {
    name: 'Built-in Quant AI Synthesizer (Offline - Miễn phí)',
    models: ['quant-rule-engine-v2']
  }
};

const SYSTEM_PROMPT = `Bạn là một Chuyên gia Lập trình Thuật toán Giao dịch Định lượng (Quant Strategy Developer) hàng đầu thế giới cho nền tảng Quant Backtest Pro.
Nhiệm vụ của bạn là nhận mô tả chiến lược từ người dùng và tạo ra mã nguồn JavaScript chính xác 100%, tuân thủ cấu trúc sau:

\`\`\`javascript
return {
  parameters: {
    // các tham số tùy chỉnh với giá trị mặc định hợp lý
    emaPeriod: 50,
    rsiPeriod: 14,
    slPips: 20,
    tpPips: 40,
    lotSize: 0.1
  },

  onCandle(candle, indicators, account, api) {
    // 1. Tính toán chỉ báo qua thư viện indicators:
    // indicators.sma(period, source='close')
    // indicators.ema(period, source='close')
    // indicators.rsi(period, source='close')
    // indicators.macd(fast, slow, signal, source='close') -> { macd, signal, histogram }
    // indicators.bollingerBands(period, stdDev, source='close') -> { upper, middle, lower }
    // indicators.atr(period)
    // indicators.highest(period)
    // indicators.lowest(period)

    // 2. Kiểm tra điều kiện quản trị vị thế:
    if (account.openPositionsCount > 0) return; // hoặc quản trị nhiều lệnh

    // 3. Logic vào lệnh:
    // api.buy({ lotSize, stopLossPips, takeProfitPips, trailingStopPips, comment })
    // api.sell({ lotSize, stopLossPips, takeProfitPips, trailingStopPips, comment })
    // api.closeAll()
    // api.closePosition(id)
    // api.modifySLTP(id, sl, tp)
    // api.log(message)
  }
};
\`\`\`

QUY TẮC BẮT BUỘC:
- CHỈ TRẢ VỀ DUY NHẤT ĐOẠN CODE JAVASCRIPT BẮT ĐẦU BẰNG "return {" VÀ KẾT THÚC BẰNG "};". KHÔNG GIẢI THÍCH DÀI DÒNG BÊN NGOÀI.
- Không sử dụng các biến ngoài hoặc các hàm không có trong context.
- Luôn đặt Stop Loss và Take Profit an toàn.`;

export class AIService {
  /**
   * Kiểm tra kết nối tới nhà cung cấp LLM với latency thực tế
   */
  public static async testConnection(config: LLMConfig): Promise<{
    success: boolean;
    latencyMs: number;
    message: string;
    model: string;
  }> {
    if (config.provider === 'builtin') {
      return {
        success: true,
        latencyMs: 1,
        message: 'Built-in Offline Synthesizer đang sẵn sàng.',
        model: 'quant-rule-engine-v2'
      };
    }

    if (!config.apiKey?.trim() && config.provider !== 'ollama') {
      throw new Error('Vui lòng nhập API Key trước khi kiểm tra kết nối.');
    }

    const startTime = Date.now();

    // 1. Custom / OpenAI / DeepSeek Compatible
    if (config.provider === 'custom' || config.provider === 'openai' || config.provider === 'deepseek') {
      const baseUrl = config.baseUrl || AI_PROVIDER_MODELS[config.provider]?.defaultBaseUrl || 'https://api.openai.com/v1';
      const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;

      let res: Response;
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey.trim()}`
          },
          body: JSON.stringify({
            model: config.model || 'ag/gemini-pro-agent',
            messages: [{ role: 'user', content: 'Ping. Reply OK in 1 word.' }],
            max_tokens: 100,
            stream: false
          })
        });
      } catch (networkErr: any) {
        throw new Error(`Không thể kết nối tới ${url}. Chi tiết: ${networkErr.message}`);
      }

      const latencyMs = Date.now() - startTime;

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = err?.error?.message || err?.message || `HTTP ${res.status}: ${res.statusText}`;
        throw new Error(`Lỗi từ máy chủ (${res.status}): ${msg}`);
      }

      const data = await res.json();
      return {
        success: true,
        latencyMs,
        message: `Kết nối thành công tới ${config.model || data?.model} (${latencyMs}ms)`,
        model: data?.model || config.model
      };
    }

    // 2. Google Gemini API
    if (config.provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model || 'gemini-1.5-flash'}:generateContent?key=${config.apiKey.trim()}`;
      let res: Response;
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Ping. Reply OK in 1 word.' }] }],
            generationConfig: { maxOutputTokens: 10 }
          })
        });
      } catch (networkErr: any) {
        throw new Error(`Không thể kết nối Gemini API. Chi tiết: ${networkErr.message}`);
      }

      const latencyMs = Date.now() - startTime;
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Lỗi Gemini (${res.status}): ${err?.error?.message || res.statusText}`);
      }

      return {
        success: true,
        latencyMs,
        message: `Kết nối thành công tới ${config.model} (${latencyMs}ms)`,
        model: config.model
      };
    }

    // 3. Anthropic Claude API
    if (config.provider === 'claude') {
      const baseUrl = config.baseUrl || 'https://api.anthropic.com/v1';
      const url = `${baseUrl.replace(/\/+$/, '')}/messages`;
      let res: Response;
      try {
        res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': config.apiKey.trim(),
            'anthropic-version': '2023-06-01',
            'dangerously-allow-browser': 'true'
          },
          body: JSON.stringify({
            model: config.model || 'claude-3-5-haiku-20241022',
            messages: [{ role: 'user', content: 'Ping' }],
            max_tokens: 10
          })
        });
      } catch (networkErr: any) {
        throw new Error(`Không thể kết nối Claude API. Chi tiết: ${networkErr.message}`);
      }

      const latencyMs = Date.now() - startTime;
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Lỗi Claude (${res.status}): ${err?.error?.message || res.statusText}`);
      }

      return {
        success: true,
        latencyMs,
        message: `Kết nối thành công tới ${config.model} (${latencyMs}ms)`,
        model: config.model
      };
    }

    // 4. Ollama Local
    if (config.provider === 'ollama') {
      const baseUrl = config.baseUrl || 'http://localhost:11434';
      const url = `${baseUrl.replace(/\/+$/, '')}/api/tags`;
      let res: Response;
      try {
        res = await fetch(url);
      } catch (networkErr: any) {
        throw new Error(`Không thể kết nối tới Ollama tại ${baseUrl}. Vui lòng chạy 'ollama serve'.`);
      }

      const latencyMs = Date.now() - startTime;
      if (!res.ok) {
        throw new Error(`Ollama trả về mã lỗi HTTP ${res.status}`);
      }

      return {
        success: true,
        latencyMs,
        message: `Kết nối thành công tới Ollama Local (${latencyMs}ms)`,
        model: config.model || 'llama3.2'
      };
    }

    return {
      success: true,
      latencyMs: 1,
      message: 'Offline synthesizer ready',
      model: 'builtin'
    };
  }

  /**
   * Gọi LLM API hoặc Built-in Rule Engine để sinh code chiến lược
   */
  public static async generateStrategy(
    prompt: string,
    config: LLMConfig,
    symbol: string
  ): Promise<{ name: string; description: string; code: string }> {
    if (!prompt.trim()) {
      throw new Error('Vui lòng nhập mô tả chiến lược.');
    }

    // 1. Built-in Offline Synthesizer
    if (config.provider === 'builtin') {
      return this.synthesizeBuiltIn(prompt, symbol);
    }

    // Yêu cầu API Key nếu không phải Ollama hoặc Builtin
    if (!config.apiKey?.trim() && config.provider !== 'ollama') {
      throw new Error(`Bạn chưa nhập API Key cho ${AI_PROVIDER_MODELS[config.provider]?.name || config.provider}. Vui lòng vào tab "Cấu Hình LLM" để nhập.`);
    }

    // 2. Google Gemini API
    if (config.provider === 'gemini') {
      return this.callGemini(prompt, config, symbol);
    }

    // 3. Custom / OpenAI / DeepSeek / Compatible
    if (config.provider === 'custom' || config.provider === 'openai' || config.provider === 'deepseek') {
      return this.callOpenAICompatible(prompt, config, symbol);
    }

    // 4. Anthropic Claude API
    if (config.provider === 'claude') {
      return this.callClaude(prompt, config, symbol);
    }

    // 5. Local Ollama API
    if (config.provider === 'ollama') {
      return this.callOllama(prompt, config, symbol);
    }

    return this.synthesizeBuiltIn(prompt, symbol);
  }

  /**
   * Trình phân tích NLP & Sinh thuật toán Offline thông minh (Không cần API Key)
   */
  private static synthesizeBuiltIn(prompt: string, symbol: string): { name: string; description: string; code: string } {
    const lower = prompt.toLowerCase();
    let name = 'Chiến Lược AI: ' + prompt.slice(0, 35);
    let desc = `Chiến lược định lượng tự động tối ưu cho ${symbol} dựa trên yêu cầu: "${prompt}"`;

    let useEMA = lower.includes('ema') || lower.includes('ma') || lower.includes('trung bình') || lower.includes('trend');
    let useRSI = lower.includes('rsi') || lower.includes('quá mua') || lower.includes('quá bán') || lower.includes('pullback');
    let useBB = lower.includes('bollinger') || lower.includes('dải') || lower.includes('bands');
    let useMACD = lower.includes('macd');
    let useBreakout = lower.includes('breakout') || lower.includes('phá vỡ') || lower.includes('đỉnh') || lower.includes('đáy');

    // Mặc định kết hợp EMA + RSI nếu prompt chung chung
    if (!useEMA && !useRSI && !useBB && !useMACD && !useBreakout) {
      useEMA = true;
      useRSI = true;
    }

    let code = `// AI Quantitative Strategy for ${symbol}\n// Tự động sinh từ NLP Prompt: "${prompt}"\nreturn {\n  parameters: {\n`;

    if (useEMA) code += `    emaFast: 20,\n    emaSlow: 50,\n`;
    if (useRSI) code += `    rsiPeriod: 14,\n    rsiBuyThreshold: 45,\n    rsiSellThreshold: 55,\n`;
    if (useBB) code += `    bbPeriod: 20,\n    bbStdDev: 2,\n`;
    if (useMACD) code += `    macdFast: 12,\n    macdSlow: 26,\n    macdSignal: 9,\n`;
    if (useBreakout) code += `    breakoutPeriod: 20,\n`;

    code += `    slPips: 25,\n    tpPips: 50,\n    lotSize: 0.1\n  },\n\n  onCandle(candle, indicators, account, api) {\n`;

    if (useEMA) {
      code += `    const emaFast = indicators.ema(this.parameters.emaFast);\n    const emaSlow = indicators.ema(this.parameters.emaSlow);\n`;
    }
    if (useRSI) {
      code += `    const rsi = indicators.rsi(this.parameters.rsiPeriod);\n`;
    }
    if (useBB) {
      code += `    const bb = indicators.bollingerBands(this.parameters.bbPeriod, this.parameters.bbStdDev);\n`;
    }
    if (useMACD) {
      code += `    const macd = indicators.macd(this.parameters.macdFast, this.parameters.macdSlow, this.parameters.macdSignal);\n`;
    }
    if (useBreakout) {
      code += `    const highestHigh = indicators.highest(this.parameters.breakoutPeriod);\n    const lowestLow = indicators.lowest(this.parameters.breakoutPeriod);\n`;
    }

    code += `\n    // Không mở lệnh mới nếu đã có vị thế mở\n    if (account.openPositionsCount > 0) return;\n\n`;

    // Logic BUY
    code += `    // 1. TÍN HIỆU MUA (BUY SIGNAL)\n    let buySignal = false;\n`;
    if (useEMA && useRSI) {
      code += `    if (candle.close > emaFast && emaFast > emaSlow && rsi < this.parameters.rsiBuyThreshold) {\n      buySignal = true;\n    }\n`;
    } else if (useBB) {
      code += `    if (candle.low <= bb.lower && candle.close > bb.lower) {\n      buySignal = true;\n    }\n`;
    } else if (useBreakout) {
      code += `    if (candle.close > highestHigh) {\n      buySignal = true;\n    }\n`;
    } else {
      code += `    if (candle.close > emaFast) {\n      buySignal = true;\n    }\n`;
    }

    code += `    if (buySignal) {\n      api.buy({\n        lotSize: this.parameters.lotSize,\n        stopLossPips: this.parameters.slPips,\n        takeProfitPips: this.parameters.tpPips,\n        comment: 'AI BUY: ' + candle.close\n      });\n      api.log('[AI SIGNAL] Mở vị thế BUY @ ' + candle.close);\n      return;\n    }\n\n`;

    // Logic SELL
    code += `    // 2. TÍN HIỆU BÁN (SELL SIGNAL)\n    let sellSignal = false;\n`;
    if (useEMA && useRSI) {
      code += `    if (candle.close < emaFast && emaFast < emaSlow && rsi > this.parameters.rsiSellThreshold) {\n      sellSignal = true;\n    }\n`;
    } else if (useBB) {
      code += `    if (candle.high >= bb.upper && candle.close < bb.upper) {\n      sellSignal = true;\n    }\n`;
    } else if (useBreakout) {
      code += `    if (candle.close < lowestLow) {\n      sellSignal = true;\n    }\n`;
    } else {
      code += `    if (candle.close < emaFast) {\n      sellSignal = true;\n    }\n`;
    }

    code += `    if (sellSignal) {\n      api.sell({\n        lotSize: this.parameters.lotSize,\n        stopLossPips: this.parameters.slPips,\n        takeProfitPips: this.parameters.tpPips,\n        comment: 'AI SELL: ' + candle.close\n      });\n      api.log('[AI SIGNAL] Mở vị thế SELL @ ' + candle.close);\n    }\n  }\n};`;

    return { name, description: desc, code };
  }

  /**
   * Gọi Google Gemini API
   */
  private static async callGemini(prompt: string, config: LLMConfig, symbol: string) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model || 'gemini-1.5-flash'}:generateContent?key=${config.apiKey.trim()}`;
    const fullUserPrompt = `${SYSTEM_PROMPT}\n\nTài sản giao dịch: ${symbol}\nYêu cầu chiến lược của Trader: "${prompt}"`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: fullUserPrompt }] }],
        generationConfig: {
          temperature: config.temperature || 0.2
        }
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Lỗi kết nối Gemini API (${res.status})`);
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanCode = this.extractCode(rawText);

    return {
      name: 'Gemini Strategy: ' + prompt.slice(0, 30),
      description: `Chiến lược được tạo bởi ${config.model} cho ${symbol}`,
      code: cleanCode
    };
  }

  /**
   * Gọi OpenAI / Custom / DeepSeek / Compatible REST API
   */
  private static async callOpenAICompatible(prompt: string, config: LLMConfig, symbol: string) {
    const baseUrl = config.baseUrl || AI_PROVIDER_MODELS[config.provider]?.defaultBaseUrl || 'https://api.openai.com/v1';
    const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey.trim()}`
      },
      body: JSON.stringify({
        model: config.model || 'ag/gemini-pro-agent',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Tài sản: ${symbol}\nMô tả chiến lược: ${prompt}` }
        ],
        stream: false,
        max_tokens: 3000,
        temperature: config.temperature || 0.2
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || err?.message || `Lỗi API (${res.status} ${res.statusText})`);
    }

    const data = await res.json();
    const rawText = data?.choices?.[0]?.message?.content || '';
    const cleanCode = this.extractCode(rawText);

    return {
      name: `${config.model} Strategy: ` + prompt.slice(0, 25),
      description: `Chiến lược sinh bởi ${config.model} cho ${symbol}`,
      code: cleanCode
    };
  }

  /**
   * Gọi Anthropic Claude API
   */
  private static async callClaude(prompt: string, config: LLMConfig, symbol: string) {
    const baseUrl = config.baseUrl || 'https://api.anthropic.com/v1';
    const url = `${baseUrl.replace(/\/+$/, '')}/messages`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey.trim(),
        'anthropic-version': '2023-06-01',
        'dangerously-allow-browser': 'true'
      },
      body: JSON.stringify({
        model: config.model || 'claude-3-5-sonnet-20241022',
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `Tài sản: ${symbol}\nYêu cầu: ${prompt}` }],
        max_tokens: 3000,
        temperature: config.temperature || 0.2
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Lỗi Claude API (${res.status})`);
    }

    const data = await res.json();
    const rawText = data?.content?.[0]?.text || '';
    const cleanCode = this.extractCode(rawText);

    return {
      name: 'Claude Strategy: ' + prompt.slice(0, 25),
      description: `Chiến lược sinh bởi Claude 3.5 cho ${symbol}`,
      code: cleanCode
    };
  }

  /**
   * Gọi Local Ollama REST API
   */
  private static async callOllama(prompt: string, config: LLMConfig, symbol: string) {
    const baseUrl = config.baseUrl || 'http://localhost:11434';
    const url = `${baseUrl.replace(/\/+$/, '')}/api/generate`;

    const fullPrompt = `${SYSTEM_PROMPT}\n\nTài sản: ${symbol}\nMô tả chiến lược: ${prompt}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model || 'llama3.2',
        prompt: fullPrompt,
        stream: false
      })
    });

    if (!res.ok) {
      throw new Error(`Không thể kết nối đến Ollama tại ${baseUrl}. Vui lòng kiểm tra lệnh 'ollama serve'.`);
    }

    const data = await res.json();
    const rawText = data?.response || '';
    const cleanCode = this.extractCode(rawText);

    return {
      name: `Ollama (${config.model}): ` + prompt.slice(0, 20),
      description: `Chiến lược sinh cục bộ bởi Ollama (${config.model})`,
      code: cleanCode
    };
  }

  /**
   * Helper trích xuất phần code JavaScript từ phản hồi của LLM
   */
  private static extractCode(raw: string): string {
    let text = raw.trim();

    // Loại bỏ markdown code fence ```javascript hoặc ```
    if (text.includes('```javascript')) {
      text = text.split('```javascript')[1].split('```')[0].trim();
    } else if (text.includes('```js')) {
      text = text.split('```js')[1].split('```')[0].trim();
    } else if (text.includes('```')) {
      text = text.split('```')[1].split('```')[0].trim();
    }

    if (!text.startsWith('return')) {
      const returnIndex = text.indexOf('return {');
      if (returnIndex !== -1) {
        text = text.substring(returnIndex);
      }
    }

    return text;
  }
}
