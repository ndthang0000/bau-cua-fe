import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export const useGameStore = create(
  persist(
    (set) => ({
      // --- IDENTITY ---
      user: {
        id: null,
        nickname: '',
        avatar: '😊',
        balance: 1000000,
      },

      // --- ROOM DATA ---
      room: {
        id: null,
        isHost: false,
        status: 'waiting', // waiting, shaking, betting, result
        timeRemaining: 0,  // Đếm ngược thời gian cược
        currentDealer: null,
        timeLeft: 0,
        hostId: null,
      },
      selectedChip: 10000, // Mặc định là chip 10k
      // --- REAL-TIME DATA (Sẽ được Server cập nhật) ---
      roomMembers: [],
      recentRooms: [],
      currentResult: [], // Kết quả 3 xúc xắc ván vừa rồi
      myBets: {},        // Lưu cược của bản thân ván hiện tại: { bau: 50, cua: 20 }
      roomConfig: {
        name: '',
        maxPlayers: 15,
        startingBalance: 100000,
        dealerMode: 'rotate', // 'fixed' | 'rotate'
        playMode: 'auto', // 'auto' | 'manual'
        rotateRounds: 3,
        minBet: 5000,
        maxBet: 50000,
      },

      // --- ACTIONS ---

      initUser: () => set((state) => {
        if (state.user.id) return state; // Nếu có rồi thì thôi
        return { user: { ...state.user, id: uuidv4() } };
      }),

      updateUser: (data) =>
        set((state) => ({ user: { ...state.user, ...data } })),

      setRoomData: (roomData) => set((state) => {
        // Nếu dữ liệu rỗng thì không làm gì cả
        if (!roomData) return state;

        // Xác định ID phòng linh hoạt (hỗ trợ cả roomId và id)
        const newId = roomData.roomId || roomData.id || state.room?.id;

        // Tính toán isHost dựa trên dữ liệu mới nhất hoặc cũ nhất có thể
        const currentHostId = roomData.hostId || state.room?.hostId;
        const isHost = currentHostId === state.user?.id;

        return {
          // 1. Cập nhật Room: Giữ lại state cũ, chỉ ghi đè những gì server gửi lên
          room: {
            ...(state.room || {}), // Bảo vệ các trường cũ
            id: newId,
            hostId: currentHostId,
            isHost: isHost,
            // Dùng cú pháp ?? (Nullish coalescing) để lấy dữ liệu mới nếu có, không thì giữ cũ
            config: roomData.config ?? state.room?.config,
            status: roomData.status ?? state.room?.status,
            currentDealer: roomData.currentDealer ?? state.room?.currentDealer,
            lastResult: roomData.lastResult ?? state.room?.lastResult,
            timeLeft: state.room?.timeLeft ?? roomData.timeLeft,
            totalBets: roomData.totalBets ?? state.room?.totalBets,
          },

          // 2. Cập nhật các mảng dữ liệu bên ngoài room object
          history: roomData.history ?? state.history,
          roomMembers: roomData.members ?? state.roomMembers,

          // 3. Tự động reset myBets khi status chuyển từ 'result' sang 'betting'
          // (Logic này giúp FE tự dọn cược cũ của bản thân khi ván mới bắt đầu)
          myBets: (state.room?.status === 'result' && roomData.status === 'betting')
            ? {}
            : state.myBets
        };
      }),

      updateRoomStatus: (status) =>
        set((state) => ({ room: { ...state.room, status } })),

      setMembers: (members) => set({ roomMembers: members }),

      addRecentRoom: (roomInfo) => set((state) => ({
        recentRooms: [roomInfo, ...state.recentRooms.filter(r => r.id !== roomInfo.id)].slice(0, 3)
      })),

      updateTimer: (timeLeft) => set((state) => ({
        room: state.room ? { ...state.room, timeLeft } : null
      })),

      // --- ACTIONS ---
      setSelectedChip: (amount) => set({ selectedChip: amount }),
      // Đặt cược cục bộ (trước khi gửi lên server)
      placeBet: (door, amount) => set((state) => ({
        myBets: { ...state.myBets, [door]: (state.myBets[door] || 0) + amount },
        user: { ...state.user, balance: state.user.balance - amount }
      })),

      addMyBet: (door, amount) => set((state) => ({
        myBets: {
          ...state.myBets,
          [door]: (state.myBets[door] || 0) + amount
        }
      })),
      resetMyBets: () => set({ myBets: {}, myBetRecords: [] }),

      // === BET RECORDS (để track từng lệnh bet với betId cho việc cancel) ===
      myBetRecords: [], // Array of { betId, door, amount, timestamp }

      addBetRecord: (betRecord) => set((state) => ({
        myBetRecords: [...state.myBetRecords, betRecord]
      })),

      removeBetRecord: (betId) => set((state) => ({
        myBetRecords: state.myBetRecords.filter(bet => bet.betId !== betId)
      })),

      clearBetRecords: () => set({ myBetRecords: [] }),

      // === LIVE BETS từ các player khác (để hiển thị realtime) ===
      liveBets: [], // Array of { userId, nickname, avatar, door, amount, timestamp }

      addLiveBet: (bet) => set((state) => ({
        liveBets: [...state.liveBets.slice(-20), bet] // Giữ tối đa 20 bet gần nhất
      })),

      removeLiveBet: (betId) => set((state) => ({
        liveBets: state.liveBets.filter(bet => bet.betId !== betId)
      })),

      clearLiveBets: () => set({ liveBets: [] }),

      resetRoom: () => set({
        room: { id: null, isHost: false, config: null, status: 'waiting' },
        roomMembers: [],
        myBets: {},
        myBetRecords: [],
        liveBets: []
      }),
      updateRoomConfig: (config) =>
        set((state) => ({ roomConfig: { ...state.roomConfig, ...config } })),
    }),
    {
      name: 'bau-cua-session',
      storage: createJSONStorage(() => localStorage),
      // CỰC KỲ QUAN TRỌNG: 
      // Chỉ lưu user và recentRooms. 
      // BIẾN room PHẢI ĐỂ TRỐNG để mỗi lần mở app nó luôn là null
      partialize: (state) => ({
        user: state.user,
        recentRooms: state.recentRooms,
      }),
    }
  )
);