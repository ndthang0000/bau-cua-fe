import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { socket } from '../../socket';

const ICONS = { bau: '🎃', cua: '🦀', ca: '🐟', ga: '🐓', tom: '🦐', nai: '🦌' };

export default function BetHistoryModal({ isOpen, onClose }) {
  const { roomMembers, user,room  } = useGameStore();
  const [activeTab, setActiveTab] = useState('mine'); // 'mine' | 'all'
  const [selectedUserId, setSelectedUserId] = useState('all');

  // States cho phân trang
  const [historyList, setHistoryList] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  let totalProfit = 0;

  const fetchHistory = (isNew = false) => {
    if (isLoading || (!hasMore && !isNew)) return;

    setIsLoading(true);
    const currentPage = isNew ? 1 : page;

    socket.emit('get_bet_history', {
      roomId: room.id,
      userId: user.id,
      filterType: activeTab,
      selectedUserId: selectedUserId,
      page: currentPage,
      limit: 10
    }, (response) => {
      setIsLoading(false);
      if (response.success) {
        if (isNew) {
          setHistoryList(response.data);
          setPage(2);
        } else {
          setHistoryList(prev => [...prev, ...response.data]);
          setPage(prev => prev + 1);
        }
        setHasMore(response.data.length === 10);
      }
    });
  };

  // Reset và fetch lại khi thay đổi filter
  useEffect(() => {
    if (isOpen) {
      setHasMore(true);
      fetchHistory(true);
    }
  }, [isOpen, activeTab, selectedUserId]);

  // Xử lý Infinite Scroll (Cuộn tới cuối list để load thêm)
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50 && hasMore && !isLoading) {
      fetchHistory();
    }
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
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm"
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
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-4 mb-2" />

            {/* Header Tabs */}
            <div className="p-6">
              <h2 className="text-center text-white text-2xl font-black uppercase mb-6 tracking-tight">
                Lịch Sử Đặt Cược
              </h2>

              <div className="flex bg-[#1F1F1F] p-1 rounded-2xl mb-6">
                <button
                  onClick={() => setActiveTab('mine')}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'mine' ? 'bg-primary-orange text-white shadow-lg' : 'text-gray-500'}`}
                >
                  CỦA TÔI
                </button>
                <button
                  onClick={() => setActiveTab('all')}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'all' ? 'bg-[#333] text-white' : 'text-gray-500'}`}
                >
                  CẢ PHÒNG
                </button>
              </div>

              {/* Selector Thành viên (Chỉ hiện khi chọn Cả phòng) */}
              {activeTab === 'all' && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Chọn thành viên</p>
                  <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                    <MemberCircle
                      name="Tất cả"
                      active={selectedUserId === 'all'}
                      onClick={() => setSelectedUserId('all')}
                      icon="👥"
                    />
                    {roomMembers.map(m => (
                      <MemberCircle
                        key={m.userId}
                        name={m.nickname}
                        avatar={m.avatar}
                        active={selectedUserId === m.userId}
                        onClick={() => setSelectedUserId(m.userId)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Danh sách Bet */}
            <div className="flex-1 overflow-y-auto px-6 space-y-4 pb-32" onScroll={handleScroll}>
              {historyList.map((item) => (
                <BetCard key={item._id} item={item} />
              ))}

              {isLoading && (
                <p className="text-center text-gray-500 text-xs animate-pulse">Đang tải...</p>
              )}

              {!hasMore && historyList.length > 0 && (
                <p className="text-center text-gray-600 text-[10px] uppercase tracking-tighter opacity-50">
                  — Đã hiện thị tất cả lịch sử —
                </p>
              )}
            </div>

            {/* Footer Summary */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-[#121212] border-t border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase">Tổng kết kỳ này</p>
                <p className={`text-xl font-black ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {totalProfit >= 0 ? '↗' : '↘'} {totalProfit > 0 ? '+' : ''}{totalProfit.toLocaleString()}đ
                </p>
              </div>
              <button
                onClick={onClose}
                className="bg-primary-orange text-white px-10 py-4 rounded-3xl font-black text-lg shadow-lg active:scale-95 transition-all"
              >
                ĐÓNG
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function MemberCircle({ name, avatar, icon, active, onClick }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 flex-shrink-0">
      <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center text-xl transition-all ${active ? 'border-primary-orange bg-primary-orange/10' : 'border-white/5 bg-[#1F1F1F]'}`}>
        {avatar || icon}
      </div>
      <span className={`text-[10px] font-bold ${active ? 'text-primary-orange' : 'text-gray-500'}`}>{name}</span>
    </button>
  );
}

function BetCard({ item }) {
  return (
    <div className="bg-[#1A1A1A] p-5 rounded-[32px] border border-white/5 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-sm border border-white/10">👤</div>
          <div>
            <p className="text-white font-bold text-sm">{item.user} <span className="text-gray-600 font-medium ml-1">#{item.id}</span></p>
            <div className="flex gap-1 mt-1">
              {/* {item?.results?.map((r, i) => (
                <span key={i} className="text-xs grayscale-[0.5]">{ICONS[r]}</span>
              ))} */}
            </div>
          </div>
        </div>
        <span className={`font-black text-sm ${item.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {item.profit > 0 ? '+' : ''}{item.profit >= 1000000 ? (item.profit / 1000000).toFixed(1) + 'M' : (item.profit / 1000).toFixed(0) + 'k'}
        </span>
      </div>

      <div className="space-y-1 border-t border-white/5 pt-3">
        {Object.entries(item.door).map(([door, amount]) => (
          <div key={door} className="flex justify-between text-xs">
            <span className="text-gray-500 font-bold uppercase">{door}: <span className="text-white">{amount / 1000}k</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}