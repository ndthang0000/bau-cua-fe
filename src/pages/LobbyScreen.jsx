import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { ChevronLeft, Settings, Play, Copy, Plus } from 'lucide-react';
import { socket } from '../socket';

export default function LobbyScreen({ onBack,onStartGame }) {
  const { room, roomMembers, user,resetRoom } = useGameStore();
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://baucua.io/join/${room.id}`);
    alert(" Đã sao chép link mời bạn bè!");
  };

  const handleStartGame = () => {
    socket.emit('start_game', { roomId: room.id });
  };
  
  const handleBack = () => {
    if (room.id) {
      // 1. Báo Server cho mình rời phòng
      socket.emit('leave_room', { roomId: room.id, userId: user.id });
    }
    
    // 2. Xóa dữ liệu cục bộ
    resetRoom();
    
    // 3. Chuyển view
    onBack(); 
  };
  
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans max-w-md mx-auto relative">
      {/* Header */}
      <div className="p-4 flex items-center bg-white shadow-sm">
        <button onClick={handleBack} className="p-2">
          <ChevronLeft size={24} className="text-gray-800" />
        </button>
        <h2 className="flex-1 text-center font-bold text-lg mr-8">Phòng của {user.nickname}</h2>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        {/* Room ID Card */}
        <div className="bg-[#FFF1F0] rounded-[40px] p-8 text-center mb-10 shadow-sm relative">
          <p className="text-primary-orange font-bold text-sm tracking-widest uppercase mb-2">Mã Phòng</p>
          <h1 className="text-7xl font-black text-primary-orange tracking-tighter mb-6">{room.id || '8888'}</h1>
          
          <div className="bg-white rounded-full py-3 px-4 flex items-center justify-between border border-orange-100 shadow-sm">
            <p className="text-[10px] text-gray-400 text-left leading-tight ml-2">
              Chia sẻ mã này với bạn bè để cùng chơi
            </p>
            <button 
              onClick={handleCopyLink}
              className="bg-primary-orange text-white text-xs font-bold py-2 px-5 rounded-full flex items-center gap-2 active:scale-95 transition-transform"
            >
              <Copy size={14} /> Copy Link
            </button>
          </div>
        </div>

        {/* Members List Section */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-xl text-gray-900">Thành viên trong phòng</h3>
          <span className="bg-orange-100 text-primary-orange text-xs font-bold px-3 py-1 rounded-full">
            {roomMembers.length}/{room?.config?.maxPlayers || 10} Người
          </span>
        </div>

        <div className="grid grid-cols-4 gap-y-8 gap-x-4">
  {roomMembers.map((member) => (
    <div key={member.userId} className="flex flex-col items-center relative">
      <div className="relative">
        <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center text-4xl bg-white shadow-md
          ${member.userId === user.id ? 'border-primary-orange' : 'border-white'}`}>
          {member.avatar}
        </div>
        
        {/* Label "Bạn" hoặc "Chủ Cái" */}
        {member.userId === user.id && (
          <div className="absolute -bottom-1 -right-1 bg-primary-orange text-[8px] text-white font-bold px-2 py-1 rounded-md border-2 border-white uppercase">
            Bạn
          </div>
        )}
      </div>
      
      <div className="mt-3 text-center w-full px-1">
        {/* Hiển thị NICKNAME - ưu tiên nickname từ member object */}
        <p className="font-black text-gray-900 text-[13px] leading-tight truncate w-full uppercase tracking-tighter">
          {member.nickname || member.name || "Vô danh"}
        </p>
        
        <p className={`text-[10px] font-bold flex items-center justify-center gap-1 mt-1
          ${member.status === 'ready' ? 'text-green-500' : 'text-gray-400'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${member.status === 'ready' ? 'bg-green-500' : 'bg-gray-300'}`} />
          
          {/* Logic hiển thị vai trò/trạng thái */}
          {member.userId === room.hostId ? (
            <span className="text-primary-orange italic">CHỦ CÁI</span>
          ) : (
            member.status === 'ready' ? 'Sẵn sàng' : 'Đang đợi...'
          )}
        </p>
      </div>
    </div>
  ))}

  {/* Nút mời thêm người hoặc Slot trống */}
  {roomMembers.length < (room.config?.maxPlayers || 15) && (
    <div className="flex flex-col items-center group active:scale-95 transition-transform">
      <div className="w-20 h-20 rounded-full border-4 border-dashed border-gray-200 flex items-center justify-center bg-gray-50/50">
        <Plus size={32} className="text-gray-300 group-hover:text-primary-orange transition-colors" />
      </div>
      <p className="mt-3 font-bold text-gray-300 text-[10px] uppercase tracking-widest text-center">Mời bạn</p>
    </div>
  )}
</div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 space-y-4 bg-white/80 backdrop-blur-md border-t border-gray-100">
        
        {room.isHost && (
        <button
          onClick={handleStartGame}
          className="w-full bg-primary-orange py-4 rounded-full font-black text-xl text-white shadow-lg shadow-orange-200 flex items-center justify-center gap-3 active:scale-[0.98] transition-all">
          <Play size={24} fill="white" /> BẮT ĐẦU VÁN ĐẤU
          </button>
        )}
      </div>
    </div>
  );
}