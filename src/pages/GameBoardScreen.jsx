import React, { useEffect, useState, useMemo } from 'react';
import { useGameStore } from '../store/useGameStore';
import { socket } from '../socket';
import GameHeader from '../components/game/GameHeader';
import BettingGrid from '../components/game/BettingGrid';
import DiceBowl from '../components/game/DiceBowl';
import SoiCauModal from '../components/game/SoiCauModal';
import toast from 'react-hot-toast';

export default function GameBoardScreen() {
  const { room, user, selectedChip, setSelectedChip, roomMembers, myBets, addMyBet, updateUser } = useGameStore();
  const [isSoiCauOpen, setIsSoiCauOpen] = useState(false);
  // State quản lý các ô đang được chọn để đặt cược
  const [selectedDoors, setSelectedDoors] = useState([]); 

  const chipValues = [10000, 50000, 100000, 500000, 1000000];
  const chipColors = ['#3B82F6', '#EF4444', '#A855F7', '#EAB308', '#EC4899'];

  const isBettingTime = room?.status === 'betting';

  // Toggle chọn/bỏ chọn ô cược
  const handleSelectDoor = (door) => {
    if (!isBettingTime) return;
    setSelectedDoors(prev => 
      prev.includes(door) ? prev.filter(d => d !== door) : [...prev, door]
    );
  };

  // Xác nhận đặt cược
  const handleConfirmBet = async () => {
  if (selectedDoors.length === 0) return;
  
  const betsToPlace = selectedDoors.map(door => {
    return new Promise((resolve) => {
      socket.emit('place_bet', { 
        roomId: room.id, 
        door, 
        amount: selectedChip,
        nickname: user.nickname,
        userId: user.id
      }, (response) => {
        if (response.success) {
          // Cập nhật myBets trong store của bản thân
          addMyBet(door, selectedChip);
          // Cập nhật lại balance local để UI mượt mà ngay lập tức
          updateUser({ balance: response.newBalance });
          resolve({ success: true });
        } else {
          toast.error(response.message);
          resolve({ success: false });
        }
      });
    });
  });

  const results = await Promise.all(betsToPlace);
  const successCount = results.filter(r => r.success).length;

  if (successCount > 0) {
    toast.success(`Đã đặt thành công ${successCount} ô!`);
    setSelectedDoors([]); 
  }
};

  const handleReset = () => setSelectedDoors([]);

  useEffect(() => {
    if (room?.status === 'result' && room?.lastResult) {
      const myBet = room.lastBets?.find(b => b.userId === user.id);
      if (myBet && myBet.wonAmount > 0) {
        toast.success(`Chúc mừng! Thắng ${myBet.wonAmount.toLocaleString()}đ`, { icon: '💰' });
      }
    }
    // Tự động bỏ chọn khi hết thời gian cược
    if (room?.status !== 'betting') setSelectedDoors([]);
  }, [room?.status]);

  const soiCauData = useMemo(() => room?.history || [], [room?.history]);

  return (
    <div className="h-screen bg-[#0A0A0A] text-white flex flex-col font-sans max-w-md mx-auto overflow-hidden relative">
      
      {/* 1. Sticky Header - Cố định phía trên */}
      <div className="sticky top-0 z-[60] bg-[#0A0A0A]/90 backdrop-blur-md border-b border-gray-800">
        <GameHeader onPressSoiCau={() => setIsSoiCauOpen(true)} />
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Thu nhỏ danh sách thành viên để ưu tiên không gian */}
        <div className="px-4 py-1 bg-black/20">
          <div className="flex overflow-x-auto gap-3 no-scrollbar py-1">
            {roomMembers?.slice(0, 15).map((member) => (
              <div key={member.userId} className="flex flex-col items-center flex-shrink-0">
                <div className="w-8 h-8 rounded-full border border-gray-700 bg-gray-900 flex items-center justify-center text-sm relative">
                  {member.avatar}
                  {room.currentDealer?.userId === member.userId && (
                    <div className="absolute -top-1 -right-1 bg-yellow-500 text-[5px] px-1 rounded-full font-black text-black">CÁI</div>
                  )}
                </div>
                <span className="text-[6px] text-green-400 font-bold leading-tight">
                    {member.currentBalance > 1000000 ? `${(member.currentBalance/1000000).toFixed(1)}M` : `${Math.floor(member.currentBalance/1000)}k`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Giảm padding/margin của DiceBowl để hiện thị BettingGrid cao hơn */}
        <div className="scale-90 origin-top -mb-4">
            <DiceBowl status={room?.status} result={room?.lastResult} />
        </div>

        {/* Bàn cược - Truyền thêm state selection */}
        <div className="px-2">
            <BettingGrid 
              isLock={!isBettingTime} 
              currentBets={room?.totalBets} 
              selectedDoors={selectedDoors}
            onSelectDoor={handleSelectDoor}
            myBets={myBets || {}}
            />
        </div>
      </div>

      {/* 2. Control Area - Sticky Bottom */}
      <div className="sticky bottom-0 bg-[#111111] p-3 pb-6 rounded-t-3xl border-t border-gray-800 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        
        {/* Chip List - Giữ nguyên */}
        <div className="flex justify-between items-center mb-4 overflow-x-auto no-scrollbar gap-2 px-1">
          {chipValues.map((amt, i) => (
            <button
              key={amt}
              onClick={() => setSelectedChip(amt)}
              className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-[9px] font-black transition-all border-2
                ${selectedChip === amt ? 'scale-110 border-white shadow-[0_0_15px]' : 'opacity-40 border-transparent'}`}
              style={{ 
                backgroundColor: chipColors[i], 
                boxShadow: selectedChip === amt ? chipColors[i] : 'none'
              }}
            >
              {amt >= 1000000 ? `${amt/1000000}M` : `${amt/1000}K`}
            </button>
          ))}
        </div>

        {/* Bottom Actions - Layout mới: Balance | Đặt lại | Xác nhận/Xóc */}
        <div className="flex items-center gap-2">
          {/* Thay Balance cho nút Gấp đôi */}
          <div className="flex-1 bg-black/40 h-11 rounded-xl flex flex-col items-center justify-center border border-gray-800">
             <span className="text-[8px] text-gray-400 uppercase">Số dư</span>
             <span className="text-xs font-bold text-yellow-500">
                {roomMembers.find(m => m.userId === user.id)?.currentBalance?.toLocaleString() || '0'}
             </span>
          </div>

          <button 
            onClick={handleReset}
            className="flex-1 bg-gray-800/80 h-11 rounded-xl font-bold text-[10px] uppercase active:scale-95 transition-transform"
          >
            Đặt lại
          </button>

          {/* Logic nút chính: Xác nhận cược (nếu đang chọn) HOẶC Xóc (nếu là cái) */}
          <div className="flex-[1.5]">
            {selectedDoors.length > 0 ? (
              <button 
                onClick={handleConfirmBet}
                className="w-full bg-green-600 h-11 rounded-xl font-black text-[11px] uppercase shadow-[0_0_15px_rgba(22,163,74,0.4)] animate-pulse"
              >
                Xác nhận ({selectedDoors.length})
              </button>
            ) : room?.currentDealer?.userId === user.id && room?.status === 'waiting' ? (
              <button 
                onClick={() => socket.emit('start_game', { roomId: room.id })}
                className="w-full bg-primary-orange h-11 rounded-xl font-black text-[11px] uppercase"
              >
                Bắt đầu ván
              </button>
            ) : (
              <div className="w-full bg-gray-900/80 h-11 rounded-xl flex items-center justify-center text-[9px] font-bold text-gray-500 uppercase border border-gray-800 italic">
                {room?.status === 'betting' ? 'Mời đặt cược' : 'Đợi kết quả'}
              </div>
            )}
          </div>
        </div>
      </div>

      <SoiCauModal isOpen={isSoiCauOpen} history={soiCauData} onClose={() => setIsSoiCauOpen(false)} />
    </div>
  );
}