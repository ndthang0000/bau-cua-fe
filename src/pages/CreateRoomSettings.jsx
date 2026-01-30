import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { ChevronLeft, Rocket, Minus, Plus, Users, Wallet, Scale, ArrowLeftRight } from 'lucide-react';
import { socket } from '../socket'; // Import instance socket của bạn
const BALANCE_OPTIONS = [100000, 200000, 500000, 1000000, 3000000];

export default function CreateRoomSettings({ onBack, onSuccess }) {
  const { user, updateRoomConfig } = useGameStore();
  const [config, setConfig] = useState(useGameStore.getState().roomConfig);
  const roomNameInputRef = useRef(null);

  // Logic tính toán các tùy chọn cược dựa trên vốn khởi điểm
  const minRates = [0.025, 0.05, 0.1]; // 2.5%, 5%, 10%
  const maxRates = [0.5, 0.75, 1.0];  // 50%, 75%, 100%

  const minOptions = minRates.map(rate => config.startingBalance * rate);
  const maxOptions = maxRates.map(rate => config.startingBalance * rate);


  const handleUpdate = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleFinalize = () => {
    // 1. Lưu cấu hình vào Local Store
    updateRoomConfig(config);

    // 2. Kết nối Socket nếu chưa
    if (!socket.connected) socket.connect();

    // 3. Emit sự kiện tạo phòng (tận dụng join_room với roomConfig)
    const roomId = Math.floor(1000 + Math.random() * 9000).toString();
    
    socket.emit('join_room', { 
      roomId, 
      userData: user, 
      roomConfig: config 
    });

    // 4. Lưu ID vào store và gọi callback để App.jsx chuyển view sang 'lobby'
    onSuccess(); 
  };

  useEffect(() => {
    // Cập nhật lại cấu hình khi component mount
    setConfig({ ...config,minBet: minOptions[0], maxBet: maxOptions[0] });
  }, [config.startingBalance]);

  useEffect(() => {
    // Focus vào input "Tên Phòng" khi component mount
    if (roomNameInputRef.current) {
      roomNameInputRef.current.focus();
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans max-w-md mx-auto">
      {/* Header */}
      <div className="p-4 flex items-center bg-white">
        <button onClick={onBack} className="p-2">
          <ChevronLeft size={24} className="text-gray-800" />
        </button>
        <h2 className="flex-1 text-center font-bold text-lg mr-8">Cài đặt Phòng Chơi</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
        {/* Section: Thông tin phòng */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-widest">
            <Users size={16} className="text-primary-orange" /> Thông tin phòng
          </div>
          <div className="bg-white rounded-[32px] p-6 shadow-sm space-y-6">
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 mb-2 block">Tên Phòng</label>
              <input 
                ref={roomNameInputRef}
                type="text" 
                value={config.name}
                onChange={(e) => handleUpdate('name', e.target.value)}
                className="w-full bg-gray-50 border-none rounded-2xl py-4 px-6 font-bold text-gray-700 focus:ring-2 focus:ring-orange-100"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 mb-2 block">Số người tối đa</label>
              <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-2">
                <button 
                  onClick={() => handleUpdate('maxPlayers', Math.max(2, config.maxPlayers - 1))}
                  className="w-12 h-12 flex items-center justify-center text-primary-orange bg-white rounded-xl shadow-sm"
                >
                  <Minus size={20} />
                </button>
                <span className="font-black text-xl">{config.maxPlayers}</span>
                <button 
                  onClick={() => handleUpdate('maxPlayers', Math.min(20, config.maxPlayers + 1))}
                  className="w-12 h-12 flex items-center justify-center text-primary-orange bg-white rounded-xl shadow-sm"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Vốn khởi điểm */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-widest">
            <Wallet size={16} className="text-primary-orange" /> Vốn khởi điểm
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {BALANCE_OPTIONS.map((val) => (
              <button
                key={val}
                onClick={() => handleUpdate('startingBalance', val)}
                className={`flex-shrink-0 w-20 h-24 rounded-3xl flex flex-col items-center justify-center transition-all border-2
                  ${config.startingBalance === val 
                    ? 'bg-white border-primary-orange shadow-md' 
                    : 'bg-white border-transparent opacity-60'}`}
              >
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mb-2">
                   <span className="text-[10px] font-black text-primary-orange">
                     {val >= 1000000 ? `${val/1000000}Tr` : `${val/1000}k`}
                   </span>
                </div>
                <span className={`text-[10px] font-bold ${config.startingBalance === val ? 'text-primary-orange' : 'text-gray-400'}`}>
                  {val.toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Section: Luật làm cái */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-widest">
            <ArrowLeftRight size={16} className="text-primary-orange" /> Luật làm cái
          </div>
          <div className="space-y-3">
            {/* Cố định */}
            <button 
              onClick={() => handleUpdate('dealerMode', 'fixed')}
              className={`w-full p-5 rounded-[28px] flex items-center gap-4 border-2 transition-all
                ${config.dealerMode === 'fixed' ? 'bg-white border-primary-orange' : 'bg-white border-transparent'}`}
            >
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">
                <Users size={24} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-bold text-gray-800">Cố định</p>
                <p className="text-[10px] text-gray-400 font-medium">Một người làm cái xuyên suốt</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                ${config.dealerMode === 'fixed' ? 'border-primary-orange' : 'border-gray-200'}`}>
                {config.dealerMode === 'fixed' && <div className="w-3 h-3 bg-primary-orange rounded-full" />}
              </div>
            </button>

            {/* Xoay vòng */}
            <div className={`rounded-[28px] border-2 transition-all overflow-hidden
              ${config.dealerMode === 'rotate' ? 'bg-white border-primary-orange' : 'bg-white border-transparent'}`}>
              <button 
                onClick={() => handleUpdate('dealerMode', 'rotate')}
                className="w-full p-5 flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-primary-orange">
                  <ArrowLeftRight size={24} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-bold text-gray-800">Xoay vòng</p>
                  <p className="text-[10px] text-gray-400 font-medium">Luân phiên vai trò nhà cái</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                  ${config.dealerMode === 'rotate' ? 'border-primary-orange' : 'border-gray-200'}`}>
                  {config.dealerMode === 'rotate' && <div className="w-3 h-3 bg-primary-orange rounded-full" />}
                </div>
              </button>
              
              {config.dealerMode === 'rotate' && (
                <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-orange-50 mx-4">
                  <span className="text-xs font-bold text-gray-500">Số ván mỗi lượt:</span>
                  <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-1">
                    <button onClick={() => handleUpdate('rotateRounds', Math.max(1, config.rotateRounds - 1))} className="p-1"><Minus size={14}/></button>
                    <span className="font-bold w-4 text-center">{config.rotateRounds}</span>
                    <button onClick={() => handleUpdate('rotateRounds', config.rotateRounds + 1)} className="p-1"><Plus size={14}/></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section: Chế độ chơi */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-widest">
            <Rocket size={16} className="text-primary-orange" /> Chế độ chơi
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* Auto Mode */}
            <button 
              onClick={() => handleUpdate('playMode', 'auto')}
              className={`p-4 rounded-[24px] flex flex-col items-center gap-2 border-2 transition-all
                ${config.playMode === 'auto' ? 'bg-white border-primary-orange shadow-md' : 'bg-white border-transparent'}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl
                ${config.playMode === 'auto' ? 'bg-orange-100' : 'bg-gray-100'}`}>
                ⏱️
              </div>
              <div className="text-center">
                <p className={`font-bold text-sm ${config.playMode === 'auto' ? 'text-primary-orange' : 'text-gray-700'}`}>Tự động</p>
                <p className="text-[9px] text-gray-400">Đếm ngược tự động</p>
              </div>
            </button>

            {/* Manual Mode */}
            <button 
              onClick={() => handleUpdate('playMode', 'manual')}
              className={`p-4 rounded-[24px] flex flex-col items-center gap-2 border-2 transition-all
                ${config.playMode === 'manual' ? 'bg-white border-primary-orange shadow-md' : 'bg-white border-transparent'}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl
                ${config.playMode === 'manual' ? 'bg-orange-100' : 'bg-gray-100'}`}>
                🎮
              </div>
              <div className="text-center">
                <p className={`font-bold text-sm ${config.playMode === 'manual' ? 'text-primary-orange' : 'text-gray-700'}`}>Thủ công</p>
                <p className="text-[9px] text-gray-400">Nhà cái điều khiển</p>
              </div>
            </button>
          </div>
          <p className="text-[10px] text-gray-400 italic text-center">
            {config.playMode === 'auto' 
              ? '* Game tự động chạy với thời gian đếm ngược cho mỗi pha.' 
              : '* Nhà cái sẽ điều khiển từng pha: đặt cược → xóc → mở bát.'}
          </p>
        </section>

        {/* Section: Hạn mức cược */}
        <section className="space-y-4 mb-32">
        <div className="flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-widest">
          <Scale size={16} className="text-primary-orange" /> Hạn mức cược
        </div>
        <div className="grid grid-cols-2 gap-4">
          
          {/* Select Mức cược tối thiểu */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 ml-2 uppercase">Cược tối thiểu</label>
            <div className="relative">
              <select 
                value={config.minBet}
                onChange={(e) => handleUpdate('minBet', Number(e.target.value))}
                className="w-full bg-white border-none rounded-2xl py-4 px-4 font-bold text-sm shadow-sm appearance-none focus:ring-2 focus:ring-orange-100"
              >
                {minOptions.map((opt, i) => (
                  <option key={opt} value={opt}>
                    {opt.toLocaleString()}đ ({minRates[i] * 100}%)
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">
                <ChevronLeft size={16} className="-rotate-90" />
              </div>
            </div>
          </div>

          {/* Select Mức cược tối đa */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-400 ml-2 uppercase">Cược tối đa</label>
            <div className="relative">
              <select 
                value={config.maxBet}
                onChange={(e) => handleUpdate('maxBet', Number(e.target.value))}
                className="w-full bg-white border-none rounded-2xl py-4 px-4 font-bold text-sm shadow-sm appearance-none focus:ring-2 focus:ring-orange-100"
              >
                {maxOptions.map((opt, i) => (
                  <option key={opt} value={opt}>
                    {opt.toLocaleString()}đ ({maxRates[i] * 100}%)
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-300">
                <ChevronLeft size={16} className="-rotate-90" />
              </div>
            </div>
          </div>

        </div>
        <p className="text-[10px] text-gray-400 italic text-center px-4">
          * Hạn mức cược được tính toán dựa trên mức vốn khởi điểm để đảm bảo tính công bằng.
        </p>
      </section>
      </div>

      {/* Footer Button */}
      <div className="p-6 bg-white/80 backdrop-blur-md fixed bottom-0 w-full max-w-md border-t border-gray-100">
        <button 
          onClick={handleFinalize}
          className="w-full bg-primary-orange py-5 rounded-[28px] font-black text-lg text-white shadow-lg shadow-orange-200 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
        >
          <Rocket size={24} fill="white" /> Hoàn Tất & Tạo Phòng
        </button>
      </div>
    </div>
  );
}