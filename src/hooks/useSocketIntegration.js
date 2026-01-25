import { useEffect } from 'react';
import { socket } from '../socket';
import { useGameStore } from '../store/useGameStore';
import { toast } from 'react-hot-toast'; // Đảm bảo bạn đã import toast nếu dùng

export const useSocketIntegration = () => {
  const { setMembers, updateRoomStatus, setRoomData } = useGameStore();

  useEffect(() => {
    // 1. Khởi tạo kết nối
    if (!socket.connected) {
      socket.connect();
    }

    // Kiểm tra ID ngay khi kết nối
    const handleConnect = () => {
      console.log("✅ Socket connected. ID:", socket.id);
    };

    socket.on('connect', handleConnect);
    if (socket.connected) handleConnect();

    // 2. Debug tất cả event (Hữu ích khi member join)
    socket.onAny((eventName, args) => {
      console.log(`📡 [AnyEvent]: ${eventName}`, args);
    });

    // 3. Định nghĩa các hàm xử lý logic
    const onRoomUpdate = (room) => {
      console.log("🎯 Cập nhật phòng từ Server:", room);
      if (room && room.members) setMembers(room.members);
      if (room) setRoomData(room);
    };

    const onGameStatus = (status) => {
      console.log("🎮 Trạng thái game mới:", status);
      updateRoomStatus(status);
    };

    const onGameResult = (data) => {
      console.log("🏆 Kết quả ván đấu:", data);
      setRoomData(data);
    };

    const onBetUpdate = ({ door, amount }) => {
      console.log(`💸 Bet update: Door ${door} - Amount ${amount}`);
      // Thêm logic update store của bạn ở đây nếu cần
    };

    const onErrorMsg = (msg) => {
      toast.error(msg, {
        icon: '🚫',
        style: {
          border: '1px solid #EF4444',
          padding: '16px',
          color: '#EF4444',
          background: '#FFF',
        },
      });
    };

    // 4. Đăng ký Listeners
    socket.on('room_update', onRoomUpdate);
    socket.on('game_status', onGameStatus);
    socket.on('game_result', onGameResult);
    socket.on('bet_update', onBetUpdate);
    socket.on('error_msg', onErrorMsg);

    // 5. Cleanup khi component unmount
    return () => {
      console.log("🧹 Cleaning up socket listeners...");
      socket.off('connect', handleConnect);
      socket.off('room_update', onRoomUpdate);
      socket.off('game_status', onGameStatus);
      socket.off('game_result', onGameResult);
      socket.off('bet_update', onBetUpdate);
      socket.off('error_msg', onErrorMsg);
      socket.offAny();
    };
  }, [setMembers, updateRoomStatus, setRoomData]);
  // Dependency này đảm bảo nếu Store thay đổi hàm, listener sẽ dùng hàm mới nhất.
};