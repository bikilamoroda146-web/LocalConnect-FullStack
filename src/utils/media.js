export const ACCEPTED_IMAGE_TYPES = Object.freeze(['image/jpeg', 'image/png', 'image/webp'])
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
export const ACCEPTED_VIDEO_TYPES = Object.freeze(['video/mp4', 'video/webm'])
export const MAX_VIDEO_SIZE_BYTES = 50 * 1024 * 1024

export const isSupportedImageType = (file) => ACCEPTED_IMAGE_TYPES.includes(file?.type)
export const isSupportedVideoType = (file) => ACCEPTED_VIDEO_TYPES.includes(file?.type)
