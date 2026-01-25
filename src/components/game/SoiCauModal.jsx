import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

const STATS = [
  { id: 'bau', name: 'BẦU', icon: '🎃', rate: 18 },
  { id: 'cua', name: 'CUA', icon: '🦀', rate: 22 },
  { id: 'ca', name: 'CÁ', icon: '🐟', rate: 15 },
  { id: 'ga', name: 'GÀ', icon: '🐓', rate: 12 },
  { id: 'tom', name: 'TÔM', icon: '🦐', rate: 20 },
  { id: 'nai', name: 'NAI', icon: '🦌', rate: 13 },
];

export default function SoiCauModal({ isOpen, onClose }) {
  const { gameHistory } = useGameStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay nền mờ */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-[60] backdrop-blur-sm"
          />

          {/* Nội dung Modal */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#1A1A1A] rounded-t-[40px] z-[70] flex flex-col max-h-[90vh] border-t border-gray-800 shadow-2xl"
          >
            {/* Thanh kéo nhỏ phía trên cùng */}
            <div className="w-12 h-1.5 bg-gray-700 rounded-full mx-auto mt-4 mb-2" />

            <div className="p-6 overflow-y-auto no-scrollbar">
              {/* Header Modal */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-black text-yellow-400 tracking-tight">THỐNG KÊ SOI CẦU</h2>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Dữ liệu 100 phiên gần nhất</p>
                </div>
                <button onClick={onClose} className="p-2 bg-gray-800 rounded-full text-gray-400">
                  <X size={20} />
                </button>
              </div>

              {/* Thống kê linh vật (Grid 3x2) */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-4 h-0.5 bg-orange-500 rounded-full" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Thống kê linh vật</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {STATS.map((item) => (
                    <div key={item.id} className="bg-[#222] rounded-2xl p-4 flex flex-col items-center border border-gray-800">
                      <div className="w-12 h-12 bg-[#111] rounded-xl flex items-center justify-center text-3xl mb-3 shadow-inner">
                        {item.icon}
                      </div>
                      <p className="text-[10px] font-bold text-gray-400">{item.name}: <span className="text-orange-500">{item.rate}%</span></p>
                      <div className="w-full bg-gray-800 h-1 rounded-full mt-2 overflow-hidden">
                        <div className="bg-orange-500 h-full" style={{ width: `${item.rate}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bảng lịch sử mở bát */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-4 h-0.5 bg-orange-500 rounded-full" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bảng lịch sử mở bát</span>
                </div>
                <div className="bg-[#111] rounded-3xl overflow-hidden border border-gray-800">
                  <table className="w-full text-center border-collapse">
                    <thead>
                      <tr className="border-b border-gray-800">
                        <th className="py-4 text-[10px] font-black text-gray-600 uppercase tracking-widest">Lượt</th>
                        <th className="py-4 text-[10px] font-black text-gray-600 uppercase tracking-widest">Kết quả</th>
                        <th className="py-4 text-[10px] font-black text-gray-600 uppercase tracking-widest">Thời gian</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gameHistory.map((row) => (
                        <tr key={row.id} className="border-b border-gray-800/50 last:border-0">
                          <td className="py-4 text-xs font-bold text-gray-400 italic">#{row.id}</td>
                          <td className="py-4">
                            <div className="flex justify-center gap-1.5">
                              {row.results.map((r, i) => (
                                <span key={i} className="w-7 h-7 bg-gray-800 rounded-full flex items-center justify-center text-sm shadow-inner">{r}</span>
                              ))}
                            </div>
                          </td>
                          <td className="py-4 text-[10px] font-medium text-gray-600 italic tracking-tighter">
                            {row.time}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Nút đóng chân trang */}
              <button 
                onClick={onClose}
                className="w-full bg-primary-orange py-4 rounded-[24px] font-black text-sm uppercase tracking-widest shadow-lg shadow-orange-500/20 active:scale-95 transition-transform mt-4 mb-2"
              >
                Quay lại trò chơi
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}