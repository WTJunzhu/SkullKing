// 骷髅王卡牌定义与洗牌

const SUITS = ['yellow', 'green', 'purple'];
const BLACK = 'black';

/**
 * 创建一副完整的牌（共 66 张）
 */
function createDeck() {
  const cards = [];

  // 有色数字牌: 3种花色 × 14 张
  for (const suit of SUITS) {
    for (let v = 1; v <= 14; v++) {
      cards.push({
        id: `${suit}_${v}`,
        type: 'number',
        suit,
        value: v,
        displayName: getDisplayName(suit, v),
      });
    }
  }

  // 黑色数字牌（王牌花色）: 14 张
  for (let v = 1; v <= 14; v++) {
    cards.push({
      id: `black_${v}`,
      type: 'number',
      suit: 'black',
      value: v,
      displayName: `黑${v}`,
    });
  }

  // 逃跑（Escape）: 5 张
  for (let i = 1; i <= 5; i++) {
    cards.push({
      id: `escape_${i}`,
      type: 'escape',
      suit: null,
      value: 0,
      displayName: '逃跑',
    });
  }

  // 海盗（Pirate）: 5 张
  for (let i = 1; i <= 5; i++) {
    cards.push({
      id: `pirate_${i}`,
      type: 'pirate',
      suit: null,
      value: 0,
      displayName: '海盗',
    });
  }

  // 美人鱼（Mermaid）: 2 张
  for (let i = 1; i <= 2; i++) {
    cards.push({
      id: `mermaid_${i}`,
      type: 'mermaid',
      suit: null,
      value: 0,
      displayName: '美人鱼',
    });
  }

  // 骷髅王（Skull King）: 1 张
  cards.push({
    id: 'skull_king',
    type: 'skull_king',
    suit: null,
    value: 0,
    displayName: '骷髅王',
  });

  // 母老虎（Tigress）: 1 张
  cards.push({
    id: 'tigress',
    type: 'tigress',
    suit: null,
    value: 0,
    displayName: '母老虎',
  });

  // 沉船（Kraken）: 1 张 — 整墩作废，无人赢墩
  cards.push({
    id: 'kraken',
    type: 'kraken',
    suit: null,
    value: 0,
    displayName: '沉船',
  });

  // 白鲸（White Whale）: 1 张 — 功能牌全部视为逃跑，最大数字赢
  cards.push({
    id: 'white_whale',
    type: 'white_whale',
    suit: null,
    value: 0,
    displayName: '白鲸',
  });

  return cards;
}

/**
 * 花色显示名
 */
function getDisplayName(suit, value) {
  const names = { yellow: '黄', green: '绿', purple: '紫' };
  return `${names[suit]}${value}`;
}

/**
 * Fisher-Yates 洗牌
 */
function shuffle(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

module.exports = { createDeck, shuffle, SUITS, BLACK };