import { isNative } from './platform-ui';

/**
 * Lưu file do app tạo (vd Excel) và mở bảng Chia sẻ của điện thoại — chỉ dùng trong app Android/iOS
 * (trình duyệt tự tải file bằng thẻ <a download>, WebView của app thì không).
 * Plugin nạp lazy nên bản web không phải tải thêm code.
 */
export async function saveAndShareNativeFile(fileName: string, base64Data: string, title: string): Promise<void> {
  const { Filesystem, Directory } = await import('@capacitor/filesystem');
  const { Share } = await import('@capacitor/share');
  const written = await Filesystem.writeFile({ path: fileName, data: base64Data, directory: Directory.Cache });
  await Share.share({ title, files: [written.uri], dialogTitle: title });
}

export { isNative };
