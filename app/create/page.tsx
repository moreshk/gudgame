'use client'

import React, { useState, useEffect } from 'react';

interface CandleData {
  open: number;
  close: number;
  high: number;
  low: number;
  time: string;
}

const CandlestickChart: React.FC<{ startingPrice: number }> = ({ startingPrice = 100 }) => {
  const [data, setData] = useState<CandleData[]>([]);
  const [currentCandle, setCurrentCandle] = useState<CandleData | null>(null);
  const [currentPrice, setCurrentPrice] = useState(startingPrice);

  const chartWidth = 600;
  const chartHeight = 300;
  const margin = { top: 20, right: 30, bottom: 30, left: 40 };
  const width = chartWidth - margin.left - margin.right;
  const height = chartHeight - margin.top - margin.bottom;

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prevData => {
        const newCandle = generateCandle(prevData[prevData.length - 1]?.close || startingPrice);
        return [...prevData.slice(-19), newCandle]; // Keep only the last 20 candles
      });
      setCurrentCandle(null);
    }, 5000);

    return () => clearInterval(interval);
  }, [startingPrice]);

  useEffect(() => {
    const growthInterval = setInterval(() => {
      setCurrentCandle(prevCandle => {
        if (!prevCandle) {
          const lastCandle = data[data.length - 1];
          return generateCandle(lastCandle?.close || startingPrice);
        }
        const growth = (Math.random() - 0.5) * 2;
        const newClose = prevCandle.close + growth;
        setCurrentPrice(newClose);
        return {
          ...prevCandle,
          close: newClose,
          high: Math.max(prevCandle.high, newClose),
          low: Math.min(prevCandle.low, newClose),
        };
      });
    }, 100);

    return () => clearInterval(growthInterval);
  }, [data, startingPrice]);

  const generateCandle = (prevClose: number): CandleData => {
    const open = prevClose + (Math.random() - 0.5) * 5;
    const close = open + (Math.random() - 0.5) * 5;
    const high = Math.max(open, close) + Math.random() * 2;
    const low = Math.min(open, close) - Math.random() * 2;
    return { open, close, high, low, time: new Date().toLocaleTimeString() };
  };

  const allCandles = [...data, currentCandle].filter(Boolean) as CandleData[];

  const minPrice = Math.min(...allCandles.map(c => c.low));
  const maxPrice = Math.max(...allCandles.map(c => c.high));
  const priceRange = maxPrice - minPrice;

  const scaleY = (price: number) => height - ((price - minPrice) / priceRange) * height;
  const candleWidth = width / 20;  // 20 candles fit in the chart

  const renderCandle = (candle: CandleData, index: number) => {
    if (!candle) return null;

    const x = index * candleWidth;
    const y = scaleY(Math.max(candle.open, candle.close));
    const candleHeight = Math.abs(scaleY(candle.open) - scaleY(candle.close));

    return (
      <g key={index}>
        <line
          x1={x + candleWidth / 2}
          y1={scaleY(candle.high)}
          x2={x + candleWidth / 2}
          y2={scaleY(candle.low)}
          stroke="black"
          strokeWidth="1"
        />
        <rect
          x={x}
          y={y}
          width={candleWidth}
          height={candleHeight || 1}  // Ensure minimum height of 1
          fill={candle.open > candle.close ? "red" : "green"}
        />
      </g>
    );
  };

  const renderXAxis = () => (
    <g transform={`translate(0, ${height})`}>
      <line x1="0" y1="0" x2={width} y2="0" stroke="black" />
      {allCandles.map((_, index) => (
        <g key={index} transform={`translate(${index * candleWidth}, 0)`}>
          <line y2="5" stroke="black" />
          <text y="20" textAnchor="middle">{index + 1}</text>
        </g>
      ))}
    </g>
  );

  const renderYAxis = () => {
    const ticks = 5;
    return (
      <g>
        <line x1="0" y1="0" x2="0" y2={height} stroke="black" />
        {[...Array(ticks)].map((_, index) => {
          const y = (height / (ticks - 1)) * index;
          const price = maxPrice - (index * priceRange / (ticks - 1));
          return (
            <g key={index} transform={`translate(0, ${y})`}>
              <line x2="-5" stroke="black" />
              <text x="-10" y="5" textAnchor="end">{price.toFixed(2)}</text>
            </g>
          );
        })}
      </g>
    );
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Live Candlestick Chart (Current Price: ${currentPrice.toFixed(2)})
      </h2>
      <svg width={chartWidth} height={chartHeight} className="mx-auto">
        <g transform={`translate(${margin.left},${margin.top})`}>
          {allCandles.map(renderCandle)}
          {renderXAxis()}
          {renderYAxis()}
        </g>
      </svg>
    </div>
  );
};

export default function CreatePage() {
  const [startingPrice, setStartingPrice] = useState(100);

  const handleStartingPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartingPrice(Number(e.target.value));
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-900">Interactive Candlestick Chart</h1>
      
      <div className="mb-6">
        <label htmlFor="startingPrice" className="block text-sm font-medium text-gray-700">Starting Price</label>
        <input
          type="number"
          id="startingPrice"
          value={startingPrice}
          onChange={handleStartingPriceChange}
          min="1"
          step="0.01"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
        />
      </div>

      <CandlestickChart startingPrice={startingPrice} />
    </div>
  );
}