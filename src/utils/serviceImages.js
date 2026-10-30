const DB_NAME = 'localconnect-media'
const STORE_NAME = 'service-images'
const PREFIX = 'indexeddb:'

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('Image storage is not supported by this browser.'))
      return
    }
    const request = window.indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Could not open image storage.'))
  })
}

export const isStoredServiceImage = (value) => typeof value === 'string' && value.startsWith(PREFIX)

export async function saveServiceImage(file) {
  const db = await openDatabase()
  const id = `${PREFIX}${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`}`
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).put(file, id)
    transaction.oncomplete = resolve
    transaction.onerror = () => reject(transaction.error || new Error('Could not save the image.'))
    transaction.onabort = () => reject(transaction.error || new Error('Could not save the image.'))
  }).finally(() => db.close())
  return id
}

export async function getServiceImage(id) {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const request = transaction.objectStore(STORE_NAME).get(id)
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error || new Error('Could not load the image.'))
    transaction.oncomplete = () => db.close()
    transaction.onabort = () => db.close()
  })
}

export async function removeServiceImage(id) {
  if (!isStoredServiceImage(id)) return
  const db = await openDatabase()
  await new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).delete(id)
    transaction.oncomplete = resolve
    transaction.onerror = () => reject(transaction.error || new Error('Could not remove the image.'))
    transaction.onabort = () => reject(transaction.error || new Error('Could not remove the image.'))
  }).finally(() => db.close())
}
