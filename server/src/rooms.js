// 房间管理——内存 Map

const crypto = require('crypto');

/** 内存房间存储 */
const rooms = new Map();

/**
 * 生成6位大写房间码
 */
function generateRoomId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * 创建房间
 * @param {string} hostId - socket id
 * @param {string} hostName - 玩家昵称
 * @returns {Object} { roomId, room }
 */
function createRoom(hostId, hostName) {
  let roomId;
  do {
    roomId = generateRoomId();
  } while (rooms.has(roomId));

  const room = {
    id: roomId,
    hostId,
    players: [
      { id: hostId, name: hostName, connected: true, totalScore: 0, roundScores: [] },
    ],
    game: null,
  };

  rooms.set(roomId, room);
  return { roomId, room };
}

/**
 * 加入房间
 */
function joinRoom(roomId, playerId, playerName) {
  const room = rooms.get(roomId);
  if (!room) return { error: '房间不存在' };
  if (room.game) return { error: '游戏已开始' };
  if (room.players.length >= 8) return { error: '房间已满' };
  if (room.players.some(p => p.id === playerId)) {
    // 玩家已存在，重新连接
    const player = room.players.find(p => p.id === playerId);
    player.connected = true;
    return { room };
  }

  room.players.push({ id: playerId, name: playerName, connected: true, totalScore: 0, roundScores: [] });
  return { room };
}

/**
 * 获取房间
 */
function getRoom(roomId) {
  return rooms.get(roomId);
}

/**
 * 从 socket 查找所在房间
 */
function findPlayerRoom(socketId) {
  for (const [id, room] of rooms) {
    if (room.players.some(p => p.id === socketId)) {
      return room;
    }
  }
  return null;
}

/**
 * 玩家断开连接
 */
function disconnectPlayer(socketId) {
  const room = findPlayerRoom(socketId);
  if (!room) return null;

  const player = room.players.find(p => p.id === socketId);
  if (player) {
    player.connected = false;
  }
  return room;
}

/**
 * 删除房间
 */
function deleteRoom(roomId) {
  rooms.delete(roomId);
}

module.exports = { rooms, createRoom, joinRoom, getRoom, findPlayerRoom, disconnectPlayer, deleteRoom };