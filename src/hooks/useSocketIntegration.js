import { useEffect } from 'react';
import { socket } from '../socket';
import { useGameStore } from '../store/useGameStore';
import { toast } from 'react-hot-toast';

export const useSocketIntegration = () => {
  const { setMembers, updateRoomStatus, setRoomData, addRecentRoom, updateTimer } = useGameStore();

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }


    socket.on('timer_update', (timeLeft) => {
      updateTimer(timeLeft);
    });

    // 1. Xử lý cập nhật phòng (QUAN TRỌNG NHẤT)
    const onRoomUpdate = (room) => {
      console.log("🎯 Dữ liệu phòng mới nhận được:", room);
      if (room) {
        if (room.members) setMembers(room.members);
        setRoomData(room);

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

    // ĐĂNG KÝ LISTENERS
    socket.on('room_update', onRoomUpdate);
    socket.on('game_status', onGameStatus);
    socket.on('error_msg', onErrorMsg);

    return () => {
      // CLEANUP
      socket.offAny();
      socket.off('room_update', onRoomUpdate);
      socket.off('game_status', onGameStatus);
      socket.off('error_msg', onErrorMsg);
      socket.off('game_result_individual');
      socket.off('timer_update');
    };
  }, [setMembers, updateRoomStatus, setRoomData, addRecentRoom]);
};