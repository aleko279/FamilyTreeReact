import React from 'react';

const CountDisplay = ({ count }) => {
  return (
    <div style={{ fontSize: '15px', color: '#444', whiteSpace: 'nowrap' }}>
      სულ: <strong style={{ color: '#007acc' }}>{count}</strong> ადამიანი
    </div>
  );
};

export default CountDisplay;
