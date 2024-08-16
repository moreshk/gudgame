import React, { useState, useEffect } from 'react';

interface CandleData {
  open: number;
  close: number;
  high: number;
  low: number;
  time: string;
}

const CandlestickChart: React.FC<{ startingPrice: number }> = ({ startingPrice = 100 }) => {
  console.log('Starting price:', startingPrice); // Debug log

  const generateCandle = (prevClose: number): CandleData => {
    const maxChange = prevClose * 0.02; // 2% maximum change
    const open = prevClose + (Math.random() - 0.5) * maxChange;
    const close = open + (Math.random() - 0.5) * maxChange;
    const high = Math.max(open, close) + Math.random() * (maxChange / 2);
    const low = Math.min(open, close) - Math.random() * (maxChange / 2);
    return { open, close, high, low, time: new Date().toLocaleTimeString() };
  };

  const [data, setData] = useState<CandleData[]>(() => {
    // Generate the first candle using the startingPrice
    return [generateCandle(startingPrice)];
  });
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
        const newCandle = generateCandle(prevData[prevData.length - 1].close);
        return [...prevData.slice(-19), newCandle]; // Keep only the last 20 candles
      });
      setCurrentCandle(null);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const growthInterval = setInterval(() => {
      setCurrentCandle(prevCandle => {
        if (!prevCandle) {
          const lastCandle = data[data.length - 1];
          return generateCandle(lastCandle.close);
        }
        const maxGrowth = prevCandle.close * 0.005; // 0.5% maximum growth
        const growth = (Math.random() - 0.5) * 2 * maxGrowth;
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
  }, [data]);

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
          const price = Math.round(maxPrice - (index * priceRange / (ticks - 1)));
          const y = scaleY(price);
          return (
            <g key={index} transform={`translate(0, ${y})`}>
              <line x2="-5" stroke="black" />
              <text x="-10" dy="0.32em" textAnchor="end">{price}</text>
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

export default CandlestickChart;