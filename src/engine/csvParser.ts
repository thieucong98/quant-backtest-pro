import Papa from 'papaparse';
import { Candle } from '../types/market';

export interface CSVParseOptions {
  maxCandles?: number;
  fromTimestamp?: number;
  toTimestamp?: number;
}

export interface CSVParseResult {
  candles: Candle[];
  totalRowsParsed: number;
  duplicatesRemoved: number;
  startTime?: number;
  endTime?: number;
  detectedTimeframe?: string;
  previewRows?: string[][];
  error?: string;
}

export class CSVDataParser {
  /**
   * Phân tích chuỗi ngày giờ nhanh không cấp phát Date Object trong vòng lặp
   * Hỗ trợ các định dạng:
   * - "2004.06.11 07:15" hoặc "2004-06-11 07:15" hoặc "2004/06/11 07:15"
   * - "2004.06.11", "07:15"
   * - Unix timestamp 10 hoặc 13 chữ số
   */
  public static parseFastTimestamp(datePart: string, timePart?: string): number {
    if (!datePart) return 0;

    // Unix timestamp 10 chữ số
    if (/^\d{10}$/.test(datePart)) {
      return parseInt(datePart, 10);
    }
    // Unix timestamp 13 chữ số (ms)
    if (/^\d{13}$/.test(datePart)) {
      return Math.floor(parseInt(datePart, 10) / 1000);
    }

    let y = 0, m = 0, d = 0, h = 0, min = 0, s = 0;

    // Trường hợp ngày giờ gộp trong datePart: "2004.06.11 07:15" hoặc "2004-06-11T07:15:00"
    if (!timePart && (datePart.includes(' ') || datePart.includes('T'))) {
      const parts = datePart.split(/[ T]/);
      datePart = parts[0];
      timePart = parts[1];
    }

    // Tách ngày yyyy-mm-dd hoặc yyyy.mm.dd hoặc yyyy/mm/dd hoặc dd/mm/yyyy
    if (datePart.includes('.') || datePart.includes('-') || datePart.includes('/')) {
      const sep = datePart.includes('.') ? '.' : datePart.includes('-') ? '-' : '/';
      const dParts = datePart.split(sep);
      if (dParts.length >= 3) {
        if (dParts[0].length === 4) {
          // YYYY-MM-DD
          y = parseInt(dParts[0], 10);
          m = parseInt(dParts[1], 10);
          d = parseInt(dParts[2], 10);
        } else if (dParts[2].length === 4) {
          // DD-MM-YYYY
          d = parseInt(dParts[0], 10);
          m = parseInt(dParts[1], 10);
          y = parseInt(dParts[2], 10);
        }
      }
    }

    // Tách giờ hh:mm:ss
    if (timePart && timePart.includes(':')) {
      const tParts = timePart.split(':');
      h = parseInt(tParts[0], 10) || 0;
      min = parseInt(tParts[1], 10) || 0;
      s = tParts.length > 2 ? parseInt(tParts[2], 10) || 0 : 0;
    }

    if (y > 1970 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return Math.floor(Date.UTC(y, m - 1, d, h, min, s) / 1000);
    }

    // Fallback nếu không khớp regex chuẩn
    const fallback = Date.parse(datePart + (timePart ? ' ' + timePart : ''));
    return isNaN(fallback) ? 0 : Math.floor(fallback / 1000);
  }

  /**
   * Phân tích nội dung CSV thành mảng Candle chuẩn với hiệu năng cao
   */
  public static parse(csvText: string, options?: CSVParseOptions): CSVParseResult {
    try {
      const trimmed = csvText.trim();
      if (!trimmed) {
        return { candles: [], totalRowsParsed: 0, duplicatesRemoved: 0, error: 'File CSV rỗng.' };
      }

      // Tự động nhận diện dấu phân cách (; hoặc , hoặc \t)
      const firstLine = trimmed.split('\n', 1)[0] || '';
      let delimiter = ',';
      if (firstLine.includes(';') && !firstLine.includes(',')) delimiter = ';';
      else if (firstLine.includes('\t')) delimiter = '\t';

      const results = Papa.parse<any>(trimmed, {
        header: false,
        skipEmptyLines: true,
        dynamicTyping: false,
        delimiter
      });

      if (!results.data || results.data.length === 0) {
        return { candles: [], totalRowsParsed: 0, duplicatesRemoved: 0, error: 'Không đọc được dữ liệu từ CSV.' };
      }

      const rows = results.data;
      const previewRows = rows.slice(0, 10);

      // Kiểm tra xem hàng đầu tiên có phải là header text không
      let startIndex = 0;
      const firstRow = rows[0];
      const isHeader = isNaN(Number(firstRow[firstRow.length - 1])) || isNaN(Number(firstRow[1]));
      if (isHeader) startIndex = 1;

      const totalRows = rows.length - startIndex;
      const rawCandles: Candle[] = [];

      for (let i = startIndex; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 5) continue;

        let timestamp = 0;
        let open = 0;
        let high = 0;
        let low = 0;
        let close = 0;
        let volume = 100;

        // Trường hợp 1: Format MT4/MT5 tách Date và Time (Ví dụ: "2024.01.02", "00:00", 1.0850, 1.0860, ...)
        if (row.length >= 6 && (row[0].includes('.') || row[0].includes('-') || row[0].includes('/')) && row[1].includes(':')) {
          timestamp = this.parseFastTimestamp(row[0], row[1]);
          open = parseFloat(row[2]);
          high = parseFloat(row[3]);
          low = parseFloat(row[4]);
          close = parseFloat(row[5]);
          volume = row.length > 6 ? parseFloat(row[6]) : 100;
        }
        // Trường hợp 2: Date + Time gộp ở cột 0 (Ví dụ: "2004.06.11 07:15", 384, 384.1, 384, 384, 3)
        else {
          timestamp = this.parseFastTimestamp(row[0]);
          open = parseFloat(row[1]);
          high = parseFloat(row[2]);
          low = parseFloat(row[3]);
          close = parseFloat(row[4]);
          volume = row.length > 5 ? parseFloat(row[5]) : 100;
        }

        if (timestamp > 0 && !isNaN(open) && !isNaN(high) && !isNaN(low) && !isNaN(close)) {
          // Lọc theo khoảng ngày nếu có
          if (options?.fromTimestamp && timestamp < options.fromTimestamp) continue;
          if (options?.toTimestamp && timestamp > options.toTimestamp) continue;

          rawCandles.push({
            timestamp,
            open,
            high,
            low,
            close,
            volume: isNaN(volume) ? 100 : volume
          });
        }
      }

      if (rawCandles.length === 0) {
        return {
          candles: [],
          totalRowsParsed: totalRows,
          duplicatesRemoved: 0,
          previewRows,
          error: 'Không tìm thấy dòng nến hợp lệ với giá Open/High/Low/Close.'
        };
      }

      // Sắp xếp theo timestamp tăng dần
      rawCandles.sort((a, b) => a.timestamp - b.timestamp);

      // Loại bỏ nến trùng lặp
      const uniqueCandles: Candle[] = [];
      let duplicatesCount = 0;
      for (const c of rawCandles) {
        if (uniqueCandles.length === 0 || uniqueCandles[uniqueCandles.length - 1].timestamp !== c.timestamp) {
          uniqueCandles.push(c);
        } else {
          duplicatesCount++;
        }
      }

      // Giới hạn số lượng nến nếu người dùng yêu cầu (lấy N nến gần nhất)
      let finalCandles = uniqueCandles;
      if (options?.maxCandles && options.maxCandles > 0 && finalCandles.length > options.maxCandles) {
        finalCandles = finalCandles.slice(finalCandles.length - options.maxCandles);
      }

      // Nhận diện Timeframe cơ sở từ khoảng cách giữa các nến
      let detectedTimeframe = 'M1';
      if (finalCandles.length >= 2) {
        const diffSec = finalCandles[1].timestamp - finalCandles[0].timestamp;
        if (diffSec === 60) detectedTimeframe = 'M1';
        else if (diffSec === 300) detectedTimeframe = 'M5';
        else if (diffSec === 900) detectedTimeframe = 'M15';
        else if (diffSec === 1800) detectedTimeframe = 'M30';
        else if (diffSec === 3600) detectedTimeframe = 'H1';
        else if (diffSec === 14400) detectedTimeframe = 'H4';
        else if (diffSec === 86400) detectedTimeframe = 'D1';
        else detectedTimeframe = `${Math.round(diffSec / 60)}m`;
      }

      return {
        candles: finalCandles,
        totalRowsParsed: totalRows,
        duplicatesRemoved: duplicatesCount,
        startTime: finalCandles[0]?.timestamp,
        endTime: finalCandles[finalCandles.length - 1]?.timestamp,
        detectedTimeframe,
        previewRows
      };
    } catch (err: any) {
      return {
        candles: [],
        totalRowsParsed: 0,
        duplicatesRemoved: 0,
        error: err.message || 'Lỗi khi parse file CSV.'
      };
    }
  }
}
