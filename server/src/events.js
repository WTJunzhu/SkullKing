// Socket.io 事件处理器

const { createRoom, joinRoom, getRoom, findPlayerRoom, disconnectPlayer, deleteRoom } = require('./rooms');
const { createGame, submitBid, playCard, nextRound, nextTrick: engineNextTrick } = require('./game/engine');
const { calculateRoundScore } = require('./game/scoring');

function setupEvents(io) {
  io.on('connection', (socket) => {
    console.log(`新连接: ${socket.id}`);

    // 创建房间
    socket.on('create_room', ({ playerName }) => {
      const { roomId, room } = createRoom(socket.id, playerName);
      socket.join(roomId);
      socket.emit('room_joined', { roomId, playerId: socket.id, room });
      console.log(`房间 ${roomId} 创建，房主: ${playerName}`);
    });

    // 加入房间
    socket.on('join_room', ({ roomId, playerName }) => {
      const result = joinRoom(roomId, socket.id, playerName);
      if (result.error) {
        socket.emit('error', { message: result.error });
        return;
      }

      socket.join(roomId);
      const room = result.room;
      socket.emit('room_joined', { roomId, playerId: socket.id, room });

      // 广播玩家列表更新
      io.to(roomId).emit('room_update', { players: room.players });
    });

    // 开始游戏
    socket.on('start_game', () => {
      const room = findPlayerRoom(socket.id);
      if (!room || room.hostId !== socket.id) {
        socket.emit('error', { message: '只有房主可以开始游戏' });
        return;
      }
      if (room.players.length < 2) {
        socket.emit('error', { message: '至少需要2名玩家' });
        return;
      }

      const players = room.players.map(p => ({ id: p.id, name: p.name }));
      room.game = createGame(players);

      const playerIds = Object.keys(room.game.hands);
      const currentPlayerId = playerIds[room.game.currentTrick.leadPlayerIndex];

      io.to(room.id).emit('game_started', {
        players: room.players.map(p => ({ id: p.id, name: p.name })),
        round: room.game.round,
        currentPlayerId,
      });

      // 分别发送手牌
      room.players.forEach(p => {
        const sock = io.sockets.sockets.get(p.id);
        if (sock) {
          sock.emit('deal_cards', {
            hand: room.game.hands[p.id],
            round: room.game.round,
            bids: room.game.bids,
            phase: room.game.phase,
          });
        }
      });
    });

    // 请求发牌（客户端在收到 game_started 后主动请求）
    socket.on('request_hand', () => {
      const room = findPlayerRoom(socket.id);
      if (!room || !room.game) return;

      socket.emit('deal_cards', {
        hand: room.game.hands[socket.id],
        round: room.game.round,
        bids: room.game.bids,
        phase: room.game.phase,
      });
    });

    // 提交竞标
    socket.on('submit_bid', ({ bid }) => {
      const room = findPlayerRoom(socket.id);
      if (!room || !room.game) {
        socket.emit('error', { message: '游戏不存在' });
        return;
      }
      if (room.game.phase !== 'bidding') {
        socket.emit('error', { message: '不在竞标阶段' });
        return;
      }
      if (bid < 0 || bid > room.game.round) {
        socket.emit('error', { message: '竞标数字无效' });
        return;
      }

      const allBid = submitBid(room.game, socket.id, bid);

      // 告知所有人竞标进度
      const bidStatus = {};
      room.players.forEach(p => {
        bidStatus[p.id] = room.game.bids[p.id] !== null ? '已竞标' : null;
      });
      io.to(room.id).emit('bid_update', { bids: bidStatus });

      if (allBid) {
        const playerIds = Object.keys(room.game.hands);
        const currentPlayerId = playerIds[room.game.currentPlayerIndex];
        io.to(room.id).emit('all_bids_in', { bids: room.game.bids, currentPlayerId });
      }
    });

    // 出牌
    socket.on('play_card', ({ cardId }) => {
      const room = findPlayerRoom(socket.id);
      if (!room || !room.game) {
        socket.emit('error', { message: '游戏不存在' });
        return;
      }
      if (room.game.phase !== 'playing') {
        socket.emit('error', { message: '当前不处于出牌阶段' });
        return;
      }

      // 检查母老虎是否需要宣告
      const playerHand = room.game.hands[socket.id];
      const card = playerHand.find(c => c.id === cardId);
      if (card && card.type === 'tigress' && !card.declaredAs) {
        // 要求宣告
        socket.emit('request_tigress', { playerId: socket.id, cardId });
        return;
      }

      doPlayCard(io, room, socket.id, cardId);
    });

    // 母老虎宣告
    socket.on('declare_tigress', ({ as, cardId }) => {
      const room = findPlayerRoom(socket.id);
      if (!room || !room.game) return;

      // 找到手牌中的母老虎并标记宣告
      const hand = room.game.hands[socket.id];
      const tigressCard = hand.find(c => c.id === cardId || c.type === 'tigress');
      if (tigressCard) {
        tigressCard.declaredAs = as;
      }

      doPlayCard(io, room, socket.id, cardId);
    });

    // 下一墩
    socket.on('next_trick', () => {
      const room = findPlayerRoom(socket.id);
      if (!room || !room.game) return;
      if (room.game.phase !== 'trick_result') return;

      engineNextTrick(room.game);
      const playerIds = Object.keys(room.game.hands);
      const currentPlayerId = playerIds[room.game.currentPlayerIndex];

      io.to(room.id).emit('next_trick_game', {
        phase: room.game.phase,
        currentPlayerId,
      });

      // 分别发送各自手牌
      room.players.forEach(p => {
        const sock = io.sockets.sockets.get(p.id);
        if (sock) {
          sock.emit('deal_cards', {
            hand: room.game.hands[p.id],
            round: room.game.round,
            bids: room.game.bids,
            phase: room.game.phase,
          });
        }
      });
    });

    // 下一轮
    socket.on('next_round', () => {
      const room = findPlayerRoom(socket.id);
      if (!room || !room.game) return;

      const gameOver = nextRound(room.game);
      if (gameOver) {
        // 计算总分排名
        const scores = room.players.map(p => ({
          playerId: p.id,
          name: p.name,
          totalScore: p.roundScores ? p.roundScores.reduce((s, rs) => s + rs.total, 0) : 0,
        })).sort((a, b) => b.totalScore - a.totalScore);
        io.to(room.id).emit('game_over', { finalScores: scores });
      } else {
        // 新一轮发牌
        room.players.forEach(p => {
          const sock = io.sockets.sockets.get(p.id);
          if (sock) {
            sock.emit('deal_cards', {
              hand: room.game.hands[p.id],
              round: room.game.round,
              bids: room.game.bids,
              phase: room.game.phase,
            });
          }
        });
      }
    });

    // 断开连接
    socket.on('disconnect', () => {
      const room = disconnectPlayer(socket.id);
      if (!room) return;

      io.to(room.id).emit('room_update', { players: room.players });

      // 如果所有人断开，清除房间
      const anyConnected = room.players.some(p => p.connected);
      if (!anyConnected) {
        deleteRoom(room.id);
      }
    });
  });
}

/**
 * 执行出牌并广播结果
 */
function doPlayCard(io, room, socketId, cardId) {
  const result = playCard(room.game, socketId, cardId);
  if (!result) return;

  const playerIds = Object.keys(room.game.hands);

  // 广播出牌
  io.to(room.id).emit('card_played', {
    playerId: socketId,
    card: result.card,
    nextPlayerId: playerIds[room.game.currentPlayerIndex],
  });

  if (result.trickComplete) {
    io.to(room.id).emit('trick_complete', {
      winnerId: result.trickResult.winnerId,
      bonuses: result.trickResult.bonuses,
      tricksWon: room.game.tricksWon,
      cancelled: result.trickResult.cancelled || false,
      cancelType: result.trickResult.cancelType || null,
      cancelPlayerId: result.trickResult.cancelPlayerId || null,
    });
  }

  if (result.roundComplete) {
    const summary = result.roundSummary || { scores: [] };
    room.players.forEach(p => {
      const s = summary.scores.find(sc => sc.playerId === p.id);
      if (s) {
        p.roundScores = p.roundScores || [];
        p.roundScores.push({ round: room.game.round, ...s });
        p.totalScore = (p.totalScore || 0) + s.total;
      }
    });

    io.to(room.id).emit('round_complete', { roundSummary: summary });
  }
}

module.exports = { setupEvents };