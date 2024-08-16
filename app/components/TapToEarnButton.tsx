import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TapToEarnButtonProps {
  onTap: () => void;
  earnRate: number;
}

export default function TapToEarnButton({ onTap, earnRate }: TapToEarnButtonProps) {
  const [earnAnimations, setEarnAnimations] = useState<number[]>([]);

  const handleTap = () => {
    onTap();
    setEarnAnimations(prev => [...prev, Date.now()]);
  };

  return (
    <div className="relative mt-16 mb-8">
      <button
        onClick={handleTap}
        className="bg-red-500 hover:bg-red-600 text-white font-bold w-32 h-32 rounded-full text-xl flex items-center justify-center shadow-lg transform active:scale-95 transition-transform duration-100 ease-in-out"
        style={{
          boxShadow: '0 6px 0 #9b2c2c',
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        }}
      >
        Tap to Earn
      </button>
      <AnimatePresence>
        {earnAnimations.map((id) => (
          <motion.div
            key={id}
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: '-100vh' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 3, ease: 'easeOut' }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-white"
            style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
          >
            +{earnRate}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}