// 骷髅王计分逻辑

/**
 * 计算本轮得分
 * @param {number} bid - 竞标墩数
 * @param {number} tricksWon - 实际赢墩数
 * @param {number} bonusPoints - 加分奖励总和
 * @param {number} round - 当前轮数
 * @returns {number} 本轮得分
 */
function calculateRoundScore(bid, tricksWon, bonusPoints, round) {
  if (bid === 0) {
    // 竞标零墩
    return tricksWon === 0 ? round * 10 : -(round * 10);
  }

  const diff = Math.abs(bid - tricksWon);
  if (diff === 0) {
    // 竞标成功：基础分 + 额外奖励分
    return bid * 20 + bonusPoints;
  }

  // 竞标失败
  return -(diff * 10);
}

module.exports = { calculateRoundScore };