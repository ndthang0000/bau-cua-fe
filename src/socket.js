import { io } from "socket.io-client";

// Thay đổi URL này thành IP máy tính của bạn khi test trên điện thoại
const SOCKET_URL = "https://baucua-sever.thandoso.com";

export const socket = io(SOCKET_URL, {
  autoConnect: false, // Chúng ta sẽ chủ động connect khi user vào phòng
});