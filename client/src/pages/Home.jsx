import React, { useState } from 'react';

function Home({ onCreateRoom, onJoinRoom, connected }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [mode, setMode] = useState(null); // null | 'create' | 'join'

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (mode === 'create') {
      onCreateRoom(name.trim());
    } else if (mode === 'join' && code.trim().length >= 4) {
      onJoinRoom(code.trim(), name.trim());
    }
  };

  if (mode === 'create' || mode === 'join') {
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>骷髅王 Skull King</h1>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>你的昵称</label>
          <input
            style={styles.input}
            placeholder="输入昵称"
            maxLength={12}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          {mode === 'join' && (
            <>
              <label style={styles.label}>房间码</label>
              <input
                style={styles.input}
                placeholder="输入6位房间码"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                autoCapitalize="on"
              />
            </>
          )}
          <button type="submit" style={styles.btn} disabled={!name.trim() || !connected}>
            {mode === 'create' ? '创建房间' : '加入房间'}
          </button>
          <button type="button" style={styles.backBtn} onClick={() => { setMode(null); setName(''); setCode(''); }}>
            返回
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>骷髅王 Skull King</h1>
      <div style={styles.statusRow}>
        {connected ? (
          <span style={styles.connected}>已连接 ✓</span>
        ) : (
          <span style={styles.disconnected}>连接中...</span>
        )}
      </div>
      <button style={styles.mainBtn} onClick={() => setMode('create')}>
        🎮 创建房间
      </button>
      <button style={styles.mainBtn} onClick={() => setMode('join')}>
        🚪 加入房间
      </button>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100dvh',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    color: '#eee',
    padding: '20px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#f5c842',
    textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
    marginBottom: '30px',
  },
  statusRow: {
    marginBottom: '20px',
    fontSize: '14px',
  },
  connected: { color: '#4ade80' },
  disconnected: { color: '#ef4444' },
  form: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: '320px',
    gap: '12px',
  },
  label: {
    fontSize: '14px',
    color: '#9ca3af',
    marginBottom: '4px',
  },
  input: {
    padding: '14px 16px',
    fontSize: '16px',
    borderRadius: '8px',
    border: 'none',
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    outline: 'none',
    textTransform: 'uppercase',
  },
  btn: {
    padding: '14px',
    fontSize: '18px',
    borderRadius: '8px',
    border: 'none',
    background: '#f5c842',
    color: '#1a1a2e',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '8px',
  },
  backBtn: {
    padding: '10px',
    fontSize: '14px',
    borderRadius: '8px',
    border: '1px solid #555',
    background: 'transparent',
    color: '#9ca3af',
    cursor: 'pointer',
  },
  mainBtn: {
    width: '100%',
    maxWidth: '320px',
    padding: '18px',
    fontSize: '20px',
    borderRadius: '12px',
    border: 'none',
    background: '#f5c842',
    color: '#1a1a2e',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginBottom: '16px',
  },
};

export default Home;