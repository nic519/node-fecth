
/**
 * Format date to YYYY-MM-DD HH:mm:ss (Local Time)
 * This format is friendly for SQLite and human reading
 */
export function formatDate(date: Date = new Date()): string {
	const pad = (n: number) => n.toString().padStart(2, '0');
	
	const year = date.getFullYear();
	const month = pad(date.getMonth() + 1);
	const day = pad(date.getDate());
	const hours = pad(date.getHours());
	const minutes = pad(date.getMinutes());
	const seconds = pad(date.getSeconds());
	
	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
