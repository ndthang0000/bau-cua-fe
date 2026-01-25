// src/App.jsx
import React, { useEffect, useState } from 'react';
import WelcomeScreen from './pages/WelcomeScreen';
import JoinRoomScreen from './pages/JoinRoomScreen';
import { useGameStore } from './store/useGameStore';
import LobbyScreen from './pages/LobbyScreen';
import CreateRoomSettings from './pages/CreateRoomSettings';
import GameBoardScreen from './pages/GameBoardScreen';
import { useSocketIntegration } from './hooks/useSocketIntegration';
import { Toaster } from 'react-hot-toast';

export default function App() {
  // Lấy roomData từ store để biết trạng thái từ Server
  const { room, initUser } = useGameStore(); 
  const [currentView, setCurrentView] = useState('welcome');
  console.log("room.status: ",room.status)
  console.log("room.id: ",room.id)
  useSocketIntegration();

  useEffect(() => {
    initUser();
  }, [initUser]);

  // LOGIC ĐIỀU HƯỚNG TỰ ĐỘNG DỰA TRÊN DỮ LIỆU SERVER
  useEffect(() => {
  if (room && room.id) {
    const s = room.status;
    console.log("s là gì: ",s)
    // Nếu trạng thái thuộc nhóm đang chơi game
    if (['shaking', 'betting', 'result'].includes(s)) {
      setCurrentView('game');
    } 
    // Nếu vẫn đang ở sảnh chờ
    else if (s === 'waiting') {
      console.log("vô đây đc ko")
      setCurrentView('lobby');
    }
    // Nếu ván đấu đã kết thúc hoàn toàn hoặc giải tán
    else if (s === 'finished') {
      setCurrentView('welcome');
    }
  } else {
    // Nếu không có dữ liệu phòng, chỉ về welcome nếu không phải đang ở màn join/create
    if (currentView !== 'join' && currentView !== 'create-room') {
      setCurrentView('welcome');
    }
  }
}, [room?.status, room?.id]);

  const handleJoinSuccess = (roomId) => {
    // Không cần setCurrentView('lobby') nữa vì useEffect phía trên sẽ tự lo
    console.log("Joined room:", roomId);
  };

  return (
    <main className="min-h-screen bg-bg-cream">
      {currentView === 'welcome' && (
        <WelcomeScreen onJoinPress={() => setCurrentView('join')} onCreateRoomPress={() => setCurrentView('create-room')} />
      )}

      {currentView === 'join' && (
        <JoinRoomScreen 
          onBack={() => setCurrentView('welcome')} 
          onSuccess={handleJoinSuccess} 
        />
      )}

      {/* Lobby: Khi status là 'waiting' */}
      {currentView === 'lobby' && (
        <LobbyScreen onBack={() => setCurrentView('welcome')} />
      )}

      {currentView === 'create-room' && (
        <CreateRoomSettings onBack={() => setCurrentView('welcome')} onSuccess={() => console.log(room)}/>
      )}

      {currentView === 'game' && (
        <GameBoardScreen />
      )}

      <Toaster />
    </main>
  );
}