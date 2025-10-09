export const fetchFamilyTree = () =>
  // fetch('https://aleko279.runasp.net/api/FamilyTree/GetFamilyTree')
fetch('https://localhost:7261/api/FamilyTree/GetFamilyTree')
    .then(res => res.json());

export const fetchSpouseData = async (husbandId) => {
  const data = await fetchFamilyTree();

  const husbandMergePoints = data.relationships
    .filter(r => r.source === husbandId)
    .map(r => r.target);

  const possibleSpouseRelation = data.relationships.find(r =>
    husbandMergePoints.includes(r.target) && r.source !== husbandId
  );

  let spouse = null;
  let wifeName = '';

  if (possibleSpouseRelation) {
    spouse = data.members.find(m => m.id === possibleSpouseRelation.source);
    wifeName = spouse ? `${spouse.fname} ${spouse.lname}` : '';
  }

  return { spouse, wifeName };
};

export const fetchOnlyFamilyTree = (spouseId1, spouseId2) =>
  // fetch(`https://aleko279.runasp.net/api/FamilyTree/GetOnlyFamilyTree?spouseId1=${spouseId1}&spouseId2=${spouseId2}`)
  fetch(`https://localhost:7261/api/FamilyTree/GetOnlyFamilyTree?spouseId1=${spouseId1}&spouseId2=${spouseId2}`)
    .then(res => res.json());
