// Express + Socket.io 入口

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { setupEvents } = require('./events');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? '*' : ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3030;

app.use(cors());
app.use(express.json());

// 生产环境托管静态文件
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../public')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });
}

// WebSocket 事件
setupEvents(io);

server.listen(PORT, () => {
  console.log(`骷髅王服务器启动于 http://localhost:${PORT}`);
});