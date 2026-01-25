import React from 'react';
import { useGameStore } from '../../store/useGameStore';

export default function GameHeader({onPressSoiCau}) {
  const { room, user } = useGameStore();

  return (
    <div className="p-4 flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-4">
        <div className="flex flex-col">
          <span className="font-black text-lg">Room #{room.id}</span>
          <span className="text-[9px] text-gray-500 uppercase tracking-widest">Đang cược...</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Kết quả ván gần nhất */}
          <div className="flex gap-1 bg-black/40 p-1.5 rounded-full border border-gray-800">
             <span className="w-5 h-5 flex items-center justify-center text-[10px] bg-white rounded-full">🦀</span>
             <span className="w-5 h-5 flex items-center justify-center text-[10px] bg-white rounded-full">🐟</span>
             <span className="w-5 h-5 flex items-center justify-center text-[10px] bg-white rounded-full">🐓</span>
          </div>
          <button onClick={onPressSoiCau} className="text-red-500 font-black text-[11px] px-2 py-1 bg-red-500/10 rounded-md">SOI CẦU</button>
        </div>
      </div>

      <div className="text-center">
        <p className="text-[9px] text-gray-500 uppercase font-bold mb-1">Account Balance</p>
        <h2 className="text-2xl font-black tracking-tight text-white">${user.balance?.toLocaleString()}</h2>
      </div>
    </div>
  );
}