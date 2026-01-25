import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import GameHeader from '../components/game/GameHeader';
import BettingGrid from '../components/game/BettingGrid';
import DiceBowl from '../components/game/DiceBowl';
import SoiCauModal from '../components/game/SoiCauModal';

export default function GameBoardScreen() {
  const { room, user, roomMembers, selectedChip, setSelectedChip,setMembers } = useGameStore();
  const [isSoiCauOpen, setIsSoiCauOpen] = useState(false);
  // Các mệnh giá chip mẫu (Sau này bạn có thể map từ min/max bet)
  const chipValues = [10000, 50000, 100000, 500000, 1000000];
  const chipColors = ['#3B82F6', '#EF4444', '#A855F7', '#EAB308', '#EC4899'];

  useEffect(() => {
    if (roomMembers.length === 0) {
      setMembers([
        { id: 1, name: 'Me', avatar: '😎', status: 'ready' },
        { id: 2, name: 'Alex', avatar: '👨‍🚀', status: 'ready' },
        { id: 3, name: 'Mina', avatar: '🐱', status: 'waiting' },
        { id: 4, name: 'K-Gamer', avatar: '🎮', status: 'ready' },
        { id: 5, name: 'John', avatar: '🧔', status: 'waiting' },
      ]);
    }
  }, []);

  return (
    <div className="h-screen bg-[#0A0A0A] text-white flex flex-col font-sans max-w-md mx-auto overflow-hidden">
      <div className="flex-1 overflow-y-auto no-scrollbar pb-4">

      
      <GameHeader onPressSoiCau={() => setIsSoiCauOpen(true)} />

      {/* User List: 5 user mỗi dòng, center */}
      <div className="px-4 py-2">
        <div className="grid grid-cols-5 gap-2 justify-items-center">
          {roomMembers.slice(0, 10).map((member) => (
            <div key={member.id} className="flex flex-col items-center">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-gray-700 bg-gray-900 flex items-center justify-center text-xl">
                  {member.avatar}
                </div>
                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-black ${member.status === 'ready' ? 'bg-green-500' : 'bg-gray-500'}`} />
              </div>
              <span className="text-[8px] font-bold mt-1 truncate w-full text-center">{member.name}</span>
              <span className="text-[8px] text-green-400 font-black">+12%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Khu vực Bát lắc tách biệt */}
      <DiceBowl />

      {/* Layout 3x2 đặt cược */}
      <BettingGrid />
          </div>
      {/* Control Area */}
      {/* --- STICKY BOTTOM CONTROL AREA --- */}
      <div className="sticky bottom-0 bg-[#151515]/95 backdrop-blur-md p-6 pb-8 rounded-t-[40px] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-gray-800 z-50">
        
        {/* Chip Selection */}
        <div className="flex justify-between items-center mb-6 overflow-x-auto no-scrollbar py-2 gap-3 px-2">
          {chipValues.map((amt, i) => (
            <button
              key={amt}
              onClick={() => setSelectedChip(amt)}
              className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-[10px] font-black transition-all border-4
                ${selectedChip === amt ? 'scale-125 z-10' : 'opacity-30 scale-90'}`}
              style={{ 
                backgroundColor: chipColors[i], 
                borderColor: selectedChip === amt ? 'white' : 'transparent',
                boxShadow: selectedChip === amt ? `0 0 20px ${chipColors[i]}` : 'none'
              }}
            >
              {amt >= 1000000 ? `${amt/1000000}M` : `${amt/1000}K`}
            </button>
          ))}
          <button className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full text-white text-[10px] font-black uppercase shadow-lg active:scale-90">ALL</button>
        </div>

        {/* Primary Actions */}
        <div className="grid grid-cols-3 gap-3">
          <button className="bg-gray-800/60 hover:bg-gray-700 py-3.5 rounded-2xl font-bold text-[10px] uppercase transition-colors active:scale-95">Đặt lại</button>
          <button className="bg-gray-800/60 hover:bg-gray-700 py-3.5 rounded-2xl font-bold text-[10px] uppercase transition-colors active:scale-95">Gấp đôi</button>
          <button className="bg-primary-orange py-3.5 rounded-2xl font-black text-[10px] uppercase shadow-[0_0_20px_rgba(255,87,34,0.3)] hover:brightness-110 active:scale-95 transition-all">
            Xóc / Mở bát
          </button>
        </div>
      </div>


      <SoiCauModal 
        isOpen={isSoiCauOpen} 
        onClose={() => setIsSoiCauOpen(false)} 
      />
    </div>
  );
}