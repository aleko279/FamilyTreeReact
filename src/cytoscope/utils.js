// მომხმარებლის სრული სახელი (გვარი და სახელი ერთად) ერთ სტრიქონად
export function getFullName(person) {
  if (!person) return '';
  return [person.fname, person.lname].filter(Boolean).join(' ');
}

// სტრიქონის ნორმალიზაცია ძებნისთვის (მცირე ასოებად და შეცდომების გარეშე)
export function normalizeString(str) {
  return str ? str.trim().toLowerCase() : '';
}

// ძებნისთვის შესაბამისობის შემოწმება
export function matchSearch(query, target) {
  const q = normalizeString(query);
  const t = normalizeString(target);
  return t.includes(q);
}

// ფერების როუნდინგი (ფერის შერჩევა ინდექსის მიხედვით)
const defaultColors = ['#f94144', '#277da1', '#f3722c', '#43aa8b', '#9e2a2b', '#4d908e'];

export function getColorByIndex(index, colors = defaultColors) {
  return colors[index % colors.length];
}

// უნიკალური მასივის შექმნა
export function uniqueArray(arr) {
  return [...new Set(arr)];
}
