// 墩胜负判断

function isEscape(card) {
  return card.type === 'escape' || (card.type === 'tigress' && card.declaredAs === 'escape');
}

function isPirate(card) {
  return card.type === 'pirate' || (card.type === 'tigress' && card.declaredAs === 'pirate');
}

function isMermaid(card) { return card.type === 'mermaid'; }
function isSkullKing(card) { return card.type === 'skull_king'; }

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
 * 判断本墩赢家
 * @param {Array} plays  - [{ playerId, card }] 按出牌顺序
 * @param {string|null} leadSuit - 本墩花色
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

  // ── 沉船：整墩作废，无人赢 ──
  if (lastSpecialType === 'kraken') {
    return {
      winnerId: null,
      bonuses: [],
      cancelled: true,
      cancelType: 'kraken',
      cancelPlayerId: lastSpecialPlayerId,
    };
  }

  // ── 白鲸：功能牌全视为逃跑，最大数字赢 ──
  if (lastSpecialType === 'white_whale') {
    const numberPlays = plays.filter(p => p.card.type === 'number');
    if (numberPlays.length === 0) {
      // 墩内无数字牌，无人赢，白鲸出牌者领下一墩
      return {
        winnerId: null,
        bonuses: [],
        cancelled: true,
        cancelType: 'whale_no_numbers',
        cancelPlayerId: lastSpecialPlayerId,
      };
    }
    // 最大数字赢（不计花色）；同值取先出者
    let winner = numberPlays[0];
    for (let i = 1; i < numberPlays.length; i++) {
      if (numberPlays[i].card.value > winner.card.value) {
        winner = numberPlays[i];
      }
    }
    return { winnerId: winner.playerId, bonuses: [] };
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

  if (isSkullKing(winner.card)) {
    const pirateCount = plays.filter(p =>
      p.playerId !== winner.playerId &&
      (p.card.type === 'pirate' || p.card.type === 'tigress')
    ).length;
    if (pirateCount > 0) {
      bonuses.push({
        playerId: winner.playerId,
        amount: pirateCount * 30,
        reason: `骷髅王俘获${pirateCount}名海盗`,
      });
    }
  }

  if (isMermaid(winner.card)) {
    const hasSkullKing = plays.some(p =>
      p.playerId !== winner.playerId && p.card.type === 'skull_king'
    );
    if (hasSkullKing) {
      bonuses.push({ playerId: winner.playerId, amount: 50, reason: '美人鱼战胜骷髅王' });
    }
  }

  return { winnerId: winner.playerId, bonuses };
}

module.exports = { resolveTrick, isEscape, isPirate, isMermaid, isSkullKing };
