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
        rotateRounds: 3,
        minBet: 5000,
        maxBet: 50000,
      },
      gameHistory: [
        { id: 248, results: ['🦀', '🐟', '🐓'], time: '14:30:12' },
        { id: 247, results: ['🎃', '🎃', '🦐'], time: '14:29:45' },
        { id: 246, results: ['🦌', '🐟', '🦀'], time: '14:29:10' },
        { id: 245, results: ['🐓', '🐓', '🐓'], time: '14:28:30' },
      ],
      // --- ACTIONS ---

      initUser: () => set((state) => {
        if (state.user.id) return state; // Nếu có rồi thì thôi
        return { user: { ...state.user, id: uuidv4() } };
      }),

      updateUser: (data) =>
        set((state) => ({ user: { ...state.user, ...data } })),

      setRoomData: (roomData) => set((state) => {

        const roomState = {
          id: roomData.roomId,
          hostId: roomData.hostId,
          isHost: roomData.hostId === state.user.id,
          config: roomData.config,
          status: roomData.status || 'waiting'
        };

        return {
          room: {
            id: roomState.id,
            hostId: roomState.hostId,
            isHost: roomState.isHost,
            config: roomState.config,
            status: roomState.status
          },
        }
      }),

      updateRoomStatus: (status) =>
        set((state) => ({ room: { ...state.room, status } })),

      setMembers: (members) => set({ roomMembers: members }),

      addRecentRoom: (roomInfo) => set((state) => ({
        recentRooms: [roomInfo, ...state.recentRooms.filter(r => r.id !== roomInfo.id)].slice(0, 3)
      })),


      // --- ACTIONS ---
      setSelectedChip: (amount) => set({ selectedChip: amount }),
      // Đặt cược cục bộ (trước khi gửi lên server)
      placeBet: (door, amount) => set((state) => ({
        myBets: { ...state.myBets, [door]: (state.myBets[door] || 0) + amount },
        user: { ...state.user, balance: state.user.balance - amount }
      })),

      resetRoom: () => set({
        room: { id: null, isHost: false, config: null, status: 'waiting' },
        roomMembers: [],
        myBets: {}
      }),
      updateRoomConfig: (config) =>
        set((state) => ({ roomConfig: { ...state.roomConfig, ...config } })),
    }),
    {
      name: 'bau-cua-session',
      storage: createJSONStorage(() => localStorage),
      // Chỉ lưu User và RecentRooms vào localStorage
      // Đừng lưu RoomMembers hay Status vì nó là dữ liệu tức thời từ Server
      partialize: (state) => ({
        user: state.user,
        recentRooms: state.recentRooms
      }),
    }
  )
);