import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { ChevronLeft, Delete } from 'lucide-react';
import { socket } from '../socket'; 
import toast from 'react-hot-toast';

export default function JoinRoomScreen({ onBack, onSuccess }) {
  const [code, setCode] = useState(['', '', '', '']);
  const [liveRecentRooms, setLiveRecentRooms] = useState([]);
  const { recentRooms, setRoomData, addRecentRoom, user } = useGameStore();

  const handleKeyPress = (num) => {
    const firstEmptyIndex = code.findIndex(val => val === '');
    if (firstEmptyIndex !== -1) {
      const newCode = [...code];
      newCode[firstEmptyIndex] = num;
      setCode(newCode);
    }
  };

  const handleDelete = () => {
    const lastFilledIndex = [...code].reverse().findIndex(val => val !== '');
    if (lastFilledIndex !== -1) {
      const actualIndex = 3 - lastFilledIndex;
      const newCode = [...code];
      newCode[actualIndex] = '';
      setCode(newCode);
    }
  };

  const handleConfirm = () => {
    const finalCode = code.join('');
    if (finalCode.length !== 4) return;

    if (!socket.connected) socket.connect();

    // Gửi emit kèm theo một Callback function (res)
    socket.emit('join_room', { roomId: finalCode, userData: user }, (res) => {
      if (res?.success) {
        // Nếu Server báo thành công -> Mới chuyển màn
        console.log("✅ Join room thành công");
        onSuccess(finalCode); 
      } else {
        // Nếu Server báo lỗi (Sai mã, phòng đầy, v.v.)
        console.log("❌ Lỗi join room:", res?.message);
        toast.error(res?.message || "Mã phòng không hợp lệ");
        setCode(['', '', '', '']); // Reset mã để nhập lại
      }
    });
  };

  const handleRejoin = (roomId) => {
    if (!socket.connected) socket.connect();
    socket.emit('join_room', { roomId, userData: user });
    onSuccess(roomId);
  };

  useEffect(() => {
    const finalCode = code.join('');
    if (finalCode.length === 4) {
      handleConfirm();
    }
  }, [code]);

  // FETCH THÔNG TIN PHÒNG GẦN ĐÂY (REAL-TIME)
  useEffect(() => {
    if (recentRooms.length > 0) {
      const ids = recentRooms.map(r => r.id);
      if (!socket.connected) socket.connect();
      
      socket.emit('get_rooms_info', ids);
      socket.on('rooms_info_res', (data) => {
        setLiveRecentRooms(data);
      });
    }

    return () => {
      socket.off('rooms_info_res');
    };
  }, [recentRooms]);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans max-w-md mx-auto relative overflow-hidden">
      <div className="p-4 flex items-center">
        <button onClick={onBack} className="p-2 -ml-2">
          <ChevronLeft size={28} className="text-gray-800" />
        </button>
        <h2 className="flex-1 text-center font-bold text-lg mr-8">Vào Phòng Bầu Cua</h2>
      </div>

      <div className="flex-1 px-8 pt-8 text-center">
        <h1 className="text-3xl font-black mb-2 tracking-tight">Nhập mã phòng</h1>
        <p className="text-gray-400 text-sm mb-10">Yêu cầu mã 4 chữ số để tham gia</p>

        <div className="flex justify-center gap-3 mb-10">
          {code.map((num, i) => (
            <div
              key={i}
              className={`w-16 h-20 rounded-2xl border-2 flex items-center justify-center text-3xl font-bold transition-all
                ${num ? 'border-primary-orange text-primary-orange shadow-sm' : 'border-gray-100 text-gray-300'}`}
            >
              {num || '—'}
            </div>
          ))}
        </div>

        <button
          onClick={handleConfirm}
          disabled={code.join('').length < 4}
          className={`w-full py-4 rounded-full font-bold text-lg shadow-lg transition-all active:scale-95 mb-12
            ${code.join('').length === 4 ? 'bg-primary-orange text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
        >
          Xác Nhận
        </button>
      </div>

      <div className="bg-gray-50 p-4 grid grid-cols-3 gap-2 pb-8">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button
            key={num}
            onClick={() => handleKeyPress(num.toString())}
            className="h-14 bg-white rounded-xl font-bold text-2xl shadow-sm active:bg-gray-200 transition-colors"
          >
            {num}
          </button>
        ))}
        <div />
        <button
          onClick={() => handleKeyPress('0')}
          className="h-14 bg-white rounded-xl font-bold text-2xl shadow-sm active:bg-gray-200 transition-colors"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="h-14 bg-white rounded-xl flex items-center justify-center shadow-sm active:bg-gray-200 transition-colors"
        >
          <Delete size={24} className="text-gray-800" />
        </button>
      </div>

      <div className="p-6 border-t border-gray-200 bg-white/90 backdrop-blur-md">
        <h3 className="font-bold text-gray-800 mb-4 text-left">Phòng Gần Đây</h3>
        {liveRecentRooms.length > 0 ? (
          liveRecentRooms.map(room => (
            <div key={room.id} className="bg-gradient-to-r from-[#FDEFD3] to-[#F7D8A0] p-4 rounded-[24px] mb-4 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-black text-lg">Phòng {room.id}</h4>
                <div className="flex -space-x-2">
                  {room.avatars?.map((av, idx) => (
                    <div key={idx} className="w-7 h-7 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[10px] shadow-sm">{av}</div>
                  ))}
                </div>
              </div>
              <button 
                onClick={() => handleRejoin(room.id)}
                className="w-full py-2 bg-white/70 rounded-full text-primary-orange font-bold text-sm shadow-sm"
              >
                Vào Lại
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-gray-300 text-xs">Không có phòng gần đây</div>
        )}
      </div>
    </div>
  );
}