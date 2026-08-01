export function clsx(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function safeGetItem(key, fallback = null) {
  try {
    const val = localStorage.getItem(key);
    return val !== null && val !== undefined ? val : fallback;
  } catch (e) {
    console.warn(`localStorage.getItem failed for key "${key}":`, e);
    return fallback;
  }
}

export function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.warn(`localStorage.setItem failed for key "${key}":`, e);
    return false;
  }
}

export function safeRemoveItem(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.warn(`localStorage.removeItem failed for key "${key}":`, e);
    return false;
  }
}

