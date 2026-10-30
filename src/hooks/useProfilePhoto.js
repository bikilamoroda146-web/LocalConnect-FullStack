import { useEffect, useState } from 'react'
import { getProfilePhoto, PROFILE_PHOTO_CHANGED } from '../utils/profilePhotos'

export default function useProfilePhoto(userId) {
  const [photo, setPhoto] = useState({ userId: null, url: null, error: null })

  useEffect(() => {
    let active = true
    let objectUrl = null
    let loadVersion = 0
    const loadPhoto = async () => {
      const version = ++loadVersion
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      objectUrl = null
      setPhoto({ userId, url: null, error: null })
      if (!userId) return
      try {
        const blob = await getProfilePhoto(userId)
        if (!active || version !== loadVersion) return
        objectUrl = blob ? URL.createObjectURL(blob) : null
        setPhoto({ userId, url: objectUrl, error: null })
      } catch (error) {
        if (active && version === loadVersion) setPhoto({ userId, url: null, error: error.message })
      }
    }
    const onPhotoChange = (event) => {
      if (event.detail?.userId === userId) loadPhoto()
    }
    loadPhoto()
    window.addEventListener(PROFILE_PHOTO_CHANGED, onPhotoChange)
    return () => {
      active = false
      window.removeEventListener(PROFILE_PHOTO_CHANGED, onPhotoChange)
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [userId])

  return photo.userId === userId ? photo : { userId, url: null, error: null }
}
