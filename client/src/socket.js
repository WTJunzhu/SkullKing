// Socket.io 客户端单例

import { io } from 'socket.io-client';

// 生产环境下用同域名的 socket.io
const URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3030'
  : window.location.origin;

const socket = io(URL, {
  autoConnect: false,
});

export default socket;