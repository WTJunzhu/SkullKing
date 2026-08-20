import React from 'react';

const NUMBER_COLORS = {
  yellow: { bg: '#b45309', text: '#fef3c7' },
  green:  { bg: '#15803d', text: '#dcfce7' },
  purple: { bg: '#6d28d9', text: '#ede9fe' },
  black:  { bg: '#1c1917', text: '#e5e7eb', border: '#57534e' },
};

const SPECIAL_STYLES = {
  escape:      { bg: '#374151', text: '#9ca3af', label: '投降'   },
  pirate:      { bg: '#7f1d1d', text: '#fca5a5', label: '海盗'   },
  mermaid:     { bg: '#155e75', text: '#67e8f9', label: '美人鱼' },
  skull_king:  { bg: '#1e1b4b', text: '#a5b4fc', label: '骷髅王' },
  tigress:     { bg: '#78350f', text: '#fde68a', label: '母老虎' },
  kraken:      { bg: '#be185d', text: '#fce7f3', label: '沉船'   },
  white_whale: { bg: '#9ca3af', text: '#1f2937', label: '白鲸'   },
};

function getSpecialStyle(card) {
  if (card.type === 'tigress') {
    if (card.declaredAs === 'pirate')  return { ...SPECIAL_STYLES.pirate,  label: '母老虎', sub: '作海盗' };
    if (card.declaredAs === 'escape')  return { ...SPECIAL_STYLES.escape,  label: '母老虎', sub: '作投降' };
    return SPECIAL_STYLES.tigress;
  }
  return SPECIAL_STYLES[card.type] || { bg: '#333', text: '#fff', label: '?' };
}

function Card({ card, onClick, size }) {
  if (!card) return null;

  const w = size === 'small' ? 52 : 64;
  const h = size === 'small' ? 72 : 90;
  const isNumber = card.type === 'number';

  let bg, textColor, border, content;

  if (isNumber) {
    const c = NUMBER_COLORS[card.suit] || { bg: '#333', text: '#fff' };
    bg = c.bg; textColor = c.text; border = c.border;
    const fs = size === 'small' ? 15 : 19;
    content = (
      <span style={{ fontSize: fs, fontWeight: 'bold', fontFamily: 'monospace' }}>
        {card.displayName}
      </span>
    );
  } else {
    const sp = getSpecialStyle(card);
    bg = sp.bg; textColor = sp.text;
    const labelFs = size === 'small' ? 11 : 13;
    const subFs   = size === 'small' ? 9  : 11;
    content = sp.sub ? (
      <div style={{ textAlign: 'center', lineHeight: 1.3 }}>
        <div style={{ fontSize: labelFs, fontWeight: 'bold' }}>{sp.label}</div>
        <div style={{ fontSize: subFs, opacity: 0.85 }}>({sp.sub.replace('作', '')})</div>
      </div>
    ) : (
      <span style={{ fontSize: labelFs, fontWeight: 'bold', textAlign: 'center' }}>
        {sp.label}
      </span>
    );
  }

  const clickable = !!onClick;

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: w,
        height: h,
        borderRadius: 8,
        border: `2px solid ${border || 'rgba(255,255,255,0.25)'}`,
        background: bg,
        color: textColor,
        cursor: clickable ? 'pointer' : 'default',
        margin: 4,
        userSelect: 'none',
        padding: '2px 4px',
        boxShadow: clickable
          ? '0 0 0 2px rgba(245,200,66,0.6), 0 2px 8px rgba(0,0,0,0.4)'
          : '0 1px 4px rgba(0,0,0,0.3)',
        opacity: clickable ? 1 : 0.85,
        transition: 'transform 0.1s, box-shadow 0.1s',
        WebkitTapHighlightColor: 'transparent',
      }}
      onClick={onClick}
    >
      {content}
    </div>
  );
}

export default Card;
