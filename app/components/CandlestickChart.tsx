import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { cashOut } from '../server/cashOut';

interface CandleData {
  open: number;
  close: number;
  high: number;
  low: number;
  time: string;
  isGameOver?: boolean;
}

interface GameState {
  isLaunched: boolean;
  isCashedOut: boolean;
  gameOver: boolean;
  data: CandleData[];
  currentCandle: CandleData | null;
  currentPrice: number;
  randomNumber: number;
  threshold: number;
  candleCount: number;
  gameOverStartTime: number | null;
}

const CandlestickChart: React.FC<{
  startingPrice: number;
  volatility: number;
  trend: number;
  rng: number;
  walletAddress: string;
  balance: number;
}> = ({ startingPrice = 100, volatility = 0.02, trend = 0, rng = 1000, walletAddress, balance }) => {
  const [gameState, setGameState] = useState<GameState>({
    isLaunched: false,
    isCashedOut: false,
    gameOver: false,
    data: [],
    currentCandle: null,
    currentPrice: startingPrice,
    randomNumber: 0,
    threshold: 10,
    candleCount: 0,
    gameOverStartTime: null,
  });

  const [isAnimating, setIsAnimating] = useState(false);
  const rocketRef = useRef<HTMLDivElement>(null);
  const [cashOutMessage, setCashOutMessage] = useState<string | null>(null);

  const chartWidth = 700;
  const chartHeight = 500;
  const margin = { top: 20, right: 30, bottom: 30, left: 40 };
  const width = chartWidth - margin.left - margin.right;
  const height = chartHeight - margin.top - margin.bottom;

  const handleCashOut = useCallback(async (price: number) => {
    if (!walletAddress) {
      setCashOutMessage("Please connect your wallet first.");
      return;
    }
  
    setGameState(prev => ({ ...prev, isCashedOut: true }));
    setCashOutMessage("Processing cash out...");
  
    try {
      const updatedBalance = await cashOut(walletAddress, price);
      setCashOutMessage(`Successfully cashed out! New balance: ${updatedBalance.toFixed(2)}`);
    } catch (error) {
      console.error("Error cashing out:", error);
      setCashOutMessage("Failed to cash out. Please try again.");
      setGameState(prev => ({ ...prev, isCashedOut: false }));
    }
  }, [walletAddress]);

  const generateCandle = useCallback(
    (prevClose: number, forceGameOver: boolean = false): CandleData => {
      if (forceGameOver) {
        return {
          open: prevClose,
          close: prevClose,  // Start the game over candle at the previous close
          high: prevClose,
          low: prevClose,
          time: new Date().toLocaleTimeString(),
          isGameOver: true
        };
      }

      const maxChange = prevClose * volatility;
      const trendBias = trend * maxChange * 0.5;
      const randomFactor = Math.random() - 0.5;

      const change = trendBias + randomFactor * maxChange * (1 + Math.abs(trend));

      const open = prevClose;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * (maxChange / 2);
      const low = Math.min(open, close) - Math.random() * (maxChange / 2);

      return { open, close, high, low, time: new Date().toLocaleTimeString() };
    },
    [volatility, trend]
  );

  useEffect(() => {
    if (!gameState.isLaunched || gameState.isCashedOut || gameState.gameOver) return;

    const interval = setInterval(() => {
      setGameState(prev => {
        const lastCandle = prev.data[prev.data.length - 1] || { close: startingPrice };
        const newRandomNumber = Math.floor(Math.random() * (rng + 1));
        const newCandleCount = prev.candleCount + 1;
        const newThreshold = prev.threshold + 10;

        // Check for game over condition
        if (newCandleCount > 3 && newRandomNumber < prev.threshold) {
          const gameOverCandle = generateCandle(lastCandle.close, true);
          return {
            ...prev,
            gameOver: true,
            randomNumber: newRandomNumber,
            candleCount: newCandleCount,
            threshold: newThreshold,
            currentPrice: lastCandle.close,
            data: [...prev.data.slice(-19), gameOverCandle],
            currentCandle: gameOverCandle,
            gameOverStartTime: Date.now(),
          };
        }

        const newCandle = generateCandle(lastCandle.close);
        return {
          ...prev,
          randomNumber: newRandomNumber,
          candleCount: newCandleCount,
          threshold: newThreshold,
          currentPrice: newCandle.close,
          data: [...prev.data.slice(-19), newCandle],
          currentCandle: newCandle
        };
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [gameState.isLaunched, gameState.isCashedOut, gameState.gameOver, startingPrice, generateCandle, rng]);

  useEffect(() => {
    if (!gameState.isLaunched || gameState.isCashedOut) return;

    const growthInterval = setInterval(() => {
      setGameState(prev => {
        if (prev.gameOver) {
          const elapsedTime = Date.now() - (prev.gameOverStartTime || Date.now());
          const duration = 5000; // 5 seconds for the game over animation
          if (elapsedTime >= duration) {
            clearInterval(growthInterval);
            handleCashOut(0);
            return { 
              ...prev, 
              currentPrice: 0,
              currentCandle: {
                ...prev.currentCandle!,
                close: 0,
                low: 0
              }
            };
          }
          const progress = elapsedTime / duration;
          const newPrice = prev.currentCandle!.open * (1 - progress);
          return { 
            ...prev, 
            currentPrice: newPrice,
            currentCandle: {
              ...prev.currentCandle!,
              close: newPrice,
              low: Math.min(prev.currentCandle!.low, newPrice)
            }
          };
        }

        if (!prev.currentCandle) {
          const lastCandle = prev.data[prev.data.length - 1] || { close: startingPrice };
          return { ...prev, currentCandle: generateCandle(lastCandle.close) };
        }
        const maxGrowth = prev.currentCandle.close * 0.005;
        const growth = (Math.random() - 0.5) * 2 * maxGrowth;
        const newClose = prev.currentCandle.close + growth;
        return {
          ...prev,
          currentPrice: newClose,
          currentCandle: {
            ...prev.currentCandle,
            close: newClose,
            high: Math.max(prev.currentCandle.high, newClose),
            low: Math.min(prev.currentCandle.low, newClose),
          }
        };
      });
    }, 100);

    return () => clearInterval(growthInterval);
  }, [gameState.isLaunched, gameState.isCashedOut, gameState.gameOver, startingPrice, generateCandle, handleCashOut]);

  const allCandles = [...gameState.data, gameState.currentCandle].filter(Boolean) as CandleData[];

  const minPrice = Math.min(...allCandles.map((c) => c.low), gameState.currentPrice);
  const maxPrice = Math.max(...allCandles.map((c) => c.high));
  const priceRange = maxPrice - minPrice;

  const scaleY = (price: number) =>
    height - ((price - minPrice) / priceRange) * height;
  const candleWidth = width / 20;

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
          stroke="white"
          strokeWidth="1"
        />
        <rect
          x={x}
          y={y}
          width={candleWidth}
          height={candleHeight || 1}
          fill={candle.isGameOver ? "red" : (candle.open > candle.close ? "red" : "green")}
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
      setGameState(prev => ({
        ...prev,
        isLaunched: true,
        data: [generateCandle(startingPrice)]
      }));
    }, 1000);
  };

  return (
    <div className="p-4">
      {!gameState.isLaunched ? (
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
            Price: ${Math.round(gameState.currentPrice)} | RNG: {gameState.randomNumber} | Threshold: {gameState.threshold} | Candles: {gameState.candleCount}
            {gameState.gameOver && <span className="text-red-500 ml-2">GAME OVER!</span>}
          </h2>
          <svg width={chartWidth} height={chartHeight} className="mx-auto">
            <g transform={`translate(${margin.left},${margin.top})`}>
              {allCandles.map(renderCandle)}
              {renderXAxis()}
              {renderYAxis()}
            </g>
          </svg>
          <div className="mt-4 flex flex-col items-center">
            <button
              onClick={() => handleCashOut(gameState.currentPrice)}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              disabled={gameState.isCashedOut || gameState.gameOver}
            >
              {gameState.isCashedOut ? "Cashed Out" : "Cash Out"}
            </button>
            {cashOutMessage && (
              <p className="mt-2 text-white">{cashOutMessage}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CandlestickChart;