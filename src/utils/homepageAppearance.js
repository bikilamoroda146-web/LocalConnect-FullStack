import { ACCEPTED_IMAGE_TYPES, ACCEPTED_VIDEO_TYPES, MAX_IMAGE_SIZE_BYTES, MAX_VIDEO_SIZE_BYTES } from './media'

const DB_NAME = 'localconnect-homepage-appearance'
const STORE_NAME = 'appearance'
const RECORD_KEY = 'hero'

export const DEFAULT_HOMEPAGE_APPEARANCE = {
  image: null,
  video: null,
  position: 'center',
}

const POSITIONS = ['center', 'top', 'bottom']

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('This browser does not support local image storage.'))
      return
    }

    const request = window.indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'key' })
      }
    }
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close()
      resolve(request.result)
    }
    request.onerror = () => reject(request.error ?? new Error('Could not open local homepage image storage.'))
    request.onblocked = () => reject(new Error('Homepage image storage is blocked by another browser tab.'))
  })
}

function validateAppearance({ image, video, position }) {
  if (!POSITIONS.includes(position)) throw new Error('Choose a valid homepage image position.')
  if (image !== null && !(image instanceof Blob)) throw new Error('The selected homepage image is invalid.')
  if (image && !ACCEPTED_IMAGE_TYPES.includes(image.type)) {
    throw new Error('Choose a JPEG, PNG, or WebP image.')
  }
  if (image && image.size > MAX_IMAGE_SIZE_BYTES) throw new Error('Homepage images must be 5 MB or smaller.')
  if (video !== undefined && video !== null && !(video instanceof Blob)) throw new Error('The selected homepage video is invalid.')
  if (video && !ACCEPTED_VIDEO_TYPES.includes(video.type)) throw new Error('Choose an MP4 or WebM video.')
  if (video && video.size > MAX_VIDEO_SIZE_BYTES) throw new Error('Homepage videos must be 50 MB or smaller.')
}

export async function getHomepageAppearance() {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly')
    const request = transaction.objectStore(STORE_NAME).get(RECORD_KEY)
    let record = null

    request.onsuccess = () => { record = request.result ?? null }
    request.onerror = () => {
      database.close()
      reject(request.error ?? new Error('Could not read the saved homepage appearance.'))
    }
    transaction.oncomplete = () => {
      database.close()
      resolve(record
        ? { image: record.image ?? null, video: record.video ?? null, position: POSITIONS.includes(record.position) ? record.position : 'center' }
        : DEFAULT_HOMEPAGE_APPEARANCE)
    }
    transaction.onerror = () => {
      database.close()
      reject(transaction.error ?? new Error('Could not read the saved homepage appearance.'))
    }
    transaction.onabort = () => {
      database.close()
      reject(transaction.error ?? new Error('Could not read the saved homepage appearance.'))
    }
  })
}

export async function saveHomepageAppearance(appearance) {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(RECORD_KEY)
    let result
    request.onsuccess = () => {
      const current = request.result
        ? { image: request.result.image ?? null, video: request.result.video ?? null, position: POSITIONS.includes(request.result.position) ? request.result.position : 'center' }
        : DEFAULT_HOMEPAGE_APPEARANCE
      const next = { ...current, ...appearance }
      try {
        validateAppearance(next)
        result = { image: next.image, video: next.video, position: next.position }
        store.put({ key: RECORD_KEY, ...next, updatedAt: Date.now() })
      } catch (validationError) {
        reject(validationError)
        transaction.abort()
      }
    }
    request.onerror = () => {
      reject(request.error ?? new Error('Could not read the saved homepage appearance.'))
      transaction.abort()
    }
    transaction.oncomplete = () => {
      database.close()
      resolve(result)
    }
    transaction.onerror = () => {
      database.close()
      reject(transaction.error ?? new Error('Could not save the homepage appearance.'))
    }
    transaction.onabort = () => {
      database.close()
      reject(transaction.error ?? new Error('Could not save the homepage appearance.'))
    }
  })
}
