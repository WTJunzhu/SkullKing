import React from 'react';
import Card from './Card';

function TrickArea({ plays, players }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      gap: '8px',
      flexWrap: 'wrap',
      padding: '12px',
      minHeight: '100px',
    }}>
      {plays.map((p, i) => (
        <div key={p.playerId} style={{ textAlign: 'center' }}>
          <Card key={i} card={p.card} size="small" />
          <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
            {players.find(pp => pp.id === p.playerId)?.name}
          </div>
        </div>
      ))}
      {(!plays || plays.length === 0) && (
        <div style={{ color: '#666', fontSize: '14px', alignSelf: 'center' }}>
          等待出牌...
        </div>
      )}
    </div>
  );
}

export default TrickArea;