import React, { useRef, useEffect, useState } from 'react';
import { IChartApi, ISeriesApi, Time } from 'lightweight-charts';
import { useBacktestStore } from '../../store/backtestStore';
import { DrawingObject, DrawingPoint } from '../../types/market';

interface DrawingCanvasProps {
  chart: IChartApi | null;
  series: ISeriesApi<any> | null;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ chart, series }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<DrawingPoint[]>([]);

  const { activeTool, drawings, addDrawing, setActiveTool, instrument } = useBacktestStore();

  // Helper chuyển đổi từ Mouse Pixel sang (Time, Price)
  const pixelToCoordinates = (x: number, y: number): DrawingPoint | null => {
    if (!chart || !series) return null;
    const time = chart.timeScale().coordinateToTime(x);
    const price = series.coordinateToPrice(y);
    if (time === null || price === null) return null;
    return { time: Number(time), price };
  };

  // Helper chuyển đổi từ (Time, Price) sang Mouse Pixel (X, Y)
  const coordinatesToPixel = (pt: DrawingPoint): { x: number; y: number } | null => {
    if (!chart || !series) return null;
    const x = chart.timeScale().timeToCoordinate(pt.time as Time);
    const y = series.priceToCoordinate(pt.price);
    if (x === null || y === null) return null;
    return { x, y };
  };

  // Xử lý sự kiện chuột khi vẽ
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === 'cursor') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const pt = pixelToCoordinates(x, y);
    if (!pt) return;

    setIsDrawing(true);
    setCurrentPoints([pt, pt]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTool === 'cursor') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const pt = pixelToCoordinates(x, y);
    if (!pt) return;

    setCurrentPoints(prev => [prev[0], pt]);
  };

  const handleMouseUp = () => {
    if (!isDrawing || currentPoints.length < 2) {
      setIsDrawing(false);
      return;
    }

    const newDrawing: DrawingObject = {
      id: 'draw_' + Math.random().toString(36).substring(2, 9),
      type: activeTool,
      points: currentPoints,
      color: activeTool === 'fibonacci' ? '#a855f7' : activeTool === 'rectangle' ? 'rgba(56, 189, 248, 0.25)' : '#38bdf8',
      lineWidth: 2
    };

    addDrawing(newDrawing);
    setIsDrawing(false);
    setCurrentPoints([]);
    setActiveTool('cursor'); // Reset to cursor tool after completing drawing
  };

  // Render drawings on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !chart || !series) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to container
    canvas.width = canvas.parentElement?.clientWidth || 800;
    canvas.height = canvas.parentElement?.clientHeight || 600;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const allDrawings = [...drawings];
      if (isDrawing && currentPoints.length === 2) {
        allDrawings.push({
          id: 'temp',
          type: activeTool,
          points: currentPoints,
          color: activeTool === 'fibonacci' ? '#a855f7' : '#38bdf8',
          lineWidth: 2
        });
      }

      for (const item of allDrawings) {
        const p1 = coordinatesToPixel(item.points[0]);
        const p2 = item.points[1] ? coordinatesToPixel(item.points[1]) : null;
        if (!p1) continue;

        ctx.strokeStyle = item.color;
        ctx.lineWidth = item.lineWidth;
        ctx.fillStyle = item.color;

        // 1. TRENDLINE
        if (item.type === 'trendline' && p2) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();

          // End anchor dots
          ctx.beginPath();
          ctx.arc(p1.x, p1.y, 4, 0, Math.PI * 2);
          ctx.arc(p2.x, p2.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // 2. HORIZONTAL LINE
        else if (item.type === 'horizontal') {
          ctx.beginPath();
          ctx.setLineDash([4, 4]);
          ctx.moveTo(0, p1.y);
          ctx.lineTo(canvas.width, p1.y);
          ctx.stroke();
          ctx.setLineDash([]);

          // Price Tag Pill
          ctx.fillStyle = '#6366f1';
          ctx.fillRect(canvas.width - 70, p1.y - 10, 65, 20);
          ctx.fillStyle = '#ffffff';
          ctx.font = '11px JetBrains Mono';
          ctx.fillText(item.points[0].price.toFixed(instrument.digits), canvas.width - 65, p1.y + 4);
        }

        // 3. FIBONACCI RETRACEMENT
        else if (item.type === 'fibonacci' && p2) {
          const highPrice = Math.max(item.points[0].price, item.points[1].price);
          const lowPrice = Math.min(item.points[0].price, item.points[1].price);
          const diff = highPrice - lowPrice;

          const fibLevels = [
            { ratio: 0.0, label: '0.0% (Base)', color: '#94a3b8' },
            { ratio: 0.236, label: '23.6%', color: '#38bdf8' },
            { ratio: 0.382, label: '38.2%', color: '#34d399' },
            { ratio: 0.5, label: '50.0% (Equilibrium)', color: '#fbbf24' },
            { ratio: 0.618, label: '61.8% (Golden Pocket)', color: '#f97316' },
            { ratio: 0.786, label: '78.6%', color: '#ef4444' },
            { ratio: 1.0, label: '100.0%', color: '#94a3b8' }
          ];

          const startX = Math.min(p1.x, p2.x);
          const endX = Math.max(p1.x, p2.x) + 150;

          fibLevels.forEach((fib, idx) => {
            const levelPrice = highPrice - (diff * fib.ratio);
            const levelPt = coordinatesToPixel({ time: item.points[0].time, price: levelPrice });
            if (!levelPt) return;

            // Draw line
            ctx.strokeStyle = fib.color;
            ctx.lineWidth = fib.ratio === 0.618 || fib.ratio === 0.5 ? 2 : 1;
            ctx.setLineDash(fib.ratio === 0.5 ? [6, 3] : []);
            ctx.beginPath();
            ctx.moveTo(startX, levelPt.y);
            ctx.lineTo(endX, levelPt.y);
            ctx.stroke();

            // Level text
            ctx.fillStyle = fib.color;
            ctx.font = '10px JetBrains Mono';
            ctx.fillText(`${fib.label}: ${levelPrice.toFixed(instrument.digits)}`, startX + 5, levelPt.y - 4);
          });
          ctx.setLineDash([]);
        }

        // 4. RECTANGLE (Supply / Demand Zone)
        else if (item.type === 'rectangle' && p2) {
          const rectX = Math.min(p1.x, p2.x);
          const rectY = Math.min(p1.y, p2.y);
          const rectW = Math.abs(p2.x - p1.x);
          const rectH = Math.abs(p2.y - p1.y);

          ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
          ctx.fillRect(rectX, rectY, rectW, rectH);
          ctx.strokeStyle = '#38bdf8';
          ctx.strokeRect(rectX, rectY, rectW, rectH);
        }

        // 5. MEASURE TOOL
        else if (item.type === 'measure' && p2) {
          const pipsDiff = Math.abs((item.points[1].price - item.points[0].price) / instrument.pipSize);
          const rectX = Math.min(p1.x, p2.x);
          const rectY = Math.min(p1.y, p2.y);
          const rectW = Math.abs(p2.x - p1.x);
          const rectH = Math.abs(p2.y - p1.y);

          ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
          ctx.fillRect(rectX, rectY, rectW, rectH);
          ctx.strokeStyle = '#6366f1';
          ctx.strokeRect(rectX, rectY, rectW, rectH);

          // Measure info box
          ctx.fillStyle = '#1e1b4b';
          ctx.fillRect(p2.x, p2.y - 30, 120, 26);
          ctx.strokeStyle = '#818cf8';
          ctx.strokeRect(p2.x, p2.y - 30, 120, 26);
          ctx.fillStyle = '#e0e7ff';
          ctx.font = 'bold 11px JetBrains Mono';
          ctx.fillText(`📏 ${pipsDiff.toFixed(1)} Pips`, p2.x + 8, p2.y - 13);
        }
      }
    };

    render();

    // Lắng nghe khi biểu đồ di chuyển (scroll / zoom) để re-render canvas
    const timeScale = chart.timeScale();
    const handleVisibleTimeRangeChange = () => render();
    timeScale.subscribeVisibleTimeRangeChange(handleVisibleTimeRangeChange);

    return () => {
      timeScale.unsubscribeVisibleTimeRangeChange(handleVisibleTimeRangeChange);
    };
  }, [drawings, isDrawing, currentPoints, activeTool, chart, series, instrument]);

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`absolute inset-0 ${activeTool === 'cursor' ? 'pointer-events-none' : 'pointer-events-auto'} ${activeTool !== 'cursor' ? 'cursor-crosshair' : ''}`}
      style={{ zIndex: 15 }}
    />
  );
};
