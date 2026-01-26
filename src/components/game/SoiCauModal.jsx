import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

const ICONS = {
  bau: '🎃', cua: '🦀', ca: '🐟', ga: '🐓', tom: '🦐', nai: '🦌'
};

const NAMES = {
  bau: 'BẦU', cua: 'CUA', ca: 'CÁ', ga: 'GÀ', tom: 'TÔM', nai: 'NAI'
};

export default function SoiCauModal({ isOpen, onClose }) {
  // Lấy room từ store thay vì gameHistory (vì history nằm trong room)
  const { history=[] } = useGameStore();
  // TÍNH TOÁN THỐNG KÊ TỶ LỆ (%)
  const stats = useMemo(() => {
    const counts = { bau: 0, cua: 0, ca: 0, ga: 0, tom: 0, nai: 0 };
    let totalItems = 0;

    history.forEach(round => {
      round.result.forEach(item => {
        if (counts[item] !== undefined) {
          counts[item]++;
          totalItems++;
        }
      });
    });

    return Object.keys(counts).map(key => ({
      id: key,
      name: NAMES[key],
      icon: ICONS[key],
      // Nếu chưa có ván nào thì để 0%, tránh lỗi chia cho 0
      rate: totalItems > 0 ? Math.round((counts[key] / totalItems) * 100) : 0
    }));
  }, [history]);

  // Format thời gian hiển thị
  const formatTime = (timeData) => {
    if (!timeData) return "--:--";
    const date = new Date(timeData.$date || timeData);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  useEffect(() => {
        if (isOpen) {
          document.body.classList.add('modal-open');
        } else {
          document.body.classList.remove('modal-open');
        }
        return () => document.body.classList.remove('modal-open');
  }, [isOpen]);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-[60] backdrop-blur-sm"
          />

          <motion.div
            drag="y" // Cho phép kéo theo trục Y
            dragConstraints={{ top: 0 }} // Không cho kéo lên trên quá mức
            dragElastic={0.2} // Độ co giãn khi kéo
            onDragEnd={(event, info) => {
              // Nếu kéo xuống hơn 100px thì đóng Modal
              if (info.offset.y > 100) {
                onClose();
              }
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#121212] rounded-t-[40px] z-[101] flex flex-col h-[90dvh] touch-none"
          >
            {/* VÙNG TAY CẦM (HANDLE) - CHỈ CHO PHÉP KÉO Ở ĐÂY HOẶC HEADER */}
            <div className="w-full pt-4 pb-2 bg-[#121212] flex-shrink-0 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 bg-gray-700 rounded-full mx-auto" />
            </div>

            {/* NỘI DUNG - SỬ DỤNG onPointerDown ĐỂ CHẶN DRAG KHI ĐANG CUỘN */}
            <div 
              className="p-6 overflow-y-auto no-scrollbar flex-1"
              onPointerDown={(e) => e.stopPropagation()} // QUAN TRỌNG: Chặn sự kiện drag của cha khi chạm vào vùng nội dung
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-black text-yellow-400 tracking-tight">THỐNG KÊ SOI CẦU</h2>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                    Dựa trên {history.length} phiên gần nhất
                  </p>
                </div>
                <button onClick={onClose} className="p-2 bg-gray-800 rounded-full text-gray-400">
                  <X size={20} />
                </button>
              </div>

              {/* GRID THỐNG KÊ - Thêm layout để tránh bị nhảy layout khi animate */}
              <div className="mb-8 grid grid-cols-3 gap-3">
                {stats.map((item) => (
                  <div key={item.id} className="bg-[#222] rounded-2xl p-3 flex flex-col items-center border border-gray-800">
                    <div className="w-10 h-10 bg-[#111] rounded-xl flex items-center justify-center text-2xl mb-2 shadow-inner">
                      {item.icon}
                    </div>
                    <p className="text-[9px] font-bold text-gray-400 whitespace-nowrap">
                      {item.name}: <span className="text-orange-500">{item.rate}%</span>
                    </p>
                    <div className="w-full bg-gray-800 h-1 rounded-full mt-2 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.rate}%` }}
                        transition={{ delay: 0.3, duration: 0.5 }} // Thêm delay để tránh animate cùng lúc với lúc mở modal
                        className="bg-orange-500 h-full" 
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* PHẦN LỊCH SỬ - Đưa ra ngoài table để tối ưu render */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-4 h-0.5 bg-orange-500 rounded-full" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Lịch sử mở bát</span>
                </div>
                
                <div className="bg-[#111] rounded-3xl border border-gray-800 overflow-hidden">
                   {/* Giới hạn chiều cao và dùng scroll riêng cho table nếu cần */}
                   <div className="max-h-[300px] overflow-y-auto">
                      <table className="w-full text-center border-collapse">
                         <thead className="sticky top-0 bg-[#111] z-10">
                        <tr className="border-b border-gray-800">
                          <th className="py-3 text-[9px] font-black text-gray-600 uppercase">Lượt</th>
                          <th className="py-3 text-[9px] font-black text-gray-600 uppercase">Kết quả</th>
                          <th className="py-3 text-[9px] font-black text-gray-600 uppercase text-right px-4">Giờ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.length > 0 ? history.map((row, idx) => (
                          <tr key={row.roundId || idx} className="border-b border-gray-800/50 last:border-0">
                            <td className="py-3 text-[10px] font-bold text-gray-500 italic">#{row.roundId}</td>
                            <td className="py-3">
                              <div className="flex justify-center gap-1">
                                {row.result.map((res, i) => (
                                  <span key={i} className="w-6 h-6 bg-gray-800 rounded-full flex items-center justify-center text-xs shadow-inner">
                                    {ICONS[res]}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 text-[9px] font-medium text-gray-600 text-right px-4">
                              {formatTime(row.time)}
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan="3" className="py-10 text-gray-600 text-[10px] italic">Chưa có dữ liệu ván đấu</td>
                          </tr>
                        )}
                      </tbody>
                      </table>
                   </div>
                </div>
              </div>

              <button 
                onClick={onClose}
                className="w-full bg-primary-orange py-4 rounded-[24px] font-black text-sm uppercase tracking-widest active:scale-95 transition-transform mt-2 mb-4"
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