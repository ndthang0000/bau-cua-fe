import { useEffect } from 'react';
import { socket } from '../socket';
import { useGameStore } from '../store/useGameStore';
import { toast } from 'react-hot-toast';

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
      }
    };

    // ĐĂNG KÝ LISTENERS
    socket.on('room_update', onRoomUpdate);
    socket.on('game_status', onGameStatus);
    socket.on('error_msg', onErrorMsg);
    socket.on('new_bet', onNewBet);
    socket.on('bet_cancelled', onBetCancelled);
    socket.on('phase_change', onPhaseChange);

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
    };
  }, [setMembers, updateRoomStatus, setRoomData, addRecentRoom, addLiveBet, removeLiveBet, clearLiveBets, clearBetRecords]);
};