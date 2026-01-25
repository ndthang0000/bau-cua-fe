import React, { useState } from 'react';

import { useGameStore } from '../store/useGameStore';
import AvatarSelector from '../components/AvatarSelector';

export default function WelcomeScreen({ onJoinPress,onCreateRoomPress }) {
  const { user, updateUser, setRoomData } = useGameStore();
  const [name, setName] = useState(user.nickname || '');
  const [avatar, setAvatar] = useState(user.avatar || '😊');

  const handleCreateRoom = () => {
    if (!name.trim()) return alert("Nhập cái tên đã bạn ơi!");
    updateUser({ nickname: name, avatar: avatar });
    
    // Tạo mã phòng ngẫu nhiên và giả định là Host
    const randomRoomId = Math.floor(1000 + Math.random() * 9000).toString();
    setRoomData(randomRoomId, true);
    onCreateRoomPress();
  };

  const handleGoToJoin = () => {
    if (!name.trim()) return alert("Nhập tên trước khi vào phòng nhé!");
    updateUser({ nickname: name, avatar: avatar });
    
    // Gọi callback để App.jsx chuyển sang màn hình nhập mã
    onJoinPress(); 
  };

  return (
    <div className="min-h-screen max-w-md mx-auto flex flex-col items-center px-8 pt-16 pb-12">
      {/* Logo Section */}
      <div className="flex flex-col items-center mb-12">
        <div className="w-20 h-20 bg-primary-orange rounded-2xl flex items-center justify-center shadow-2xl rotate-12 mb-6">
          <div className="grid grid-cols-2 gap-1.5 p-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="w-2 h-2 bg-white rounded-full" />)}
          </div>
        </div>
        <h1 className="text-4xl font-black text-primary-orange tracking-tight mb-2">
          Bầu Cua Tôm Cá
        </h1>
        <p className="text-gray-500 font-medium">Cùng bạn bè sát phạt!</p>
      </div>

      {/* Input Section */}
      <div className="w-full space-y-8">
        <div>
          <label className="block text-sm font-bold text-gray-600 uppercase tracking-wider mb-2 ml-1">
            Tên của bạn
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nhập tên của bạn..."
            className="w-full bg-white border-2 border-input-border rounded-3xl py-4 px-6 text-center focus:border-primary-orange focus:outline-none transition-all shadow-sm text-lg"
          />
        </div>

        <AvatarSelector selected={avatar} onSelect={setAvatar} />

        {/* Action Buttons */}
        <div className="flex flex-col space-y-4 pt-4">
          <button
            onClick={handleCreateRoom}
            className="w-full bg-primary-orange text-white font-bold py-4 rounded-full shadow-button hover:bg-secondary-orange active:scale-95 transition-all flex items-center justify-center space-x-2 text-lg"
          >
            <span className="text-xl">⊕</span>
            <span>Tạo Phòng Mới</span>
          </button>
          
          <button
            onClick={handleGoToJoin}
            className="w-full bg-[#FEEBE5] text-primary-orange font-bold py-4 rounded-full hover:bg-[#FDDED4] active:scale-95 transition-all flex items-center justify-center space-x-2 text-lg"
          >
            <span>🔑</span>
            <span>Vào Phòng Bằng Mã</span>
          </button>
        </div>
      </div>
      
      {/* Footer hint */}
      {user.nickname && (
        <p className="mt-8 text-xs text-gray-400 italic">
          Chào mừng trở lại, {user.nickname}!
        </p>
      )}
    </div>
  );
}