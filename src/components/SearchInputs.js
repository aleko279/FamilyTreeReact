import React, { useEffect, useState } from 'react';
import FilterSelect from './FilterSelect'; // უნდა აკეთებდეს ძიებად Dropdown-ს
import { fetchOnlyFamilyTree, fetchSpouseData } from '../services/familyTreeService';

const SearchInputs = ({
  peopleList, // მთლიანი სია სადაც არის id, fname, lname, spouseId
  setElements,
  setConnections
}) => {
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [relatedSpouse, setRelatedSpouse] = useState(null);

  useEffect(() => {
    if (selectedPerson) {
      //const spouse = peopleList.find(p => p.id === selectedPerson.id);
      fetchSpouseData(selectedPerson.id).then(({ spouse, wifeName }) => {
        setRelatedSpouse(spouse || null);
        //setWifeSearch(wifeName);
      });

    } else {
      setRelatedSpouse(null);
    }
  }, [selectedPerson]);

  const handleSearch = () => {
    if (!selectedPerson || !relatedSpouse) return;
    fetchOnlyFamilyTree(
      selectedPerson.id, relatedSpouse.id
    ).then(data => {
      setElements(data.members);
      setConnections(data.relationships);
    });
  };

  return (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
      <FilterSelect
        options={peopleList}
        value={selectedPerson}
        onChange={setSelectedPerson}
        placeholder="აირჩიე პიროვნება"
        getOptionLabel={(p) => `${p.fname} ${p.lname}`}
      />
      <input
        type="text"
        value={relatedSpouse ? `${relatedSpouse.fname} ${relatedSpouse.lname}` : ''}
        disabled
        placeholder="მეუღლე"
        style={{
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid #ccc',
          fontSize: '14px',
          width: '200px',
          backgroundColor: '#eee'
        }}
      />
      <button
        onClick={handleSearch}
        disabled={!selectedPerson || !relatedSpouse}
        style={{
          padding: '10px 18px',
          backgroundColor: (!selectedPerson || !relatedSpouse) ? '#ccc' : '#007acc',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          cursor: (!selectedPerson || !relatedSpouse) ? 'not-allowed' : 'pointer',
          fontWeight: 'bold'
        }}
      >
        ძიება
      </button>
    </div>
  );
};

export default SearchInputs;
