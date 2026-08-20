import React, { useState } from 'react';

function BidPanel({ maxBid, onBid, disabled }) {
  const [value, setValue] = useState(0);

  const handleBid = () => {
    onBid(value);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '16px',
      gap: '12px',
    }}>
      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f5c842' }}>
        预测你能赢几墩？
      </div>
      <div style={{ fontSize: '14px', color: '#9ca3af' }}>
        0 到 {maxBid} 墩
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => setValue(Math.max(0, value - 1))} style={btnStyle}>
          -
        </button>
        <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#f5c842', minWidth: '48px', textAlign: 'center' }}>
          {value}
        </span>
        <button onClick={() => setValue(Math.min(maxBid, value + 1))} style={btnStyle}>
          +
        </button>
      </div>

      <button
        onClick={handleBid}
        disabled={disabled}
        style={{
          padding: '14px 32px',
          fontSize: '18px',
          borderRadius: '8px',
          border: 'none',
          background: '#f5c842',
          color: '#1a1a2e',
          fontWeight: 'bold',
          cursor: 'pointer',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        确认竞标
      </button>
    </div>
  );
}

const btnStyle = {
  width: '48px',
  height: '48px',
  fontSize: '24px',
  borderRadius: '50%',
  border: 'none',
  background: '#f5c842',
  color: '#1a1a2e',
  fontWeight: 'bold',
  cursor: 'pointer',
};

export default BidPanel;