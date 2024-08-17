import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
interface CandleData {
  open: number;
  close: number;
  high: number;
  low: number;
  time: string;
}

// const CandlestickChart: React.FC<{ startingPrice: number }> = ({ startingPrice = 100 }) => {
const CandlestickChart: React.FC<{
  startingPrice: number;
  volatility: number;
  trend: number;
  rng: number;
}> = ({ startingPrice = 100, volatility = 0.02, trend = 0, rng = 1000 }) => {
  const [isLaunched, setIsLaunched] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const rocketRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<CandleData[]>([]);
  const [currentCandle, setCurrentCandle] = useState<CandleData | null>(null);
  const [currentPrice, setCurrentPrice] = useState(startingPrice);
  const [randomNumber, setRandomNumber] = useState(0);

  const chartWidth = 600;
  const chartHeight = 300;
  const margin = { top: 20, right: 30, bottom: 30, left: 40 };
  const width = chartWidth - margin.left - margin.right;
  const height = chartHeight - margin.top - margin.bottom;

  const generateCandle = useCallback(
    (prevClose: number): CandleData => {
      const maxChange = prevClose * volatility;
      const trendBias = trend * maxChange * 0.5;
      const randomFactor = Math.random() - 0.5;

      const change =
        trendBias + randomFactor * maxChange * (1 + Math.abs(trend));

      const open = prevClose;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * (maxChange / 2);
      const low = Math.min(open, close) - Math.random() * (maxChange / 2);

      return { open, close, high, low, time: new Date().toLocaleTimeString() };
    },
    [volatility, trend]
  );

  useEffect(() => {
    if (!isLaunched) return;

    const interval = setInterval(() => {
      setData((prevData) => {
        const newCandle = generateCandle(
          prevData.length ? prevData[prevData.length - 1].close : startingPrice
        );
        setRandomNumber(Math.floor(Math.random() * (rng + 1)));
        return [...prevData.slice(-19), newCandle];
       
      });
      setCurrentCandle(null);
    }, 5000);

    return () => clearInterval(interval);
  }, [isLaunched, startingPrice, generateCandle, rng]);

  useEffect(() => {
    if (!isLaunched) return;

    const growthInterval = setInterval(() => {
      setCurrentCandle((prevCandle) => {
        if (!prevCandle) {
          const lastCandle = data[data.length - 1] || { close: startingPrice };
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
  }, [data, isLaunched, startingPrice, generateCandle]);

  const allCandles = [...data, currentCandle].filter(Boolean) as CandleData[];

  const minPrice = Math.min(...allCandles.map((c) => c.low));
  const maxPrice = Math.max(...allCandles.map((c) => c.high));
  const priceRange = maxPrice - minPrice;

  const scaleY = (price: number) =>
    height - ((price - minPrice) / priceRange) * height;
  const candleWidth = width / 20; // 20 candles fit in the chart

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
          height={candleHeight || 1} // Ensure minimum height of 1
          fill={candle.open > candle.close ? "red" : "green"}
        />
      </g>
    );
  };

  const renderXAxis = () => (
    <g transform={`translate(0, ${height})`}>
      <line x1="0" y1="0" x2={width} y2="0" stroke="white" />
      {allCandles.map((_, index) => (
        <g key={index} transform={`translate(${index * candleWidth}, 0)`}>
          <line y2="5" stroke="white" />
          <text y="20" textAnchor="middle" fill="white">
            {index + 1}
          </text>
        </g>
      ))}
    </g>
  );

  const renderYAxis = () => {
    const ticks = 5;
    return (
      <g>
        <line x1="0" y1="0" x2="0" y2={height} stroke="white" />
        {[...Array(ticks)].map((_, index) => {
          const price = Math.round(
            maxPrice - (index * priceRange) / (ticks - 1)
          );
          const y = scaleY(price);
          return (
            <g key={index} transform={`translate(0, ${y})`}>
              <line x2="-5" stroke="white" />
              <text x="-10" dy="0.32em" textAnchor="end" fill="white">
                {price}
              </text>
            </g>
          );
        })}
      </g>
    );
  };

  const handleLaunch = () => {
    setIsAnimating(true);
    if (rocketRef.current) {
      rocketRef.current.style.transform = "translateY(-100vh)";
      rocketRef.current.style.transition = "transform 1s ease-in";
    }
    setTimeout(() => {
      setIsLaunched(true);
      setData([generateCandle(startingPrice)]);
    }, 1000);
  };

  return (
    <div className="p-4">
      {!isLaunched ? (
        <div className="flex justify-center items-center h-[300px]">
          <div
            ref={rocketRef}
            className={`transition-transform duration-1000 ${
              isAnimating ? "ease-in" : ""
            }`}
          >
            <button
              onClick={handleLaunch}
              className={`w-32 h-32 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 transition-all duration-200 transform hover:scale-105 ${
                isAnimating ? "bg-transparent" : "bg-blue-500 hover:bg-blue-700"
              }`}
              aria-label="Launch Meme Coin"
              disabled={isAnimating}
            >
              <Image
                src="/rocket-logo.png"
                alt="Rocket"
                width={80}
                height={80}
              />
            </button>
          </div>
        </div>
      ) : (
        <>
          <h2 className="text-2xl font-bold mb-4 text-white">
            Live Candlestick Chart (Current Price: ${currentPrice.toFixed(2)} | RNG: {randomNumber})
          </h2>
          <svg width={chartWidth} height={chartHeight} className="mx-auto">
            <g transform={`translate(${margin.left},${margin.top})`}>
              {allCandles.map(renderCandle)}
              {renderXAxis()}
              {renderYAxis()}
            </g>
          </svg>
        </>
      )}
    </div>
  );
};

export default CandlestickChart;
