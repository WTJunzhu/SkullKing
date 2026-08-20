import React from 'react';

const emojis = ['🦜', '🦊', '🐙', '🐲', '🦈', '🐺', '🐝', '🐸'];

function Lobby({ roomId, playerId, roomData, onStartGame, onBack }) {
  if (!roomData) return null;

  const players = roomData.players || [];
  const isHost = roomData.hostId === playerId;

  const handleCopyRoomId = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(roomId).then(() => alert('房间码已复制到剪贴板'));
    }
  };

  const handleShareRoomId = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '骷髅王 Skull King',
          text: `加入我的骷髅王游戏，房间码：${roomId}`,
        });
      } catch (e) {}
    } else {
      handleCopyRoomId();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🦴 骷髅王</h1>
        <div style={styles.roomCode} onClick={handleShareRoomId}>
          房间码：<span style={styles.code}>{roomId}</span>
          <span style={styles.tapHint}>（点击复制/分享）</span>
        </div>
      </div>

      <div style={styles.playersSection}>
        <h3 style={styles.subtitle}>玩家列表</h3>
        {players.map((p, i) => (
          <div key={p.id} style={styles.playerRow}>
            <span style={styles.emoji}>{emojis[i % emojis.length]}</span>
            <span style={styles.playerName}>{p.name}</span>
            {p.id === roomData.hostId && <span style={styles.hostTag}>👑 房主</span>}
          </div>
        ))}
      </div>

      <div style={styles.actions}>
        {isHost && (
          <button
            style={styles.startBtn}
            disabled={players.length < 2}
            onClick={onStartGame}
          >
            开始游戏（{players.length} 人）
          </button>
        )}
        {!isHost && (
          <div style={styles.waiting}>等待房主开始游戏...</div>
        )}
        <button style={styles.backBtn} onClick={onBack}>退出房间</button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100dvh',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    color: '#eee',
    padding: '20px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '28px',
    color: '#f5c842',
  },
  roomCode: {
    fontSize: '18px',
    color: '#ccc',
    padding: '10px',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  code: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#f5c842',
    letterSpacing: '4px',
  },
  tapHint: {
    fontSize: '12px',
    color: '#888',
    marginLeft: '8px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#aaa',
    marginBottom: '12px',
  },
  playersSection: {
    flex: 1,
  },
  playerRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    marginBottom: '8px',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '8px',
  },
  emoji: { fontSize: '28px', marginRight: '12px' },
  playerName: { fontSize: '18px', flex: 1 },
  hostTag: { fontSize: '14px', color: '#f5c842' },
  actions: {
    marginTop: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  startBtn: {
    width: '100%',
    padding: '16px',
    fontSize: '20px',
    borderRadius: '12px',
    border: 'none',
    background: '#f5c842',
    color: '#1a1a2e',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  waiting: {
    textAlign: 'center',
    fontSize: '18px',
    color: '#aaa',
    padding: '12px',
  },
  backBtn: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    borderRadius: '8px',
    border: '1px solid #555',
    background: 'transparent',
    color: '#9ca3af',
    cursor: 'pointer',
  },
};

export default Lobby;