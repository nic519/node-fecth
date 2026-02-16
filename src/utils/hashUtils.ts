
/**
 * Calculate SHA-256 hash of a string
 * Uses Web Crypto API for compatibility with Edge/Worker environments
 */
export async function hashUrl(message: string): Promise<string> {
	const msgUint8 = new TextEncoder().encode(message);
	const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
	return hashHex;
}
