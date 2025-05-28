import React from 'react';

const Filters = ({ allLnames, selectedLname, onFilterChange }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <label htmlFor="lname-select" style={{ fontWeight: '600', fontSize: '15px', color: '#333' }}>ფილტრი:</label>
      <select
        id="lname-select"
        value={selectedLname}
        onChange={(e) => onFilterChange(e.target.value)}
        style={{
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid #ccc',
          fontSize: '14px',
          backgroundColor: '#f9f9f9',
          outline: 'none',
        }}
      >
        <option value="">ყველა</option>
        {allLnames.map(name => (
          <option key={name} value={name}>{name}</option>
        ))}
      </select>
    </div>
  );
};

export default Filters;
