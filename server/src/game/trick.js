// 墩胜负判断

function isEscape(card) {
  return card.type === 'escape' || (card.type === 'tigress' && card.declaredAs === 'escape');
}

function isPirate(card) {
  return card.type === 'pirate' || (card.type === 'tigress' && card.declaredAs === 'pirate');
}

function isMermaid(card) { return card.type === 'mermaid'; }
function isSkullKing(card) { return card.type === 'skull_king'; }

const SUIT_ZH = { yellow: '黄', green: '绿', purple: '紫', black: '黑' };

/**
 * 判断 challenger 是否能打败 current 赢家（普通模式）
 */
function beats(challenger, current, leadSuit) {
  if (isEscape(challenger)) return false;
  if (isEscape(current)) return true;

  if (isSkullKing(current)) return isMermaid(challenger);
  if (isSkullKing(challenger)) return !isMermaid(current);

  if (isPirate(current)) return false;
  if (isPirate(challenger)) return true;

  if (isMermaid(current)) return false;
  if (isMermaid(challenger)) return true;

  // 数字牌 vs 数字牌
  const cBlack = current.suit === 'black';
  const hBlack = challenger.suit === 'black';
  if (cBlack && hBlack) return challenger.value > current.value;
  if (cBlack) return false;
  if (hBlack) return true;

  if (challenger.suit === leadSuit && current.suit !== leadSuit) return true;
  if (challenger.suit === current.suit) return challenger.value > current.value;
  return false;
}

/**
 * 计算14点牌加分（给赢墩者）
 */
function calc14Bonuses(plays, winnerId) {
  const bonuses = [];
  for (const p of plays) {
    if (p.card.type === 'number' && p.card.value === 14) {
      const amount = p.card.suit === 'black' ? 20 : 10;
      bonuses.push({
        playerId: winnerId,
        amount,
        reason: `${SUIT_ZH[p.card.suit] || ''}14点旗帜牌`,
      });
    }
  }
  return bonuses;
}

/**
 * 判断本墩赢家
 * @param {Array} plays  - [{ playerId, card }] 按出牌顺序
 * @param {string|null} leadSuit
 * @returns {{ winnerId, bonuses, cancelled?, cancelType?, cancelPlayerId? }}
 */
function resolveTrick(plays, leadSuit) {
  // 找最后打出的 沉船/白鲸（后打覆盖前打）
  let lastSpecialType = null;
  let lastSpecialPlayerId = null;
  for (const p of plays) {
    if (p.card.type === 'kraken' || p.card.type === 'white_whale') {
      lastSpecialType = p.card.type;
      lastSpecialPlayerId = p.playerId;
    }
  }

  // ── 沉船：整墩作废 ──
  if (lastSpecialType === 'kraken') {
    return {
      winnerId: null,
      bonuses: [],
      cancelled: true,
      cancelType: 'kraken',
      cancelPlayerId: lastSpecialPlayerId,
    };
  }

  // ── 白鲸：功能牌视为逃跑，最大数字赢 ──
  if (lastSpecialType === 'white_whale') {
    const numberPlays = plays.filter(p => p.card.type === 'number');
    if (numberPlays.length === 0) {
      return {
        winnerId: null,
        bonuses: [],
        cancelled: true,
        cancelType: 'whale_no_numbers',
        cancelPlayerId: lastSpecialPlayerId,
      };
    }
    let winner = numberPlays[0];
    for (let i = 1; i < numberPlays.length; i++) {
      if (numberPlays[i].card.value > winner.card.value) winner = numberPlays[i];
    }
    const bonuses = calc14Bonuses(plays, winner.playerId);
    return { winnerId: winner.playerId, bonuses };
  }

  // ── 普通结算 ──
  let winnerIndex = 0;
  const allEscape = plays.every(p => isEscape(p.card));
  if (!allEscape) {
    for (let i = 1; i < plays.length; i++) {
      if (beats(plays[i].card, plays[winnerIndex].card, leadSuit)) {
        winnerIndex = i;
      }
    }
  }

  const winner = plays[winnerIndex];
  const bonuses = [];

  // 骷髅王俘获海盗：+30 / 海盗（母老虎无论宣告也算）
  if (isSkullKing(winner.card)) {
    const pirates = plays.filter(p =>
      p.playerId !== winner.playerId &&
      (p.card.type === 'pirate' || p.card.type === 'tigress')
    );
    if (pirates.length > 0) {
      bonuses.push({
        playerId: winner.playerId,
        amount: pirates.length * 30,
        reason: `骷髅王俘获${pirates.length}名海盗`,
      });
    }
  }

  // 美人鱼战胜骷髅王：+40
  if (isMermaid(winner.card)) {
    const hasSkullKing = plays.some(p =>
      p.playerId !== winner.playerId && p.card.type === 'skull_king'
    );
    if (hasSkullKing) {
      bonuses.push({ playerId: winner.playerId, amount: 40, reason: '美人鱼战胜骷髅王' });
    }
  }

  // 海盗俘获美人鱼：+20 / 美人鱼
  if (isPirate(winner.card)) {
    const mermaids = plays.filter(p =>
      p.playerId !== winner.playerId && isMermaid(p.card)
    );
    if (mermaids.length > 0) {
      bonuses.push({
        playerId: winner.playerId,
        amount: mermaids.length * 20,
        reason: `海盗俘获${mermaids.length}条美人鱼`,
      });
    }
  }

  // 14点旗帜牌加分
  bonuses.push(...calc14Bonuses(plays, winner.playerId));

  return { winnerId: winner.playerId, bonuses };
}

module.exports = { resolveTrick, isEscape, isPirate, isMermaid, isSkullKing };
