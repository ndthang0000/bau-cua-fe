import React from 'react';
import { useGameStore } from '../../store/useGameStore';

const LAYOUT = [
  { id: 'nai', name: 'Nai', icon: '🦌' },
  { id: 'cua', name: 'Cua', icon: '🦀' },
  { id: 'ga', name: 'Gà', icon: '🐓' },
  { id: 'ca', name: 'Cá', icon: '🐟' },
  { id: 'bau', name: 'Bầu', icon: '🎃' },
  { id: 'tom', name: 'Tôm', icon: '🦐' },
];

export default function BettingGrid() {
  const { myBets, placeBet } = useGameStore();

  return (
    <div className="grid grid-cols-3 gap-3 px-6 mb-8">
      {LAYOUT.map((item) => (
        <button
          key={item.id}
          onClick={() => placeBet(item.id)}
          className="relative aspect-square bg-gradient-to-b from-[#222] to-[#111] rounded-[24px] border border-gray-800 flex flex-col items-center justify-center active:scale-95 transition-all shadow-lg"
        >
          <span className="text-4xl mb-1">{item.icon}</span>
          <span className="text-[9px] text-gray-500 font-bold uppercase">{item.name}</span>
          <span className="text-[8px] text-gray-600 mt-1 font-bold">5.200k</span>

          {myBets[item.id] > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg">
              {myBets[item.id] / 1000}k
            </div>
          )}
        </button>
      ))}
    </div>
  );
}