export function buildWeeks(count = 16) {
  return Array.from({ length: count }, (_, index) => {
    const number = index + 1;
    return {
      number,
      title: `Semana ${number}`,
    };
  });
}
