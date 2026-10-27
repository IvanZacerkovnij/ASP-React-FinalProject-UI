import { MEDIA } from '../../../../shared/constants/app'

interface CompressImageOptions {
  maxSizeMB?: number
  maxWidth?: number
  quality?: number
  fileType?: string
}

export async function compressImage(file: File, options?: CompressImageOptions): Promise<File> {
  const bitmap = await createImageBitmap(file)
  try {
    const maxWidth = options?.maxWidth ?? MEDIA.IMAGE.MAX_WIDTH
    const scale = Math.min(1, maxWidth / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Не вдалося підготувати зображення.')
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const mimeType = options?.fileType ?? 'image/webp'
    const limit = (options?.maxSizeMB ?? MEDIA.IMAGE.MAX_SIZE_MB) * 1024 ** 2
    let quality = options?.quality ?? MEDIA.IMAGE.QUALITY
    let blob: Blob | null = null
    do {
      blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, mimeType, quality))
      quality -= 0.1
    } while (blob && blob.size > limit && quality >= 0.1)
    if (!blob || blob.size > limit) throw new Error('Зображення перевищує дозволений розмір.')
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + (blob.type === 'image/webp' ? '.webp' : '.jpg'), {
      type: blob.type, lastModified: file.lastModified,
    })
  } finally {
    bitmap.close()
  }
}
