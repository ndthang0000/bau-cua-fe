import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { socket } from '../../socket';

const ICONS = { bau: '🎃', cua: '🦀', ca: '🐟', ga: '🐓', tom: '🦐', nai: '🦌' };


export default function BetHistoryModal({ isOpen, onClose }) {
  const { roomMembers, user, room } = useGameStore();
  const [activeTab, setActiveTab] = useState('mine'); 
  const [selectedUserId, setSelectedUserId] = useState('all');

  const [historyList, setHistoryList] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Nhóm các bet theo roundId
  const groupedHistory = useMemo(() => {
    const groups = {};
    historyList.forEach(item => {
      if (!groups[item.roundId]) {
        groups[item.roundId] = {
          roundId: item.roundId,
          results: item.results,
          createdAt: item.createdAt,
          bets: []
        };
      }
      groups[item.roundId].bets.push(item);
    });
    const groupedArray = Object.values(groups);
    groupedArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Sắp xếp theo thời gian tạo
    return groupedArray;
  }, [historyList]);

  // Tính toán tổng lợi nhuận dựa trên danh sách đang hiển thị
  const totalProfit = useMemo(() => {
    return historyList.reduce((acc, item) => {
      // Lợi nhuận = Tiền thắng - Tiền cược (Nếu thua winAmount = 0)
      const profit =  item.winAmount -item.amount;
      return acc + profit;
    }, 0);
  }, [historyList]);

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

  useEffect(() => {
    if (isOpen) {
      setHasMore(true);
      fetchHistory(true);
    }
  }, [isOpen, activeTab, selectedUserId]);

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
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(event, info) => {
              if (info.offset.y > 100) onClose();
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#121212] rounded-t-[40px] z-[101] flex flex-col h-[90dvh] touch-none shadow-2xl"
          >
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-4 mb-2" />

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

            <div 
                className="flex-1 overflow-y-auto px-6 space-y-6 pb-32 no-scrollbar" 
                onScroll={handleScroll}
                onPointerDown={(e) => e.stopPropagation()} // Chặn drag khi đang cuộn list
            >
              {groupedHistory.map((group) => (
                <div key={group.roundId} className="space-y-3">
                  {/* Header cho mỗi round */}
                  <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-500/10 to-transparent rounded-2xl border-l-4 border-primary-orange">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-orange/20 flex items-center justify-center">
                        <span className="text-primary-orange font-black text-xs">#{group.roundId}</span>
                      </div>
                      <div>
                        <p className="text-white font-bold text-xs">Ván #{group.roundId}</p>
                        <p className="text-[9px] text-gray-500">
                          {new Date(group.createdAt).toLocaleTimeString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xl">
                      {group.results.map((result, idx) => (
                        <span key={idx}>{ICONS[result]}</span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Các bet trong round này */}
                  <div className="space-y-3 pl-2">
                    {group.bets.map((item) => (
                      <BetCard key={item._id?.$oid || item._id} item={item} />
                    ))}
                  </div>
                </div>
              ))}

              {isLoading && (
                <p className="text-center text-gray-500 text-xs animate-pulse">Đang tải...</p>
              )}

              {!hasMore && historyList.length > 0 && (
                <p className="text-center text-gray-600 text-[10px] uppercase tracking-tighter opacity-50">
                  — Đã hiển thị tất cả lịch sử —
                </p>
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 bg-[#121212] border-t border-white/5 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase">Tổng kết (Trang này)</p>
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
  const isWin = item.status === 'win';
  const isPending = item.status === 'pending';
  // Lợi nhuận thực tế hiển thị
  const displayProfit =  item.winAmount  -item.amount;

  return (
    <div className="bg-[#1A1A1A] p-5 rounded-[28px] border border-white/5 shadow-sm">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          {/* Avatar hoặc Icon Linh vật đặt cược */}
          <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-2xl border border-white/10 shadow-inner">
            {ICONS[item.door] || '❓'}
          </div>
          
          <div>
            <p className="text-white font-bold text-sm flex items-center gap-2">
              {item.nickname}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Đặt <span className="text-white font-bold">{(item.amount / 1000).toLocaleString()}k</span> vào <span className="uppercase text-orange-400">{item.door}</span> 
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className={`font-black text-sm ${isWin ? 'text-green-500' : 'text-red-500'}`}>
            {isWin ? '+' : ''}{displayProfit.toLocaleString()}đ
          </span>
          <div className={`text-[9px] font-black px-2 py-0.5 rounded-full mt-2 uppercase text-center ${isWin ? 'bg-green-500/10 text-green-500' : (isPending ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500')}`}>
            {isWin ? 'Thắng' : (isPending ? 'Đang chờ' : 'Thua')}
          </div>
        </div>
      </div>
    </div>
  );
}