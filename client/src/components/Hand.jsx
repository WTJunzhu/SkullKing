import React from 'react';
import Card from './Card';

function Hand({ cards, onCardSelect }) {
  return (
    <div style={{
      display: 'flex',
      overflowX: 'auto',
      padding: '8px',
      gap: '4px',
      alignItems: 'flex-end',
      WebkitOverflowScrolling: 'touch',
    }}>
      {cards.map((card) => (
        <Card
          key={card.id}
          card={card}
          onClick={() => onCardSelect && onCardSelect(card.id)}
          size="normal"
        />
      ))}
    </div>
  );
}

export default Hand;