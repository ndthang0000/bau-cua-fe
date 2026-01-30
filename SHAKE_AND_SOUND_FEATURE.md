# Tính năng mới: Lắc điện thoại & Âm thanh

## 🎲 Lắc điện thoại để lắc bát (Manual Mode - Dealer)

### Cách hoạt động:
1. **Khi là nhà cái** trong phòng chế độ `manual` và đang ở phase `betting`:
   - Lắc điện thoại để bắt đầu lắc bát
   - Sẽ phát âm thanh lắc và hiển thị overlay "Đang lắc..."
   - Status tự động chuyển sang `shaking`

2. **Dừng lắc để mở bát**:
   - Khi dừng lắc trong **2 giây**, tự động mở bát
   - Hiện thông báo "Dừng lắc 2 giây để mở bát"
   - Tự động gọi `manual_show_result` event

### iOS Permission:
- iOS 13+ yêu cầu permission cho DeviceMotionEvent
- Tự động hiện hướng dẫn khi dealer vào betting phase
- User cần click "Allow" để bật motion sensor

### Tùy chỉnh:
```js
// Trong GameBoardScreen.jsx
useShakeDetection({
  threshold: 15,        // Ngưỡng gia tốc (càng thấp càng nhạy)
  stopDelay: 2000,      // Thời gian dừng lắc (ms)
  enabled: isDealer && isManualMode && room?.status === 'betting',
  onShake: () => { ... },
  onShakeStop: () => { ... }
})
```

---

## 🔊 Hệ thống âm thanh

### Các âm thanh được tích hợp:

1. **Âm lắc điện thoại** (`shake.mp3`)
   - Phát khi dealer lắc điện thoại
   - Volume: 0.3 (nhẹ nhàng, không gây khó chịu)

2. **Âm mở bát** (`bowl-open.mp3`)
   - Phát khi chuyển sang phase `result`
   - Volume: 0.6 (nổi bật hơn)

3. **Âm ván mới** (`new-round.mp3`)
   - Phát khi bắt đầu ván mới (phase `betting`)
   - Volume: 0.5

4. **Âm lệnh cược mới** (`new-bet.mp3`)
   - Phát khi nhận event `new_bet` từ người chơi khác
   - Volume: 0.3 (nhẹ để không spam)

### Thêm file âm thanh:

1. Tải free sound effects từ:
   - https://pixabay.com/sound-effects/
   - https://freesound.org/
   - https://mixkit.co/free-sound-effects/

2. Đổi tên và copy vào `public/sounds/`:
   ```
   public/sounds/
   ├── shake.mp3
   ├── bowl-open.mp3
   ├── new-round.mp3
   └── new-bet.mp3
   ```

3. File âm thanh tự động preload khi component mount

### Tùy chỉnh volume:
```js
// Trong useSocketIntegration.js
playSound('new-bet', 0.3);  // Âm nhỏ
playSound('bowl-open', 0.6); // Âm to
```

---

## 📁 File mới tạo:

1. **`src/hooks/useSound.js`** - Hook quản lý âm thanh
2. **`src/hooks/useShakeDetection.js`** - Hook phát hiện lắc điện thoại
3. **`src/components/game/ShakeIndicator.jsx`** - Overlay hiển thị khi lắc
4. **`public/sounds/`** - Thư mục chứa file âm thanh

---

## 🔧 File đã chỉnh sửa:

1. **`GameBoardScreen.jsx`**:
   - Import `useSound`, `useShakeDetection`, `ShakeIndicator`
   - Thêm state `isPhoneShaking`
   - Cấu hình shake detection cho dealer
   - Preload sounds khi mount
   - Request motion permission cho iOS

2. **`useSocketIntegration.js`**:
   - Import `SOUNDS` constants
   - Thêm helper `playSound()`
   - Phát âm thanh trong `onNewBet`, `onPhaseChange`

3. **`onNewDealer`**:
   - Fix: Cập nhật `currentDealer` trong store để Sticky Bottom re-render

---

## 🧪 Test checklist:

- [ ] Dealer lắc điện thoại trong betting phase → Auto start shaking
- [ ] Dừng lắc 2s → Auto mở bát
- [ ] Hiện ShakeIndicator overlay khi đang lắc
- [ ] Phát âm thanh lắc khi shake
- [ ] Phát âm thanh mở bát khi phase = result
- [ ] Phát âm thanh ván mới khi phase = betting
- [ ] Phát âm thanh khi có người cược mới
- [ ] iOS request permission thành công
- [ ] Dealer thay đổi → Sticky Bottom re-render đúng
- [ ] Manual mode: Nút "Lắc Bát" vẫn hoạt động (alternative cho lắc điện thoại)

---

## ⚠️ Lưu ý:

1. **Browser support**:
   - DeviceMotionEvent chỉ hoạt động trên mobile
   - Desktop không có accelerometer → Feature tự động disable
   - iOS Safari yêu cầu HTTPS

2. **Performance**:
   - Shake detection chỉ chạy khi `enabled=true`
   - Auto cleanup khi component unmount
   - Debounce để tránh spam event (100ms)

3. **UX**:
   - Vẫn giữ nút "Lắc Bát" để user có alternative
   - Toast hướng dẫn tự động hiện khi dealer vào betting
   - Visual feedback rõ ràng (ShakeIndicator)

4. **Sound files**:
   - Cần thêm file `.mp3` thật vào `public/sounds/`
   - Hiện tại chỉ có placeholder để tránh 404 error
   - Console sẽ warn nếu không load được sound (không crash app)
