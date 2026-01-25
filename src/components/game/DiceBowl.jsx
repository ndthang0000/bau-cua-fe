import { motion } from 'framer-motion';
import { useState } from 'react';

export default function DiceBowl() {
  const [isOpen, setIsOpen] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center py-6 relative">
      {/* Vòng tròn tách biệt nền */}
      <div className="w-56 h-56 rounded-full bg-[#111] border-[1px] border-gray-800 shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] flex items-center justify-center relative">
        
        {/* Đĩa gỗ bên dưới */}
        <div className="w-48 h-48 rounded-full bg-[#222] border-4 border-[#1a1a1a] shadow-xl flex items-center justify-center">
          
          {/* Xúc xắc (Kết quả) */}
          <div className="flex gap-1">
            {['🦌', '🦀', '🐓'].map((s, i) => (
              <div key={i} className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-xl shadow-inner">
                {s}
              </div>
            ))}
          </div>

          {/* Cái Bát (Phần nắp che) */}
          <motion.div
            animate={
              isShaking 
              ? { x: [0, -5, 5, -5, 5, 0], y: [0, -2, 2, -2, 2, 0] } 
              : isOpen ? { y: -150, opacity: 0 } : { y: 0, opacity: 1 }
            }
            transition={isShaking ? { repeat: Infinity, duration: 0.2 } : { duration: 0.5 }}
            className="absolute inset-0 w-full h-full flex items-center justify-center z-10 cursor-pointer"
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="w-40 h-40 bg-gradient-to-b from-gray-200 to-gray-400 rounded-full shadow-2xl border-b-8 border-gray-500 relative flex items-center justify-center">
               <div className="w-32 h-32 rounded-full border-2 border-white/20" />
               <div className="absolute top-4 w-4 h-2 bg-white/40 rounded-full" />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mt-4 text-center">
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
           {isShaking ? 'Đang xóc...' : 'Chạm vào bát để mở'}
        </p>
      </div>
    </div>
  );
}