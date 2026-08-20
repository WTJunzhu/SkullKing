// 骷髅王游戏状态机——核心逻辑

const { createDeck, shuffle } = require('./cards');
const { resolveTrick } = require('./trick');
const { calculateRoundScore } = require('./scoring');

const TOTAL_ROUNDS = 10;

/**
 * 创建新游戏
 * @param {Array} players - [{ id, name }]
 * @returns {Object} 游戏状态
 */
function createGame(players) {
  const playerIds = players.map(p => p.id);
  const gameState = {
    phase: 'bidding',           // bidding | playing | trick_result | round_summary | game_over
    round: 1,
    dealerIndex: 0,
    currentPlayerIndex: 0,
    hands: Object.fromEntries(playerIds.map(id => [id, []])),
    bids: {},
    tricksWon: Object.fromEntries(playerIds.map(id => [id, 0])),
    bonusPoints: Object.fromEntries(playerIds.map(id => [id, 0])),
    bonusDetails: Object.fromEntries(playerIds.map(id => [id, []])),
    currentTrick: { leadPlayerIndex: 0, leadSuit: null, plays: [] },
    lastTrickResult: null,
    roundHistory: [],
  };

  // 发牌
  dealCards(gameState);

  return gameState;
}

/**
 * 发牌
 */
function dealCards(gameState) {
  const deck = shuffle(createDeck());
  const playerIds = Object.keys(gameState.hands);
  const cardsPerPlayer = gameState.round;

  // 每人发对应数量的牌
  const totalNeeded = cardsPerPlayer * playerIds.length;
  const dealtCards = deck.slice(0, totalNeeded);

  playerIds.forEach((playerId, idx) => {
    const start = idx * cardsPerPlayer;
    gameState.hands[playerId] = sortHand(dealtCards.slice(start, start + cardsPerPlayer));
  });

  // 重置本轮数据
  playerIds.forEach(id => {
    gameState.bids[id] = null;
    gameState.tricksWon[id] = 0;
    gameState.bonusPoints[id] = 0;
    gameState.bonusDetails[id] = [];
  });

  gameState.currentTrick = {
    leadPlayerIndex: (gameState.round - 1) % playerIds.length,
    leadSuit: null,
    plays: [],
  };
}

/**
 * 提交竞标
 * @returns {boolean} 是否收集完毕（true = 所有玩家都竞标完成）
 */
function submitBid(gameState, playerId, bid) {
  if (gameState.phase !== 'bidding') return false;

  gameState.bids[playerId] = bid;

  const playerIds = Object.keys(gameState.bids);
  const allBid = playerIds.every(id => gameState.bids[id] !== null);
  if (allBid) {
    // 进入出牌阶段
    gameState.phase = 'playing';
    gameState.currentPlayerIndex = gameState.currentTrick.leadPlayerIndex;
    return true;
  }
  return false;
}

/**
 * 出牌
 * @returns {Object|null} { card, trickComplete, trickResult, roundComplete, roundSummary }
 */
function playCard(gameState, playerId, cardId) {
  const cardIndex = gameState.hands[playerId].findIndex(c => c.id === cardId);
  if (cardIndex === -1) return null;

  const card = gameState.hands[playerId][cardIndex];

  // 检查出牌合法性
  if (!isValidPlay(gameState, playerId, card)) return null;

  // 移除手牌
  gameState.hands[playerId].splice(cardIndex, 1);

  // 记录出牌
  gameState.currentTrick.plays.push({ playerId, card });

  // 如果是数字牌且当前墩无色，确立花色
  if (card.type === 'number' && gameState.currentTrick.leadSuit === null) {
    gameState.currentTrick.leadSuit = card.suit;
  }

  // 轮到下一个玩家
  const playerIds = Object.keys(gameState.hands);
  const nextIndex = (gameState.currentPlayerIndex + 1) % playerIds.length;
  gameState.currentPlayerIndex = nextIndex;

  let trickResult = null;
  let trickComplete = false;
  let roundComplete = false;
  let roundSummary = null;

  // 检查本墩是否结束
  if (gameState.currentTrick.plays.length === playerIds.length) {
    trickResult = resolveTrick(
      gameState.currentTrick.plays,
      gameState.currentTrick.leadSuit
    );
    trickComplete = true;

    // 更新赢墩计数和奖励分（cancelled 的墩不计入）
    const winnerId = trickResult.winnerId;
    if (winnerId && !trickResult.cancelled) {
      gameState.tricksWon[winnerId] = (gameState.tricksWon[winnerId] || 0) + 1;
      for (const bonus of trickResult.bonuses) {
        gameState.bonusPoints[bonus.playerId] = (gameState.bonusPoints[bonus.playerId] || 0) + bonus.amount;
        if (!gameState.bonusDetails[bonus.playerId]) gameState.bonusDetails[bonus.playerId] = [];
        gameState.bonusDetails[bonus.playerId].push({ amount: bonus.amount, reason: bonus.reason });
      }
    }

    gameState.lastTrickResult = trickResult;
    gameState.phase = 'trick_result';

    // 检查本轮是否结束（手牌打完了）
    const remainingCards = playerIds.reduce((sum, id) => sum + gameState.hands[id].length, 0);
    if (remainingCards === 0) {
      roundComplete = true;
      gameState.phase = 'round_summary';
      roundSummary = calculateRoundSummary(gameState);
      gameState.roundHistory.push(roundSummary);
    }
  }

  return {
    card,
    trickComplete,
    trickResult,
    roundComplete,
    roundSummary,
  };
}

/**
 * 准备下一墩
 */
function nextTrick(gameState) {
  const playerIds = Object.keys(gameState.hands);
  const remainingCards = playerIds.reduce((sum, id) => sum + gameState.hands[id].length, 0);
  if (remainingCards === 0) return null;

  if (gameState.lastTrickResult) {
    const { winnerId, cancelled, cancelType, cancelPlayerId } = gameState.lastTrickResult;
    let nextLeaderIndex;

    if (winnerId) {
      // 正常赢家领下一墩
      nextLeaderIndex = playerIds.indexOf(winnerId);
    } else if (cancelled) {
      if (cancelType === 'kraken') {
        // 沉船：领出权给沉船出牌者左边（数组中下一位）
        const krakenIndex = playerIds.indexOf(cancelPlayerId);
        nextLeaderIndex = (krakenIndex + 1) % playerIds.length;
      } else {
        // 白鲸（无数字牌）：白鲸出牌者领下一墩
        nextLeaderIndex = playerIds.indexOf(cancelPlayerId);
        if (nextLeaderIndex === -1) nextLeaderIndex = gameState.currentTrick.leadPlayerIndex;
      }
    } else {
      nextLeaderIndex = gameState.currentTrick.leadPlayerIndex;
    }

    gameState.currentTrick = {
      leadPlayerIndex: nextLeaderIndex,
      leadSuit: null,
      plays: [],
    };
    gameState.currentPlayerIndex = nextLeaderIndex;
  }

  gameState.lastTrickResult = null;
  gameState.phase = 'playing';
  return true;
}

/**
 * 进入下一轮
 * @returns {boolean} 是否游戏结束
 */
function nextRound(gameState) {
  if (gameState.round >= TOTAL_ROUNDS) {
    gameState.phase = 'game_over';
    return true; // 游戏结束
  }

  gameState.round++;
  gameState.phase = 'bidding';
  dealCards(gameState);
  return false; // 继续
}

/**
 * 检查出牌是否合法
 */
function isValidPlay(gameState, playerId, card) {
  const playerIds = Object.keys(gameState.hands);
  const currentPlayerId = playerIds[gameState.currentPlayerIndex];
  if (playerId !== currentPlayerId && gameState.phase === 'playing') return false;

  // 特殊牌随时可以出
  if (card.type !== 'number') return true;

  const trick = gameState.currentTrick;
  if (trick.leadSuit === null) {
    // 当前墩无色，出的第一张数字牌确立花色——OK
    return true;
  }

  // 有花色要求，检查手牌中是否有该花色
  const hand = gameState.hands[playerId];
  const hasLeadSuit = hand.some(c => {
    if (c.type === 'number') {
      return c.suit === trick.leadSuit;
    }
    return false;
  });

  if (hasLeadSuit && card.suit !== trick.leadSuit) {
    return false; // 有该花色必须跟花色
  }

  return true;
}

/**
 * 计算本轮得分汇总
 */
function calculateRoundSummary(gameState) {
  const playerIds = Object.keys(gameState.hands);
  const scores = playerIds.map(id => {
    const bid = gameState.bids[id];
    const tricksWon = gameState.tricksWon[id];
    const bonus = gameState.bonusPoints[id] || 0;
    const details = gameState.bonusDetails[id] || [];
    const bidMet = bid !== 0 && bid === tricksWon;
    const baseScore = calculateRoundScore(bid, tricksWon, 0, gameState.round);
    const total = calculateRoundScore(bid, tricksWon, bonus, gameState.round);
    // 只有竞标成功才展示加分明细
    return { playerId: id, bid, tricksWon, baseScore, bonus, bonusDetails: bidMet ? details : [], total };
  });
  return { scores };
}

/**
 * 手牌排序
 */
function sortHand(hand) {
  const order = { escape: 1, pirate: 2, mermaid: 3, skull_king: 4, tigress: 5, kraken: 6, white_whale: 7, number: 8 };
  const suitOrder = { yellow: 0, green: 1, purple: 2, black: 3 };

  return hand.sort((a, b) => {
    if (order[a.type] !== order[b.type]) return order[a.type] - order[b.type];
    if (a.type === 'number' && b.type === 'number') {
      if (a.suit !== b.suit) return (suitOrder[a.suit] || 0) - (suitOrder[b.suit] || 0);
      return a.value - b.value;
    }
    return 0;
  });
}

module.exports = { createGame, dealCards, submitBid, playCard, nextTrick, nextRound };