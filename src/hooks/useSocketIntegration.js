import { useEffect } from 'react';
import { socket } from '../socket';
import { useGameStore } from '../store/useGameStore';
import { toast } from 'react-hot-toast';
import { SOUNDS } from './useSound';

export const useSocketIntegration = () => {
  const {
    setMembers,
    updateRoomStatus,
    setRoomData,
    addRecentRoom,
    updateTimer,
    updateRoomConfig,
    addLiveBet,
    removeLiveBet,
    clearLiveBets,
    clearBetRecords
  } = useGameStore();

  // Helper để phát âm thanh
  const playSound = (soundKey, volume = 0.5) => {
    try {
      const audio = new Audio(`/sounds/${soundKey}.mp3`);
      audio.volume = volume;
      audio.play().catch(err => console.warn('Sound error:', err));
    } catch (err) {
      console.warn('Cannot play sound:', err);
    }
  };

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }


    socket.on('timer_update', (timeLeft) => {
      updateTimer(timeLeft);
    });

    // Lưu trạng thái cũ để detect status change
    let prevStatus = useGameStore.getState().room?.status;

    // 1. Xử lý cập nhật phòng (QUAN TRỌNG NHẤT)
    const onRoomUpdate = (room) => {
      if (room) {
        // Detect status change to betting -> clear old bets
        const currentStatus = useGameStore.getState().room?.status;
        if (room.status === 'betting' && currentStatus !== 'betting') {
          console.log('🔄 Status changed to betting - clearing old bets');
          clearLiveBets();
          clearBetRecords();
          useGameStore.getState().resetMyBets();
        }

        if (room.members) setMembers(room.members);
        setRoomData(room);
        if (room.roomConfig) updateRoomConfig(room.roomConfig);
        // Lưu vào danh sách phòng gần đây
        addRecentRoom({
          id: room.roomId,
          players: room.members.length,
          avatars: room.members.map(m => m.avatar).slice(0, 3)
        });
      }
    };

    const onGameStatus = (status) => {
      console.log("🎮 Trạng thái ván đấu:", status);
      updateRoomStatus(status);
    };

    const onErrorMsg = (msg) => {
      console.error("❌ Lỗi từ Server:", msg);
      toast.error(msg);
    };

    // 2. Xử lý bet mới từ người chơi khác
    const onNewBet = (betData) => {
      console.log("🎲 New bet:", betData);
      addLiveBet({
        betId: betData.betId,
        userId: betData.userId,
        nickname: betData.nickname,
        avatar: betData.avatar,
        door: betData.door,
        amount: betData.amount,
        timestamp: betData.timestamp || new Date().toISOString()
      });

      // Phát âm thanh khi có lệnh cược mới
      playSound('new-bet', 0.3);
    };

    // 3. Xử lý khi có bet bị hủy
    const onBetCancelled = (data) => {
      console.log("❌ Bet cancelled:", data);
      removeLiveBet(data.betId);
    };

    // 4. Xử lý chuyển phase - clear bets khi ván mới
    const onPhaseChange = (data) => {
      console.log("🔄 Phase change:", data);
      if (data.phase === 'betting') {
        // Khi bắt đầu ván mới, xóa live bets cũ
        clearLiveBets();
        clearBetRecords();
        // Phát âm thanh ván mới
        playSound('new-round', 0.5);
      } else if (data.phase === 'result') {
        // Phát âm thanh mở bát
        playSound('bowl-open', 0.6);
      }
      // Hiện thông báo phase change
      if (data.message) {
        toast(data.message, { icon: '🎮' });
      }
    };

    // 5. Thông báo dealer mới và cập nhật state
    const onNewDealer = (data) => {
      console.log("👑 New dealer:", data);
      // Cập nhật currentDealer trong room state để UI re-render
      if (data.dealer) {
        setRoomData({ currentDealer: data.dealer });
      }
      if (data.msg) {
        toast(data.msg, { icon: '👑', duration: 4000 });
      }
    };

    // 6. Kết quả cho dealer
    const onDealerResult = (data) => {
      console.log("💰 Dealer result:", data);
      if (data.profit > 0) {
        toast.success(`Nhà cái thắng: +${data.profit.toLocaleString()}đ`);
      } else if (data.profit < 0) {
        toast.error(`Nhà cái thua: ${data.profit.toLocaleString()}đ`);
      }
    };

    // ĐĂNG KÝ LISTENERS
    socket.on('room_update', onRoomUpdate);
    socket.on('game_status', onGameStatus);
    socket.on('error_msg', onErrorMsg);
    socket.on('new_bet', onNewBet);
    socket.on('bet_cancelled', onBetCancelled);
    socket.on('phase_change', onPhaseChange);
    socket.on('new_dealer', onNewDealer);
    socket.on('dealer_result', onDealerResult);

    return () => {
      // CLEANUP
      socket.offAny();
      socket.off('room_update', onRoomUpdate);
      socket.off('game_status', onGameStatus);
      socket.off('error_msg', onErrorMsg);
      socket.off('game_result_individual');
      socket.off('timer_update');
      socket.off('new_bet', onNewBet);
      socket.off('bet_cancelled', onBetCancelled);
      socket.off('phase_change', onPhaseChange);
      socket.off('new_dealer', onNewDealer);
      socket.off('dealer_result', onDealerResult);
    };
  }, [setMembers, updateRoomStatus, setRoomData, addRecentRoom, addLiveBet, removeLiveBet, clearLiveBets, clearBetRecords]);
};