import { motion } from 'framer-motion';

/**
 * Component hiển thị khi dealer đang lắc điện thoại
 */
export default function ShakeIndicator({ isShaking }) {
  if (!isShaking) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm pointer-events-none"
    >
      <div className="flex flex-col items-center gap-4">
        <motion.div
          animate={{
            rotate: [-5, 5, -5],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 0.2,
            repeat: Infinity,
            ease: "linear"
          }}
          className="text-8xl"
        >
          🎲
        </motion.div>
        
        <div className="bg-yellow-500/20 border-2 border-yellow-500 rounded-2xl px-6 py-3">
          <p className="text-yellow-500 font-black text-xl uppercase tracking-wider animate-pulse">
            Đang lắc...
          </p>
        </div>

        <p className="text-gray-400 text-xs italic">
          Dừng lắc 2 giây để mở bát
        </p>
      </div>
    </motion.div>
  );
}
