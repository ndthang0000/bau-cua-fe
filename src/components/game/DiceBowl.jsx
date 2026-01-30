import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';

const mappingText = {
  ga: 'Gà',
  bau: 'Bầu',
  cua: 'Cua',
  tom: 'Tôm',
  ca: 'Cá',
  nai: 'Nai'
}

export default function DiceBowl({ status, result }) {
  const controls = useAnimation();
  const isShaking = status === 'shaking';
  const isBetting = status === 'betting';
  const isResult = status === 'result';
  const {room} = useGameStore();
  const timeLeft = room?.timeLeft ?? 0;
  // Hàm map icon linh vật
  const getIcon = (name) => {
    const icons = { bau: '🎃', cua: '🦀', tom: '🦐', ca: '🐟', ga: '🐓', nai: '🦌' };
    return icons[name] || '❓';
  };

  useEffect(() => {
    const runAnimation = async () => {
      if (isShaking) {
        await controls.start({
          y: 0, x: 0, rotate: 0, opacity: 1,
          transition: { duration: 0.2 }
        });
        controls.start({
          x: [0, -5, 5, -5, 5, 0],
          y: [0, 2, -2, 2, -2, 0],
          rotate: [0, -3, 3, -3, 3, 0],
          transition: { duration: 0.1, repeat: Infinity, ease: "linear" }
        });
      } 
      else if (isResult) {
        // GIAI ĐOẠN 1: Nhích nhẹ tạo sự kịch tính (1.5 giây)
        await controls.start({
          y: -30,
          x: 5,
          rotate: 5,
          transition: { duration: 1, ease: "easeOut" }
        });

        // GIAI ĐOẠN 2: Tung nắp ra hết
        await controls.start({
          y: -200,
          x: 50,
          rotate: 30,
          opacity: 0,
          transition: { duration: 0.6, ease: "backIn" }
        });
      } 
      else if (isBetting) {
        // Đang cược thì luôn mở nắp
        controls.set({ y: -200, opacity: 0 });
      } 
      else {
        // Trạng thái chờ ván mới: Đóng bát
        controls.start({ y: 0, x: 0, rotate: 0, opacity: 1, transition: { duration: 0.5 } });
      }
    };

    runAnimation();
  }, [status, controls, timeLeft]);

  return (
    <div className="flex flex-col items-center justify-center py-6 relative">
      <div className="w-56 h-56 rounded-full bg-[#111] border-[1px] border-gray-800 shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] flex items-center justify-center relative">
        <div className="w-48 h-48 rounded-full bg-[#222] border-4 border-[#1a1a1a] shadow-xl flex items-center justify-center relative overflow-hidden">
          
          {/* HIỂN THỊ KẾT QUẢ XÚC XẮC */}
          <div className="flex gap-1 z-0">
            {/* Sửa lỗi: Hiển thị kết quả nếu CÓ dữ liệu, bất kể status là gì để tránh bị mất hình khi đang mở nắp */}
            {result && result.length > 0 ? (
              result.map((s, i) => (
                <motion.div 
                  key={`${i}-${s}`}
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 1.2, type: 'spring' }} // Delay để hiện ra đúng lúc nắp nhích xong
                  className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-2xl shadow-inner"
                >
                  {getIcon(s)}
                </motion.div>
              ))
            ) : (
              // Chỉ hiện "Chờ..." khi thực sự không có kết quả cũ/mới nào
              <span className="text-gray-700 text-[10px] italic opacity-40 uppercase font-black">
                {isShaking ? "Đang lắc..." : "Sẵn sàng"}
              </span>
            )}
          </div>

          {/* TIMER ĐẾM NGƯỢC (Chỉ hiện khi betting & mode auto có timer) */}
          <AnimatePresence>
            {isBetting && room?.config?.playMode !== 'manual' && timeLeft > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center z-20 bg-black/40 backdrop-blur-[2px]"
              >
                <div className="w-20 h-20 rounded-full border-4 border-primary-orange bg-black/90 flex flex-col items-center justify-center shadow-[0_0_20px_rgba(255,87,34,0.5)]">
                  <span className="text-[8px] font-black text-primary-orange uppercase">Cược</span>
                  <span className="text-3xl font-black text-white leading-none">{timeLeft}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CÁI BÁT (NẮP CHE) */}
          <motion.div
            animate={controls}
            className="absolute inset-0 w-full h-full flex items-center justify-center z-10 pointer-events-none"
          >
            <div className="w-40 h-40 bg-gradient-to-b from-gray-200 to-gray-400 rounded-full shadow-2xl border-b-8 border-gray-500 relative flex items-center justify-center">
              <div className="w-32 h-32 rounded-full border-2 border-white/20" />
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <span className="text-xl font-black text-black rotate-12 uppercase">Bầu Cua</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="mt-4 text-center h-4">
        <p className={`text-[10px] font-bold uppercase tracking-widest ${isShaking ? 'text-yellow-500' : isBetting ? 'text-green-500' : 'text-gray-400'}`}>
           {isShaking ? '🚀 Đang xóc...' : isBetting ? '💰 Đặt cược đi!' : isResult ? `🧐 Kết quả là: ${room.lastResult?.map(item => mappingText[item])?.join(', ')}` : '⏳ Đang chờ cái...'}
        </p>
      </div>
    </div>
  );
}