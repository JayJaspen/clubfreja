import { sql } from '@vercel/postgres';
export { sql };

export const COUNTIES = [
  'Blekinge','Dalarna','Gotland','Gävleborg','Halland','Jämtland','Jönköping',
  'Kalmar','Kronoberg','Norrbotten','Skåne','Stockholm','Södermanland','Uppsala',
  'Värmland','Västerbotten','Västernorrland','Västmanland','Västra Götaland','Örebro','Östergötland'
];

export const CIVIL_STATUSES = [
  { value: 'single', label: 'Singel' },
  { value: 'taken', label: 'Upptagen' },
  { value: 'undisclosed', label: 'Vill inte ange' },
];

export const GENDERS = [
  { value: 'male', label: 'Man' },
  { value: 'female', label: 'Kvinna' },
  { value: 'other', label: 'Annat' },
];

export function getAgeRange(birthYear: number): string {
  const age = new Date().getFullYear() - birthYear;
  if (age <= 25) return '18-25';
  if (age <= 35) return '26-35';
  if (age <= 45) return '36-45';
  if (age <= 55) return '46-55';
  if (age <= 65) return '56-65';
  return '66+';
}

export function formatGender(val: string): string {
  return GENDERS.find(g => g.value === val)?.label || val;
}

export function formatCivilStatus(val: string): string {
  return CIVIL_STATUSES.find(s => s.value === val)?.label || val;
}
