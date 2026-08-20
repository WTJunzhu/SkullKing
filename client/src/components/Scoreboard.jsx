import React from 'react';

const emojis = ['🦜', '🦊', '🐙', '🐲', '🦈', '🐺', '🐝', '🐸'];

function Scoreboard({ players, bids, scores, round, tricksWon, currentPlayerId }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      padding: '8px',
    }}>
      {players.map((p, i) => {
        const bid = bids ? bids[p.id] : undefined;
        const won = tricksWon ? tricksWon[p.id] : 0;
        return (
          <div key={p.id} style={{
            display: 'flex',
            alignItems: 'center',
            padding: '6px 10px',
            borderRadius: '8px',
            background: p.id === currentPlayerId
              ? 'rgba(245, 200, 66, 0.15)'
              : 'transparent',
          }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>
              {emojis[i % emojis.length]}
            </span>
            <span style={{ flex: 1, fontSize: '14px', color: '#eee' }}>
              {p.name}
            </span>
            {bid !== undefined && <span style={{ marginLeft: '8px', fontSize: '13px', color: '#f5c842' }}>
              🎯{bid}
            </span>}
            {won !== undefined && <span style={{ marginLeft: '8px', fontSize: '13px', color: '#4ade80' }}>
              🏆{won}
            </span>}
            <span style={{ marginLeft: '8px', fontSize: '14px', color: '#ccc' }}>
              {(p.roundScores || []).reduce((s, rs) => s + rs.total, 0)}分
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default Scoreboard;