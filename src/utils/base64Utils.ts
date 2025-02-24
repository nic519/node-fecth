export class Base64Utils {
  // Base64 编码（支持 UTF-8）
  public static utf8ToBase64(str: string): string {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    const binString = Array.from(bytes).map(x => String.fromCharCode(x)).join('');
    return btoa(binString);
  }

  // base64解码
  public static base64ToUtf8(str: string): string {
    const binString = atob(str);
    const bytes = Uint8Array.from(binString, c => c.charCodeAt(0));
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  }
} 