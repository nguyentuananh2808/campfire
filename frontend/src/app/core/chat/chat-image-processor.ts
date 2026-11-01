const MAX_EDGE = 1280;
const MAX_BYTES = 1024 * 1024;

export async function optimizeChatImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) throw new Error('Vui lòng chọn một tệp hình ảnh.');
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext('2d', { alpha: false })?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', 0.78),
  );
  if (!blob || blob.size > MAX_BYTES)
    throw new Error('Ảnh vẫn lớn hơn 1 MB sau khi nén. Hãy chọn ảnh khác.');
  return new File([blob], 'campfire.webp', { type: 'image/webp' });
}
