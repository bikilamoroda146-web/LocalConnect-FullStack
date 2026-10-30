// Demo persistence only: data lives in this browser and is not shared or secure.
const PREFIX = 'localconnect:v1:'
export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw ? JSON.parse(raw) : fallback
  } catch (error) {
    console.error(`Unable to load LocalConnect demo data for "${key}".`, error)
    return fallback
  }
}
export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
    return true
  } catch (error) {
    console.error(`Unable to save LocalConnect demo data for "${key}".`, error)
    return false
  }
}
export function clearAll() {
  try {
    Object.keys(localStorage).filter((key) => key.startsWith(PREFIX)).forEach((key) => localStorage.removeItem(key))
    return true
  } catch (error) {
    console.error('Unable to clear LocalConnect demo data.', error)
    return false
  }
}
