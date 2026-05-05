import { useCallback, useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
import { Alert } from 'react-native'
import {
  uploadAvatarFile,
  getAvatarUrl,
  deleteAvatarFile,
  updateUserDocument,
  isAppwriteConfigured,
} from '@services/appwriteService'
import { useUserStore, useCurrentUser } from '@store/userStore'

interface UseAvatarUploadReturn {
  isUploading: boolean
  pickAndUpload: () => Promise<void>
}

/**
 * Launches the image picker, uploads the selected image to the Appwrite
 * `avatars` bucket, and persists the new fileId on the user document.
 */
export function useAvatarUpload(): UseAvatarUploadReturn {
  const user = useCurrentUser()
  const setUser = useUserStore((s) => s.setUser)
  const [isUploading, setIsUploading] = useState(false)

  const pickAndUpload = useCallback(async () => {
    if (!user || user.isGuest) {
      Alert.alert('Sign in', 'Sign in to upload a profile picture.')
      return
    }
    if (!isAppwriteConfigured) {
      Alert.alert(
        'Not configured',
        'Profile pictures require Appwrite configuration.',
      )
      return
    }

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert(
        'Permission needed',
        'Please allow photo access to set a profile picture.',
      )
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (result.canceled || !result.assets?.[0]) return
    const asset = result.assets[0]

    setIsUploading(true)
    const previousFileId = user.avatarFileId ?? null
    try {
      const fileName = asset.fileName ?? `avatar-${Date.now()}.jpg`
      const mimeType = asset.mimeType ?? 'image/jpeg'

      // expo-image-picker doesn't always provide fileSize (Android in particular).
      // Appwrite requires a non-zero size to accept the upload, so fetch the
      // local file as a blob and read its byte length when missing.
      let size = asset.fileSize ?? 0
      if (!size) {
        try {
          const blob = await (await fetch(asset.uri)).blob()
          size = blob.size
        } catch {
          /* leave size at 0 — let Appwrite reject with its own error */
        }
      }

      const newFileId = await uploadAvatarFile({
        uri: asset.uri,
        name: fileName,
        mimeType,
        size,
      })

      await updateUserDocument(user.id, { avatarFileId: newFileId })
      setUser({ ...user, avatarFileId: newFileId })

      // Best-effort cleanup of the previous avatar — don't block the UI.
      if (previousFileId) deleteAvatarFile(previousFileId)
    } catch (err: any) {
      const detail = err?.message ?? 'Could not upload the image.'
      const code = err?.code ?? err?.response?.code
      Alert.alert(
        'Upload failed',
        code === 404
          ? 'Storage bucket not found. Check EXPO_PUBLIC_APPWRITE_BUCKET_ID.'
          : code === 401
            ? 'Permission denied. Make sure the bucket allows authenticated users to write.'
            : detail,
      )
    } finally {
      setIsUploading(false)
    }
  }, [user, setUser])

  return { isUploading, pickAndUpload }
}

/** Convenience selector returning the public URL for the current user's avatar. */
export function useAvatarUrl(): string | null {
  const user = useCurrentUser()
  if (!user?.avatarFileId) return null
  const url = getAvatarUrl(user.avatarFileId)
  return url || null
}
