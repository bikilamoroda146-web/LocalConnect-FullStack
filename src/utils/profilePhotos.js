const DB_NAME = 'localconnect-profile-photos'
const STORE_NAME = 'photos'
export const PROFILE_PHOTO_CHANGED = 'localconnect:profile-photo-changed'

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('This browser does not support local photo storage.'))
      return
    }
    const request = window.indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'userId' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open local photo storage.'))
    request.onblocked = () => reject(new Error('Local photo storage is blocked by another browser tab.'))
  })
}

export async function getProfilePhoto(userId) {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly')
    const request = transaction.objectStore(STORE_NAME).get(userId)
    request.onsuccess = () => resolve(request.result?.blob ?? null)
    request.onerror = () => reject(request.error ?? new Error('Could not read the saved profile photo.'))
    transaction.oncomplete = () => database.close()
    transaction.onerror = () => {
      database.close()
      reject(transaction.error ?? new Error('Could not read the saved profile photo.'))
    }
  })
}

export async function saveProfilePhoto(userId, blob) {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).put({ userId, blob, updatedAt: Date.now() })
    transaction.oncomplete = () => {
      database.close()
      window.dispatchEvent(new CustomEvent(PROFILE_PHOTO_CHANGED, { detail: { userId } }))
      resolve()
    }
    transaction.onerror = () => {
      database.close()
      reject(transaction.error ?? new Error('Could not save the profile photo.'))
    }
    transaction.onabort = () => {
      database.close()
      reject(transaction.error ?? new Error('Could not save the profile photo.'))
    }
  })
}

export async function removeProfilePhoto(userId) {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite')
    transaction.objectStore(STORE_NAME).delete(userId)
    transaction.oncomplete = () => {
      database.close()
      window.dispatchEvent(new CustomEvent(PROFILE_PHOTO_CHANGED, { detail: { userId } }))
      resolve()
    }
    transaction.onerror = () => {
      database.close()
      reject(transaction.error ?? new Error('Could not remove the profile photo.'))
    }
    transaction.onabort = () => {
      database.close()
      reject(transaction.error ?? new Error('Could not remove the profile photo.'))
    }
  })
}

const PORTFOLIO_DB_NAME = 'localconnect-portfolio-media'
const PORTFOLIO_STORE_NAME = 'media'

function openPortfolioDatabase() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('This browser does not support local photo storage.'))
      return
    }
    const request = window.indexedDB.open(PORTFOLIO_DB_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(PORTFOLIO_STORE_NAME)) {
        request.result.createObjectStore(PORTFOLIO_STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open portfolio photo storage.'))
    request.onblocked = () => reject(new Error('Portfolio photo storage is blocked by another browser tab.'))
  })
}

export async function getPortfolioMedia(id, ownerId) {
  const database = await openPortfolioDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(PORTFOLIO_STORE_NAME, 'readonly')
    const request = transaction.objectStore(PORTFOLIO_STORE_NAME).get(id)
    request.onsuccess = () => resolve(request.result?.ownerId === ownerId ? request.result.blob : null)
    request.onerror = () => reject(request.error ?? new Error('Could not read this portfolio photo.'))
    transaction.oncomplete = () => database.close()
    transaction.onerror = () => {
      database.close()
      reject(transaction.error ?? new Error('Could not read this portfolio photo.'))
    }
  })
}

export async function savePortfolioMedia(id, ownerId, blob) {
  const database = await openPortfolioDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(PORTFOLIO_STORE_NAME, 'readwrite')
    transaction.objectStore(PORTFOLIO_STORE_NAME).put({ id, ownerId, blob, updatedAt: Date.now() })
    transaction.oncomplete = () => {
      database.close()
      resolve()
    }
    transaction.onerror = () => {
      database.close()
      reject(transaction.error ?? new Error('Could not save this portfolio photo.'))
    }
    transaction.onabort = () => {
      database.close()
      reject(transaction.error ?? new Error('Could not save this portfolio photo.'))
    }
  })
}

export async function removePortfolioMedia(id) {
  const database = await openPortfolioDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(PORTFOLIO_STORE_NAME, 'readwrite')
    transaction.objectStore(PORTFOLIO_STORE_NAME).delete(id)
    transaction.oncomplete = () => {
      database.close()
      resolve()
    }
    transaction.onerror = () => {
      database.close()
      reject(transaction.error ?? new Error('Could not remove this portfolio photo.'))
    }
    transaction.onabort = () => {
      database.close()
      reject(transaction.error ?? new Error('Could not remove this portfolio photo.'))
    }
  })
}
