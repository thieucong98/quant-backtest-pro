import Papa from 'papaparse';
import { Candle } from '../types/market';

export class CSVDataParser {
  /**
   * Phân tích nội dung CSV thành mảng Candle chuẩn
   */
  public static parse(csvText: string): { candles: Candle[]; error?: string } {
    try {
      const results = Papa.parse<any>(csvText.trim(), {
        header: false,
        skipEmptyLines: true,
        dynamicTyping: false
      });

      if (!results.data || results.data.length === 0) {
        return { candles: [], error: 'File CSV rỗng hoặc không đúng định dạng.' };
      }

      const rows = results.data;
      const candles: Candle[] = [];

      // Kiểm tra xem hàng đầu tiên có phải là header text không
      let startIndex = 0;
      const firstRow = rows[0];
      const isHeader = isNaN(Number(firstRow[firstRow.length - 1])) || isNaN(Date.parse(firstRow[0]));
      if (isHeader) startIndex = 1;

      for (let i = startIndex; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 5) continue;

        let timestamp = 0;
        let open = 0;
        let high = 0;
        let low = 0;
        let close = 0;
        let volume = 0;

        // Trường hợp 1: Format MT4/MT5 tách Date và Time (Ví dụ: "2024.01.02", "00:00", 1.0850, 1.0860, ...)
        if (row.length >= 6 && (row[0].includes('.') || row[0].includes('-')) && row[1].includes(':')) {
          const dateStr = row[0].replace(/\./g, '-');
          const timeStr = row[1];
          timestamp = Math.floor(new Date(`${dateStr}T${timeStr}Z`).getTime() / 1000);
          open = parseFloat(row[2]);
          high = parseFloat(row[3]);
          low = parseFloat(row[4]);
          close = parseFloat(row[5]);
          volume = row.length > 6 ? parseFloat(row[6]) : 100;
        } 
        // Trường hợp 2: Timestamp Unix hoặc ISO datetime gộp ở cột 0
        else {
          const col0 = row[0].toString();
          if (/^\d{10}$/.test(col0)) {
            timestamp = parseInt(col0, 10);
          } else if (/^\d{13}$/.test(col0)) {
            timestamp = Math.floor(parseInt(col0, 10) / 1000);
          } else {
            timestamp = Math.floor(new Date(col0).getTime() / 1000);
          }

          open = parseFloat(row[1]);
          high = parseFloat(row[2]);
          low = parseFloat(row[3]);
          close = parseFloat(row[4]);
          volume = row.length > 5 ? parseFloat(row[5]) : 100;
        }

        if (!isNaN(timestamp) && !isNaN(open) && !isNaN(high) && !isNaN(low) && !isNaN(close)) {
          candles.push({
            timestamp,
            open,
            high,
            low,
            close,
            volume: isNaN(volume) ? 100 : volume
          });
        }
      }

      // Sắp xếp theo timestamp tăng dần và loại bỏ nến trùng
      candles.sort((a, b) => a.timestamp - b.timestamp);
      const uniqueCandles: Candle[] = [];
      for (const c of candles) {
        if (uniqueCandles.length === 0 || uniqueCandles[uniqueCandles.length - 1].timestamp !== c.timestamp) {
          uniqueCandles.push(c);
        }
      }

      return { candles: uniqueCandles };
    } catch (err: any) {
      return { candles: [], error: err.message || 'Lỗi khi parse file CSV.' };
    }
  }
}
