// Shared random helpers for fair gameplay behavior.

export const shuffleArray = (items) => {
  const arr = Array.isArray(items) ? [...items] : [];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export const pickRandom = (items, fallback = null) => {
  if (!Array.isArray(items) || items.length === 0) return fallback;
  return items[Math.floor(Math.random() * items.length)];
};

export const pickRandomItems = (items, count) => {
  return shuffleArray(items).slice(0, Math.max(0, count));
};
