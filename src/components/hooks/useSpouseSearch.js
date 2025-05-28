// components/hooks/useSpouseSearch.js

import { useState } from 'react';

const useSpouseSearch = (elements) => {
  const [husbandName, setHusbandName] = useState('');
  const [wifeName, setWifeName] = useState('');
  const [filteredElements, setFilteredElements] = useState([]);
  const [filteredCount, setFilteredCount] = useState(0);

  const searchBySpouses = () => {
    const trimmedHusband = husbandName.trim().toLowerCase();
    const trimmedWife = wifeName.trim().toLowerCase();

    if (!trimmedHusband && !trimmedWife) {
      setFilteredElements(elements);
      setFilteredCount(elements.length);
      return;
    }

    const matched = elements.filter((el) => {
      if (!el.data || !el.data.spouses) return false;
      const spouses = el.data.spouses.map(s => s.toLowerCase());
      const name = el.data.name.toLowerCase();

      const husbandMatch = trimmedHusband && (name.includes(trimmedHusband) || spouses.includes(trimmedHusband));
      const wifeMatch = trimmedWife && (name.includes(trimmedWife) || spouses.includes(trimmedWife));

      if (trimmedHusband && trimmedWife) {
        return husbandMatch && wifeMatch;
      }

      return husbandMatch || wifeMatch;
    });

    setFilteredElements(matched);
    setFilteredCount(matched.length);
  };

  return {
    husbandName,
    setHusbandName,
    wifeName,
    setWifeName,
    searchBySpouses,
    filteredElements,
    filteredCount,
  };
};

export default useSpouseSearch;
