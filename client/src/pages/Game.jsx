import React, { useState, useEffect, useCallback, useRef } from 'react';
import socket from '../socket';
import Hand from '../components/Hand';
import TrickArea from '../components/TrickArea';
import BidPanel from '../components/BidPanel';
import TigressModal from '../components/TigressModal';
import Scoreboard from '../components/Scoreboard';

const emojis = ['🦜', '🦊', '🐙', '🐲', '🦈', '🐺', '🐝', '🐸'];

function Game({ roomId, playerId, playerName, roomData, onBack }) {
  const [phase, setPhase] = useState('bidding');
  const [hand, setHand] = useState([]);
  const [round, setRound] = useState(1);
  const [allBids, setAllBids] = useState({});
  const [bidsVisible, setBidsVisible] = useState(false);
  const [tricksWonObj, setTricksWonObj] = useState({});
  const [currentTrick, setCurrentTrick] = useState({ plays: [] });
  const [bonusMessages, setBonusMessages] = useState([]);
  const [showTigress, setShowTigress] = useState(false);
  const [roundScores, setRoundScores] = useState(null);
  const [hasBid, setHasBid] = useState(false);
  const [bidValue, setBidValue] = useState(0);
  const [nextPlayerId, setNextPlayerId] = useState(null);
  const [lastTrickWinnerId, setLastTrickWinnerId] = useState(null);
  const [trickCancelType, setTrickCancelType] = useState(null);
  const [finalScores, setFinalScores] = useState(null);
  const [players, setPlayers] = useState(roomData?.players || []);
  // 用 ref 存最后一墩的 roundSummary，避免 trick_result 被立即覆盖
  const pendingRoundSummaryRef = useRef(null);

  useEffect(() => {
    const handleDeal = ({ hand: h, round: r, phase: p }) => {
      if (h) setHand(h);
      if (r) setRound(r);
      if (p) setPhase(p);
      // 新一轮发牌时清空出牌区和上轮残留状态
      setCurrentTrick({ plays: [] });
      setBonusMessages([]);
      setLastTrickWinnerId(null);
      setAllBids({});
      setBidsVisible(false);
      setTricksWonObj({});
      setRoundScores(null);
      pendingRoundSummaryRef.current = null;
    };

    const handleBidUpdate = ({ bids }) => {
      setAllBids(prev => ({ ...prev, ...bids }));
    };

    const handleAllBids = ({ bids, currentPlayerId }) => {
      setAllBids(bids);
      setBidsVisible(true);
      setPhase('playing');
      setHasBid(false);
      if (currentPlayerId) setNextPlayerId(currentPlayerId);
    };

    const handleCardPlay = ({ playerId: pid, card, nextPlayerId: nextPid }) => {
      setCurrentTrick(prev => ({
        plays: [...(prev.plays || []), { playerId: pid, card }],
      }));
      if (nextPid) setNextPlayerId(nextPid);
      // 自己出的牌从手牌移除
      if (pid === playerId) {
        setHand(prev => prev.filter(c => c.id !== card.id));
      }
    };

    const handleTrickDone = ({ winnerId, bonuses, tricksWon, cancelled, cancelType }) => {
      setTricksWonObj(tricksWon || {});
      setBonusMessages(bonuses || []);
      setLastTrickWinnerId(winnerId);
      setTrickCancelType(cancelled ? cancelType : null);
      setPhase('trick_result');
    };

    const handleRoundDone = ({ roundSummary }) => {
      // 不立即跳转到 round_summary，存起来等 trick_result 展示完再展示
      if (roundSummary) pendingRoundSummaryRef.current = roundSummary.scores;
      // phase 保持在 trick_complete 设置的 trick_result，让玩家先看到最后一墩赢家
    };

    const handleNextTrickGame = ({ currentPlayerId }) => {
      setCurrentTrick({ plays: [] });
      setBonusMessages([]);
      setLastTrickWinnerId(null);
      setPhase('playing');
      if (currentPlayerId) setNextPlayerId(currentPlayerId);
    };

    const handleGameStarted = ({ players: ps, currentPlayerId }) => {
      if (ps) setPlayers(ps);
      if (currentPlayerId) setNextPlayerId(currentPlayerId);
    };

    const handleRequestTigress = () => setShowTigress(true);
    const handleError = ({ message }) => alert(message);
    const handleGameOver = ({ finalScores: fs }) => {
      setPhase('game_over');
      if (fs) setFinalScores(fs);
    };

    socket.emit('request_hand');

    socket.on('game_started', handleGameStarted);
    socket.on('deal_cards', handleDeal);
    socket.on('bid_update', handleBidUpdate);
    socket.on('all_bids_in', handleAllBids);
    socket.on('card_played', handleCardPlay);
    socket.on('trick_complete', handleTrickDone);
    socket.on('round_complete', handleRoundDone);
    socket.on('next_trick_game', handleNextTrickGame);
    socket.on('request_tigress', handleRequestTigress);
    socket.on('error', handleError);
    socket.on('game_over', handleGameOver);

    return () => {
      socket.off('game_started', handleGameStarted);
      socket.off('deal_cards', handleDeal);
      socket.off('bid_update', handleBidUpdate);
      socket.off('all_bids_in', handleAllBids);
      socket.off('card_played', handleCardPlay);
      socket.off('trick_complete', handleTrickDone);
      socket.off('round_complete', handleRoundDone);
      socket.off('next_trick_game', handleNextTrickGame);
      socket.off('request_tigress', handleRequestTigress);
      socket.off('error', handleError);
      socket.off('game_over', handleGameOver);
    };
  }, [playerId]);

  const handleBid = useCallback((bid) => {
    socket.emit('submit_bid', { bid });
    setBidValue(bid);
    setHasBid(true);
  }, []);

  const handleCardSelect = useCallback((cardId) => {
    socket.emit('play_card', { cardId });
  }, []);

  const handleTigressDeclare = useCallback((as) => {
    socket.emit('declare_tigress', { as, cardId: 'tigress' });
    setShowTigress(false);
  }, []);

  const handleNextTrick = useCallback(() => {
    if (pendingRoundSummaryRef.current) {
      // 最后一墩：直接进入轮次结算
      setRoundScores(pendingRoundSummaryRef.current);
      setPhase('round_summary');
      setCurrentTrick({ plays: [] });
      pendingRoundSummaryRef.current = null;
    } else {
      socket.emit('next_trick');
    }
  }, []);

  const handleNextRound = useCallback(() => {
    socket.emit('next_round');
    setPhase('bidding');
    setCurrentTrick({ plays: [] });
    setBidsVisible(false);
    setHasBid(false);
    setRoundScores(null);
    setBonusMessages([]);
  }, []);

  const getName = (id) => players.find(p => p.id === id)?.name || '某玩家';
  const isMyTurn = nextPlayerId === playerId;

  // 游戏结束页
  if (phase === 'game_over') {
    const scores = finalScores || [];
    return (
      <div style={s.page}>
        <div style={{ ...s.card, maxWidth: 400 }}>
          <div style={{ fontSize: 48, textAlign: 'center' }}>🏴‍☠️</div>
          <h2 style={s.gold}>游戏结束！最终排名</h2>
          {scores.map((sc, i) => (
            <div key={sc.playerId} style={{ ...s.row, background: i === 0 ? 'rgba(245,200,66,0.2)' : 'rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: 20 }}>{['🥇', '🥈', '🥉'][i] || `${i + 1}.`}</span>
              <span style={{ flex: 1, marginLeft: 10, fontSize: 16 }}>{sc.name || getName(sc.playerId)}</span>
              <span style={{ ...s.gold, fontSize: 20 }}>{sc.totalScore} 分</span>
            </div>
          ))}
          <button style={s.btn} onClick={onBack}>返回首页</button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      {/* 顶部：轮次 + 玩家状态栏 */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '8px 12px' }}>
        <div style={{ textAlign: 'center', ...s.gold, fontSize: 18, fontWeight: 'bold', marginBottom: 6 }}>
          第 {round} 轮 / 10
        </div>
        <Scoreboard
          players={players}
          bids={bidsVisible ? allBids : {}}
          tricksWon={tricksWonObj}
          currentPlayerId={nextPlayerId}
        />
      </div>

      {/* 竞标阶段 */}
      {phase === 'bidding' && !hasBid && (
        <BidPanel maxBid={round} onBid={handleBid} disabled={false} />
      )}
      {phase === 'bidding' && hasBid && (
        <div style={{ padding: 24, textAlign: 'center', color: '#aaa' }}>
          已竞标 <span style={s.gold}>{bidValue}</span> 墩，等待其他玩家...
        </div>
      )}

      {/* 出牌区 */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <TrickArea plays={currentTrick.plays || []} players={players} />
      </div>

      {/* 墩结束：展示赢家与加分 */}
      {phase === 'trick_result' && (
        <div style={{ padding: '12px 16px', background: 'rgba(245,200,66,0.08)', borderTop: '1px solid rgba(245,200,66,0.3)' }}>
          <div style={{ textAlign: 'center', ...s.gold, fontSize: 16, marginBottom: 6 }}>
            {trickCancelType === 'kraken' && '🦑 沉船出现！这一墩无人赢取'}
            {trickCancelType === 'whale_no_numbers' && '🐋 白鲸现身！无数字牌，这一墩无人赢取'}
            {!trickCancelType && lastTrickWinnerId && `🏆 ${getName(lastTrickWinnerId)} 赢得了这一墩！`}
          </div>
          {bonusMessages.map((m, i) => (
            <div key={i} style={{ textAlign: 'center', color: '#f5c842', fontSize: 14, marginBottom: 4 }}>
              +{m.amount} {m.reason}
            </div>
          ))}
          <button style={{ ...s.btn, padding: '10px 24px', fontSize: 16 }} onClick={handleNextTrick}>
            下一墩 →
          </button>
        </div>
      )}

      {/* 轮次总结 */}
      {phase === 'round_summary' && roundScores && (
        <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.4)' }}>
          <h3 style={{ ...s.gold, textAlign: 'center', margin: '0 0 12px' }}>第 {round} 轮结束</h3>
          {roundScores.map(sc => {
            const name = getName(sc.playerId);
            const hit = sc.bid === sc.tricksWon;
            const hasBonus = hit && sc.bonusDetails && sc.bonusDetails.length > 0;
            return (
              <div key={sc.playerId} style={{ ...s.row, flexDirection: 'column', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                  <span style={{ flex: 1, fontSize: 14 }}>{name}</span>
                  <span style={{ fontSize: 13, color: '#9ca3af', marginRight: 8 }}>
                    竞标{sc.bid} 赢{sc.tricksWon}
                  </span>
                  <span style={{ fontSize: 14, color: hit ? '#4ade80' : '#f87171', fontWeight: 'bold' }}>
                    {sc.total > 0 ? '+' : ''}{sc.total}分
                  </span>
                </div>
                {hasBonus && (
                  <div style={{ fontSize: 12, color: '#f5c842', marginTop: 4, lineHeight: 1.6 }}>
                    {sc.bonusDetails.map((d, i) => (
                      <span key={i} style={{ marginRight: 8 }}>+{d.amount}（{d.reason}）</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <button style={s.btn} onClick={handleNextRound}>
            {round >= 10 ? '查看最终排名' : '下一轮 →'}
          </button>
        </div>
      )}

      {/* 当前玩家提示 + 手牌 */}
      {(phase === 'playing' || phase === 'bidding') && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {phase === 'playing' && (
            <div style={{ textAlign: 'center', padding: '6px 0', fontSize: 13, color: isMyTurn ? '#4ade80' : '#9ca3af' }}>
              {isMyTurn ? '✋ 轮到你出牌' : `⏳ 等待 ${getName(nextPlayerId)} 出牌`}
            </div>
          )}
          <Hand
            cards={hand}
            onCardSelect={phase === 'playing' && isMyTurn ? handleCardSelect : null}
          />
        </div>
      )}

      <TigressModal visible={showTigress} onSelect={handleTigressDeclare} />
    </div>
  );
}

const s = {
  page: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100dvh',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    color: '#eee',
  },
  gold: { color: '#f5c842' },
  card: {
    background: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    padding: 24,
    margin: 'auto',
    width: '90%',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 12px',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.05)',
    marginBottom: 4,
  },
  btn: {
    display: 'block',
    width: '100%',
    padding: '14px',
    fontSize: 18,
    borderRadius: 8,
    border: 'none',
    background: '#f5c842',
    color: '#1a1a2e',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: 12,
  },
};

export default Game;
