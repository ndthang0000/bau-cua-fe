import React from 'react';

const AVATARS = ['😊', '🐾', '👶', '😃', '😎', '🤡', '🦊', '🐯'];

export default function AvatarSelector({ selected, onSelect }) {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">Chọn linh vật</span>
        <span className="text-xs text-gray-400">{AVATARS.length} mẫu có sẵn</span>
      </div>
      <div className="flex space-x-4 overflow-x-auto no-scrollbar py-2">
        {AVATARS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-3xl border-4 transition-all
              ${selected === emoji 
                ? 'border-primary-orange bg-white scale-110 shadow-lg' 
                : 'border-transparent bg-gray-100 hover:bg-gray-200'}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}