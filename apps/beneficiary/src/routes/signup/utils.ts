export function calculateAge(isoDate: string): number {
  const birthDate = new Date(isoDate);
  if (Number.isNaN(birthDate.getTime())) {
    return Number.NaN;
  }
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }
  return age;
}
