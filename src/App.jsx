// src/App.jsx
import React, { useEffect, useState } from 'react';
import WelcomeScreen from './pages/WelcomeScreen'; // Đổi tên App cũ thành WelcomeScreen
import JoinRoomScreen from './pages/JoinRoomScreen';
import { useGameStore } from './store/useGameStore';
import LobbyScreen from './pages/LobbyScreen';
import CreateRoomSettings from './pages/CreateRoomSettings';
import GameBoardScreen from './pages/GameBoardScreen';
import { useSocketIntegration } from './hooks/useSocketIntegration';
import { Toaster } from 'react-hot-toast';

export default function App() {
  const { room } = useGameStore();
  const [currentView, setCurrentView] = useState('welcome'); // welcome | create | join | lobby | game
  useSocketIntegration();
  // Hàm xử lý khi người dùng nhập mã và nhấn xác nhận thành công
  const handleJoinSuccess = (roomId) => {
    // Ở đây bạn có thể thêm logic check socket hoặc API xem phòng có tồn tại không
    setCurrentView('lobby'); 
  };


  const initUser = useGameStore(state => state.initUser);
useEffect(() => {
  initUser();
}, []);
  
  return (
    <main className="min-h-screen bg-bg-cream">
      {currentView === 'welcome' && (
        <WelcomeScreen onJoinPress={() => setCurrentView('join')} onCreateRoomPress={() => setCurrentView('create-room')} />
      )}

      {currentView === 'join' && (
        <JoinRoomScreen 
          onBack={() => setCurrentView('welcome')} 
          onSuccess={handleJoinSuccess} // Truyền callback xuống
        />
      )}

      {currentView === 'lobby' && (
        <LobbyScreen onBack={() => setCurrentView('welcome')}  onStartGame={() => setCurrentView('game')} />
      )}

      {currentView === 'create-room' && (
        <CreateRoomSettings onBack={() => setCurrentView('welcome')} onSuccess={() => setCurrentView('lobby')}/>
      )}

      {currentView === 'game' && (
        <GameBoardScreen />
      )}
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '16px',
            fontSize: '14px',
            fontWeight: 'bold'
          },
        }} 
      />
    </main>
  );
}