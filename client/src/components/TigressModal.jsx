import React from 'react';

function TigressModal({ onSelect, visible }) {
  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: '#16213e',
        borderRadius: '16px',
        padding: '24px',
        textAlign: 'center',
        maxWidth: '320px',
        width: '90%',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🐯</div>
        <h2 style={{ color: '#f5c842', marginBottom: '8px' }}>母老虎如何出击？</h2>
        <p style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '20px' }}>
          选择母老虎的出击方式
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => onSelect('pirate')}
            style={{
              padding: '18px 24px',
              fontSize: '18px',
              borderRadius: '12px',
              border: 'none',
              background: '#dc2626',
              color: '#fff',
              fontWeight: 'bold',
              cursor: 'pointer',
              flex: 1,
            }}
          >
            作为海盗 🏴‍☠️
          </button>
          <button
            onClick={() => onSelect('escape')}
            style={{
              padding: '18px 24px',
              fontSize: '18px',
              borderRadius: '12px',
              border: 'none',
              background: '#4b5563',
              color: '#fff',
              fontWeight: 'bold',
              cursor: 'pointer',
              flex: 1,
            }}
          >
            作为逃跑 🏃
          </button>
        </div>
      </div>
    </div>
  );
}

export default TigressModal;