import React, { useEffect, useState, useMemo } from 'react';
import { useGameStore } from '../store/useGameStore';
import { socket } from '../socket';
import GameHeader from '../components/game/GameHeader';
import BettingGrid from '../components/game/BettingGrid';
import DiceBowl from '../components/game/DiceBowl';
import SoiCauModal from '../components/game/SoiCauModal';
import toast from 'react-hot-toast';
import WinEffect from '../components/game/WinEffect';
import LeaderboardModal from '../components/game/LeaderboardModal';
import BetHistoryModal from '../components/game/BetHistoryModal';
import MyBetsPanel from '../components/game/MyBetsPanel';
import ShakeIndicator from '../components/game/ShakeIndicator';
import { useSound, SOUNDS, SOUND_PATHS } from '../hooks/useSound';
import { useShakeDetection } from '../hooks/useShakeDetection';

export default function GameBoardScreen() {
  const { room, user, selectedChip, setSelectedChip, roomMembers, myBets, addMyBet, updateUser, addBetRecord, myBetRecords, liveBets, removeBetRecord } = useGameStore();
  const [isSoiCauOpen, setIsSoiCauOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isBetHistoryOpen, setIsBetHistoryOpen] = useState(false);
  const [winData, setWinData] = useState({ winAmount: 0, isVisible: false });
  // State quản lý các ô đang được chọn để đặt cược
  const [selectedDoors, setSelectedDoors] = useState([]);
  const [isPhoneShaking, setIsPhoneShaking] = useState(false);

  // Sound system - Helper để phát âm thanh
  const { preloadSound } = useSound();
  const playSound = (soundKey, volume = 0.5) => {
    try {
      const audio = new Audio(`/sounds/${soundKey}.mp3`);
      audio.volume = volume;
      audio.play().catch(err => console.warn('Sound error:', soundKey, err));
      return audio;
    } catch (err) {
      console.warn('Cannot play sound:', soundKey, err);
      return null;
    }
  };

  const chipValues = [10000, 50000, 100000, 500000, 1000000];
  const chipColors = ['#3B82F6', '#EF4444', '#A855F7', '#EAB308', '#EC4899', '#10B981'];

  const currentBalance = useMemo(() => {
    return roomMembers.find(m => m.userId === user.id)?.currentBalance || 0;
  }, [roomMembers, user.id]);


  const bettingCeiling = useMemo(() => {
    const maxRoomBet = room?.config?.maxBet || Infinity;
    return Math.min(currentBalance, maxRoomBet);
  }, [currentBalance, room?.config?.maxBet]);

  const dynamicChips = useMemo(() => {
  const min = room?.config?.minBet || 10000;
  const max = room?.config?.maxBet || 1000000;
  const currentBalance = roomMembers.find(m => m.userId === user.id)?.currentBalance || 0;
  const topLimit = Math.min(max, currentBalance);

  // 1. Ba nút đầu tiên: 1x, 2x, 3x
  const firstThree = [min, min * 2, min * 3];

  // Nếu topLimit nhỏ, chỉ lấy những gì khả thi
  if (topLimit <= min * 3) {
    return [...new Set(firstThree)].filter(v => v <= topLimit);
  }

  // 2. Tính toán 2 nút còn lại để trải đều đến topLimit
  const remainingSpace = topLimit - (min * 3);
  const step = remainingSpace / 3; // Chia làm 3 khoảng để lấy 2 điểm giữa

  const lastTwoRaw = [
    min * 3 + step,
    min * 3 + step * 2
  ];

  const lastTwoRounded = lastTwoRaw.map(val => {
    if (val >= 500000) return Math.round(val / 50000) * 50000; // Tròn 50k
    if (val >= 100000) return Math.round(val / 10000) * 10000; // Tròn 10k
    return Math.round(val / 5000) * 5000; // Tròn 5k
  });

  // Hợp nhất và loại bỏ trùng lặp
  const finalChips = [...new Set([...firstThree, ...lastTwoRounded])];
  
  // Lọc lại lần cuối để đảm bảo không vượt quá số dư/maxBet
  return finalChips.filter(v => v >= min && v <= topLimit).sort((a, b) => a - b);
}, [room?.config?.minBet, room?.config?.maxBet, currentBalance]);

  // 3. Tính toán giá trị All-in (Không vượt quá Max Bet của phòng)
  const allInValue = bettingCeiling;


  const isBettingTime = room?.status === 'betting';

  // Toggle chọn/bỏ chọn ô cược
  const handleSelectDoor = (door) => {
    if (!isBettingTime) return;
    setSelectedDoors(prev =>
      prev.includes(door) ? prev.filter(d => d !== door) : [...prev, door]
    );
  };

  // Xác nhận đặt cược
  // GameBoardScreen.js
  const handleConfirmBet = () => {
    if (selectedDoors.length === 0) return;

    const totalAmount = selectedDoors.length * selectedChip;

    // Gửi một mảng các ô cược lên Server
    socket.emit('place_bet_batch', {
      roomId: room.id,
      doors: selectedDoors, // Ví dụ: ['bau', 'cua']
      amountPerDoor: selectedChip,
      totalAmount,
      userId: user.id,
      nickname: user.nickname
    }, (response) => {
      if (response.success) {
        // Cập nhật Store cho từng ô thành công
        selectedDoors.forEach(door => {
          addMyBet(door, selectedChip);
          // Thêm bet record để track cho việc cancel
          // Sử dụng betId từ server hoặc tạo ID tạm
          const betId = response.betIds?.[door] || `temp-${Date.now()}-${door}-${Math.random().toString(36).substr(2, 9)}`;
          addBetRecord({
            betId,
            door,
            amount: selectedChip,
            timestamp: new Date().toISOString()
          });
        });

        // Cập nhật số dư một lần duy nhất
        updateUser({ balance: response.newBalance });

        toast.success(`Đặt cược thành công ${selectedDoors.length} ô!`);
        setSelectedDoors([]); // Xóa các ô đã chọn trên UI
      } else {
        toast.error(response.message);
      }
    });
  };

  const handleReset = () => setSelectedDoors([]);

  const soiCauData = useMemo(() => room?.history || [], [room?.history]);

  // Check if current user is dealer and room is manual mode
  const isDealer = room?.currentDealer?.userId === user.id;
  const isManualMode = room?.config?.playMode === 'manual';

  // Debug logs
  useEffect(() => {
    console.log('=== DEALER CHECK ===' );
    console.log('User ID:', user.id);
    console.log('Current Dealer:', room?.currentDealer);
    console.log('Is Dealer:', isDealer);
    console.log('Play Mode:', room?.config?.playMode);
    console.log('Is Manual Mode:', isManualMode);
    console.log('Room Status:', room?.status);
    console.log('Shake enabled:', isDealer && isManualMode && (room?.status === 'betting' || room?.status === 'shaking'));
    console.log('===================');
  }, [isDealer, isManualMode, room?.status, user.id, room?.currentDealer]);

  // Ref để quản lý âm thanh lắc
  const shakeAudioRef = React.useRef(null);

  // Shake detection for dealer in manual mode
  const { requestPermission } = useShakeDetection({
    threshold: 12, // Giảm từ 15 xuống 12 để nhạy hơn
    stopDelay: 2000,
    enabled: isDealer && isManualMode && (room?.status === 'betting' || room?.status === 'shaking'),
    onShake: () => {
      console.log('🎲 onShake triggered! Current status:', room?.status, 'isPhoneShaking:', isPhoneShaking);
      
      // Nếu đang ở betting phase, emit lắc bát
      if (room?.status === 'betting' && !isPhoneShaking) {
        console.log('📤 Shake detected in BETTING phase - starting shake');
        setIsPhoneShaking(true);
        handleStartShaking();
      }
      // Nếu đã ở shaking phase, phát âm thanh (nếu chưa có)
      else if (room?.status === 'shaking' && !shakeAudioRef.current) {
        console.log('🎵 Shake detected in SHAKING phase - playing sound');
        const audio = new Audio('/sounds/shake.mp3');
        audio.volume = 0.4;
        audio.loop = true;
        audio.play()
          .then(() => console.log('✅ Shake sound playing'))
          .catch(err => console.error('❌ Shake sound error:', err));
        shakeAudioRef.current = audio;
      }
    },
    onShakeStop: () => {
      console.log('✋ onShakeStop triggered! Status:', room?.status);
      if (isPhoneShaking && room?.status === 'shaking') {
        setIsPhoneShaking(false);
        // Dừng âm thanh lắc
        if (shakeAudioRef.current) {
          console.log('🔇 Stopping shake sound');
          shakeAudioRef.current.pause();
          shakeAudioRef.current = null;
        }
        // Tự động mở bát sau khi dừng lắc 2s
        setTimeout(() => {
          handleShowResult();
        }, 500);
      }
    }
  });

  // Manual mode handlers
  const handleStartShaking = () => {
    socket.emit('manual_start_shaking', {
      roomId: room.id,
      userId: user.id
    }, (response) => {
      if (!response.success) {
        toast.error(response.message || 'Không thể bắt đầu lắc!');
      }
      // Không toast success vì phase_change event sẽ handle
    });
  };

  const handleShowResult = () => {
    socket.emit('manual_show_result', {
      roomId: room.id,
      userId: user.id
    }, (response) => {
      if (!response.success) {
        toast.error(response.message || 'Không thể mở bát!');
      }
      // Không toast success vì phase_change event sẽ handle
    });
  };

  const handleNextRound = () => {
    socket.emit('manual_next_round', {
      roomId: room.id,
      userId: user.id
    }, (response) => {
      if (!response.success) {
        toast.error(response.message || 'Không thể bắt đầu ván mới!');
      }
      // Không toast success vì phase_change event sẽ handle
    });
  };

  const handleStartGame = () => {
    socket.emit('start_game', { roomId: room.id });
  };


  useEffect(() => {
    socket.on('game_result_individual', ({ winAmount, netProfit }) => {
      console.log("Nhận event game_result_individual", { winAmount, netProfit });
      // Đợi 2.5s cho nắp bát mở ra mới hiện Toast cho kịch tính
      setTimeout(() => {
        setWinData({ winAmount, isVisible: true });

        // Tự động tắt hiệu ứng sau 4 giây
        setTimeout(() => {
          setWinData(prev => ({ ...prev, isVisible: false }));
        }, 4000);
      }, 2500);
    });
  }, [])

  // Cleanup shake audio khi component unmount hoặc không còn là dealer
  useEffect(() => {
    return () => {
      if (shakeAudioRef.current) {
        shakeAudioRef.current.pause();
        shakeAudioRef.current = null;
      }
    };
  }, []);

  // Stop shake audio nếu không còn là dealer hoặc ra khỏi betting phase
  useEffect(() => {
    if ((!isDealer || !isManualMode || room?.status !== 'betting') && shakeAudioRef.current) {
      shakeAudioRef.current.pause();
      shakeAudioRef.current = null;
      setIsPhoneShaking(false);
    }
  }, [isDealer, isManualMode, room?.status]);

  // Phát âm thanh lắc khi status chuyển sang shaking (từ nút hoặc lắc điện thoại)
  useEffect(() => {
    if (room?.status === 'shaking' && isDealer && isManualMode && !shakeAudioRef.current) {
      console.log('🎵 Status changed to SHAKING - playing shake sound');
      const audio = new Audio('/sounds/shake.mp3');
      audio.volume = 0.4;
      audio.loop = true;
      audio.play()
        .then(() => console.log('✅ Shake sound started'))
        .catch(err => console.error('❌ Shake sound failed:', err));
      shakeAudioRef.current = audio;
    }
    // Dừng âm thanh khi ra khỏi shaking phase
    else if (room?.status !== 'shaking' && shakeAudioRef.current) {
      console.log('🔇 Status changed from SHAKING - stopping sound');
      shakeAudioRef.current.pause();
      shakeAudioRef.current = null;
    }
  }, [room?.status, isDealer, isManualMode]);

  // Request motion permission cho iOS khi dealer ở manual mode
  useEffect(() => {
    if (isDealer && isManualMode && room?.status === 'betting') {
      // Check nếu thiết bị hỗ trợ DeviceMotionEvent
      if (typeof DeviceMotionEvent === 'undefined') {
        console.warn('⚠️ Device does not support DeviceMotionEvent');
        return;
      }
      
      console.log('✅ DeviceMotionEvent supported');
      // Hiện toast hướng dẫn
      toast('🎲 Lắc điện thoại để lắc bát!', { duration: 3000 });
      requestPermission().then(granted => {
        console.log('Motion permission granted:', granted);
        if (!granted) {
          toast.error('Cần cho phép truy cập cảm biến chuyển động!');
        }
      });
    }
  }, [isDealer, isManualMode, room?.status, requestPermission]);

  useEffect(() => {
    // Reset chọn cửa khi không phải thời gian đặt cược
    if (!isBettingTime) {
      setSelectedDoors([]);
    }
  }, [isBettingTime]);

  return (
    <div className="h-[100dvh] bg-[#0A0A0A] text-white flex flex-col font-sans max-w-md mx-auto overflow-hidden relative">

      {/* 1. Sticky Header - Cố định phía trên */}
      <div className="flex-none z-[60] bg-[#0A0A0A]/90 backdrop-blur-md border-b border-gray-800">
        <GameHeader
          onPressSoiCau={() => setIsSoiCauOpen(true)}
          onPressLeaderboard={() => setIsLeaderboardOpen(true)}
          onPressBetHistory={() => setIsBetHistoryOpen(true)} />
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Thu nhỏ danh sách thành viên để ưu tiên không gian */}
        <div className="px-4 py-1 bg-black/20">
          <div className="flex overflow-x-auto gap-3 no-scrollbar py-1">
            {roomMembers?.filter(item => item.isOnline === true)?.slice(0, 15).map((member) => (
              <div key={member.userId} className="flex flex-col items-center flex-shrink-0">
                <div className="w-8 h-8 rounded-full border border-gray-700 bg-gray-900 flex items-center justify-center text-sm relative">
                  {member.avatar}
                  {room.currentDealer?.userId === member.userId && (
                    <div className="absolute -top-1 -right-1 bg-yellow-500 text-[5px] px-1 rounded-full font-black text-black">CÁI</div>
                  )}
                </div>
                <span className="text-[6px] text-green-400 font-bold leading-tight">
                  {member.currentBalance > 1000000 ? `${(member.currentBalance / 1000000).toFixed(1)}M` : `${Math.floor(member.currentBalance / 1000)}k`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Giảm padding/margin của DiceBowl để hiện thị BettingGrid cao hơn */}
        <div className="scale-90 origin-top -mb-4">
          <DiceBowl status={room?.status} result={room?.lastResult} />
        </div>

        {/* Bàn cược - Truyền thêm state selection và live bets */}
        <div className="px-2">
          <BettingGrid
            isLock={!isBettingTime}
            currentBets={room?.totalBets}
            selectedDoors={selectedDoors}
            onSelectDoor={handleSelectDoor}
            myBets={myBets || {}}
            lastResult={room?.lastResult}
            status={room?.status}
            liveBets={liveBets}
            myBetRecords={myBetRecords}
            onCancelBet={(bet) => {
              // Cập nhật store khi bet bị cancel
              removeBetRecord(bet.betId);
              addMyBet(bet.door, -bet.amount);
            }}
          />
        </div>
      </div>

      {/* 2. Control Area - Sticky Bottom */}
      <div className="sticky bottom-0 bg-[#111111] p-3 pb-6 rounded-t-3xl border-t border-gray-800 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">

        {/* Chip List - Ẩn khi là dealer vì dealer không đặt cược */}
        {!isDealer && (
          <div className="flex justify-between items-center mb-4 overflow-x-auto no-scrollbar gap-2 px-1">
            {dynamicChips.map((amt, i) => (
              <button
                key={amt}
                onClick={() => setSelectedChip(amt)}
                className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-[9px] font-black transition-all border-2
                  ${selectedChip === amt ? 'scale-110 border-white shadow-[0_0_15px]' : 'opacity-60 border-transparent'}`}
                style={{
                  backgroundColor: chipColors[i],
                  boxShadow: selectedChip === amt ? chipColors[i] : 'none'
                }}
              >
                {amt >= 1000000 ? `${amt / 1000000}M` : `${amt / 1000}K`}
              </button>
            ))}
            <button
              onClick={() => setSelectedChip(allInValue)}
              className={`flex-shrink-0 min-w-[60px] h-11 px-2 rounded-full flex flex-col items-center justify-center transition-all border-2
          ${selectedChip === allInValue ? 'scale-110 border-white shadow-[0_0_15px]' : 'opacity-60 border-transparent'}`}
              style={{
                backgroundColor: '#ef4444', // Màu đỏ rực cho All-in
                backgroundImage: 'linear-gradient(45deg, #ef4444, #991b1b)',
                boxShadow: selectedChip === allInValue ? `0 0 20px #ef4444` : 'none'
              }}
            >
              <span className="text-[7px] font-black uppercase leading-none mb-1 text-white/80">All-in</span>
              <span className="text-[10px] font-black text-white">
                {allInValue >= 1000000 ? `${(allInValue / 1000000).toFixed(1)}M` : `${Math.floor(allInValue / 1000)}K`}
              </span>
            </button>
          </div>
        )}

        {/* Dealer indicator khi ẩn chips */}
        {isDealer && (
          <div className="mb-4 space-y-2">
            <div className="py-2 px-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center justify-center gap-2">
              <span className="text-yellow-500 text-lg">🏆</span>
              <span className="text-yellow-500 font-bold text-xs">Bạn đang làm Cái - Điều khiển ván đấu</span>
            </div>
            {/* Test button - chỉ hiện khi dev mode */}
            {room?.status === 'betting' && isManualMode && (
              <button
                onClick={() => {
                  console.log('📢 Testing shake sound...');
                  const audio = new Audio('/sounds/shake.mp3');
                  audio.volume = 0.4;
                  audio.play()
                    .then(() => {
                      console.log('✅ Test sound played successfully');
                      toast.success('Test âm thanh thành công!');
                    })
                    .catch(err => {
                      console.error('❌ Test sound failed:', err);
                      toast.error('Không phát được âm thanh: ' + err.message);
                    });
                }}
                className="w-full py-1.5 px-3 bg-gray-700/50 text-gray-300 text-[8px] rounded-lg border border-gray-600"
              >
                🔊 Test Âm Thanh Lắc
              </button>
            )}
          </div>
        )}

        {/* Bottom Actions */}
        <div className="flex items-center gap-2">
          {/* Balance - Hiện cho tất cả */}
          <div className="flex-1 bg-black/40 h-11 rounded-xl flex flex-col items-center justify-center border border-gray-800">
            <span className="text-[8px] text-gray-400 uppercase">Số dư</span>
            <span className="text-xs font-bold text-yellow-500">
              {currentBalance.toLocaleString()}
            </span>
          </div>

          {/* Nút Đặt lại - Chỉ hiện cho người chơi (không phải dealer) */}
          {!isDealer && (
            <button
              onClick={handleReset}
              className="flex-1 bg-gray-800/80 h-11 rounded-xl font-bold text-[10px] uppercase active:scale-95 transition-transform"
            >
              Đặt lại
            </button>
          )}

          {/* Logic nút chính */}
          <div className={isDealer ? "flex-[2]" : "flex-[1.5]"}>
            {selectedDoors.length > 0 ? (
              // Đang chọn ô -> Nút xác nhận cược
              <button
                onClick={handleConfirmBet}
                className="w-full bg-green-600 h-11 rounded-xl font-black text-[11px] uppercase shadow-[0_0_15px_rgba(22,163,74,0.4)] animate-pulse"
              >
                Xác nhận ({selectedDoors.length})
              </button>
            ) : isDealer && room?.status === 'waiting' ? (
              // Dealer + Waiting -> Bắt đầu ván
              <button
                onClick={handleStartGame}
                className="w-full bg-primary-orange h-11 rounded-xl font-black text-[11px] uppercase"
              >
                Bắt đầu ván
              </button>
            ) : isDealer && isManualMode && room?.status === 'betting' ? (
              // Dealer + Manual + Betting -> Lắc bát
              <button
                onClick={handleStartShaking}
                className="w-full bg-yellow-500 h-11 rounded-xl font-black text-[11px] uppercase text-black"
              >
                🎲 Lắc Bát
              </button>
            ) : isDealer && isManualMode && room?.status === 'shaking' ? (
              // Dealer + Manual + Shaking -> Mở bát
              <button
                onClick={handleShowResult}
                className="w-full bg-purple-600 h-11 rounded-xl font-black text-[11px] uppercase"
              >
                🎯 Mở Bát
              </button>
            ) : isDealer && isManualMode && room?.status === 'result' ? (
              // Dealer + Manual + Result -> Ván tiếp
              <button
                onClick={handleNextRound}
                className="w-full bg-blue-600 h-11 rounded-xl font-black text-[11px] uppercase"
              >
                ▶️ Ván Tiếp
              </button>
            ) : (
              // Người chơi thường -> Hiển thị trạng thái
              <div className="w-full bg-gray-900/80 h-11 rounded-xl flex items-center justify-center text-[9px] font-bold text-gray-500 uppercase border border-gray-800 italic">
                {room?.status === 'betting' ? 'Mời đặt cược' : 
                 room?.status === 'shaking' ? 'Đang lắc...' :
                 room?.status === 'result' ? 'Xem kết quả' : 'Chờ bắt đầu'}
              </div>
            )}
          </div>
        </div>
      </div>

      <SoiCauModal isOpen={isSoiCauOpen} history={soiCauData} onClose={() => setIsSoiCauOpen(false)} />
      <LeaderboardModal isOpen={isLeaderboardOpen} onClose={() => setIsLeaderboardOpen(false)} />
      <BetHistoryModal isOpen={isBetHistoryOpen} onClose={() => setIsBetHistoryOpen(false)} />
      <WinEffect winData={winData} />
      <ShakeIndicator isShaking={isPhoneShaking} />
    </div>
  );
}