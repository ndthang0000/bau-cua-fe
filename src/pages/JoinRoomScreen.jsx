import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { ChevronLeft, Delete } from 'lucide-react';
import { socket } from '../socket'; // Import instance socket
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

    // Xóa listener cũ trước khi tạo mới
    socket.off('room_update');
    socket.off('error_msg');

    socket.once('error_msg', (msg) => {
      setCode(['', '', '', '']);
      toast.error(msg);
    });

    socket.emit('join_room', { roomId: finalCode, userData: user });

    socket.once('room_update', (roomData) => {
      if (roomData && roomData.roomId === finalCode) {
        setRoomData(roomData);
        addRecentRoom({ 
          id: finalCode, 
          players: roomData.members.length, 
          avatars: roomData.members.map(m => m.avatar).slice(0, 3) 
        });
        onSuccess(finalCode);
      }
    });
  };

  const handleRejoin = (roomId) => {
    if (!socket.connected) socket.connect();
    socket.emit('join_room', { roomId, userData: user });
    
    setRoomData(roomData);
    
  };

  useEffect(() => {
  const finalCode = code.join('');
  if (finalCode.length === 4) {
    // Có thể tự động submit ở đây nếu muốn
    handleConfirm();
  }
  }, [code]);
  

  // FETCH THÔNG TIN PHÒNG REAL-TIME
  // useEffect(() => {
  //   if (recentRooms.length > 0) {
  //     const ids = recentRooms.map(r => r.id);
  //     if (!socket.connected) socket.connect();
      
  //     // Gửi yêu cầu lấy thông tin
  //     socket.emit('get_rooms_info', ids);

  //     // Nhận kết quả và cập nhật UI
  //     socket.on('rooms_info_res', (data) => {
  //       setLiveRecentRooms(data);
  //     });
  //   }

  //   return () => {
  //     socket.off('rooms_info_res');
  //   };
  // }, [recentRooms]);

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans max-w-md mx-auto relative overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center">
        <button onClick={onBack} className="p-2 -ml-2">
          <ChevronLeft size={28} className="text-gray-800" />
        </button>
        <h2 className="flex-1 text-center font-bold text-lg mr-8">Vào Phòng Bầu Cua</h2>
      </div>

      <div className="flex-1 px-8 pt-8 text-center">
        <h1 className="text-3xl font-black mb-2 tracking-tight">Nhập mã phòng</h1>
        <p className="text-gray-400 text-sm mb-10">Yêu cầu mã 4 chữ số để tham gia</p>

        {/* 4 Digit Input Boxes */}
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

        {/* Confirm Button */}
        <button
          onClick={handleConfirm}
          disabled={code.join('').length < 4}
          className={`w-full py-4 rounded-full font-bold text-lg shadow-lg transition-all active:scale-95 mb-12
            ${code.join('').length === 4 ? 'bg-primary-orange text-white' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
        >
          Xác Nhận
        </button>

        
      </div>

      {/* Numerical Keypad */}
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
        <div /> {/* Empty space */}
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

      {/* Recent Rooms: Sử dụng liveRecentRooms thay vì recentRooms để có data mới nhất */}
      <div className="p-6 border-t border-gray-200 bg-white/90 backdrop-blur-md">
        <div className="text-left">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800">Phòng Gần Đây</h3>
          </div>
          
          {liveRecentRooms.length > 0 ? (
            liveRecentRooms.map(room => (
              <div key={room.id} className="bg-gradient-to-r from-[#FDEFD3] to-[#F7D8A0] p-5 rounded-[32px] shadow-sm relative overflow-hidden group py-4 mb-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-black text-xl text-gray-900">Phòng {room.id}</h4>
                    <p className="text-xs text-green-600 font-bold flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      {room.players} người đang chờ
                    </p>
                  </div>
                  <div className="flex -space-x-2">
                    {room.avatars.map((av, idx) => (
                      <div key={idx} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-sm shadow-sm">
                        {av}
                      </div>
                    ))}
                    {room.players > 3 && (
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-primary-orange text-white flex items-center justify-center text-[10px] font-bold">
                        +{room.players - 3}
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => handleRejoin(room.id)}
                  className="w-full py-2 bg-white/60 hover:bg-white/80 active:scale-95 rounded-full text-primary-orange font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <span className="text-lg">↺</span> Vào Lại Phòng
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-300 text-sm italic">
              {recentRooms.length > 0 ? "Đang cập nhật trạng thái..." : "Không có phòng gần đây"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}