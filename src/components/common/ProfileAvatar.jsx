import Avatar from './Avatar'
import useProfilePhoto from '../../hooks/useProfilePhoto'

export default function ProfileAvatar({ userId, name, hue = 160, size = 48 }) {
  const { url } = useProfilePhoto(userId)
  return <Avatar name={name} hue={hue} size={size} src={url} />
}
