import type { LucideIcon } from 'lucide-react';
import {
	Activity,
	Bell,
	Calendar,
	Compass,
	Crown,
	FileText,
	Fingerprint,
	Globe,
	Heart,
	Key,
	MessageCircle,
	Rocket,
	Settings,
	Shield,
	Sparkles,
	Star,
	User,
	Zap,
} from 'lucide-react';

function hashToUint32(input: string): number {
	let hash = 2166136261;
	for (let i = 0; i < input.length; i++) {
		hash ^= input.charCodeAt(i);
		hash = Math.imul(hash, 16777619);
	}
	return hash >>> 0;
}

function pickDeterministic<T>(items: readonly T[], seed: string, salt: string): T {
	if (items.length === 0) {
		throw new Error('pickDeterministic: items must not be empty');
	}
	const hash = hashToUint32(`${salt}:${seed}`);
	return items[hash % items.length]!;
}

const AVATAR_GRADIENTS = [
	'bg-gradient-to-br from-amber-500 to-orange-600',
	'bg-gradient-to-br from-rose-500 to-pink-600',
	'bg-gradient-to-br from-lime-500 to-green-600',
	'bg-gradient-to-br from-violet-500 to-purple-600',
	'bg-gradient-to-br from-red-500 to-yellow-500',
	'bg-gradient-to-br from-orange-500 to-red-600',
	'bg-gradient-to-br from-pink-500 to-rose-600',
	'bg-gradient-to-br from-green-500 to-emerald-600',
	'bg-gradient-to-br from-yellow-400 to-amber-500',
	'bg-gradient-to-br from-indigo-500 to-violet-600',
	'bg-gradient-to-br from-purple-500 to-indigo-600',
	'bg-gradient-to-br from-emerald-600 to-lime-500',
	'bg-gradient-to-br from-rose-500 to-orange-500',
	'bg-gradient-to-br from-cyan-500 to-blue-600',
	'bg-gradient-to-br from-fuchsia-500 to-pink-600',
	'bg-gradient-to-br from-red-600 to-orange-600',
	'bg-gradient-to-br from-yellow-500 to-lime-500',
	'bg-gradient-to-br from-emerald-500 to-green-500', 
	'bg-gradient-to-br from-cyan-500 to-teal-600',
	'bg-gradient-to-br from-sky-500 to-cyan-500',
	'bg-gradient-to-br from-indigo-500 to-sky-600',
	'bg-gradient-to-br from-blue-600 to-sky-500',
] as const;

const AVATAR_ICONS: readonly LucideIcon[] = [
	User,
	Shield,
	Key,
	Sparkles,
	Globe,
	Rocket,
	Crown,
	Fingerprint,
	Zap,
	Star,
	Heart,
	Bell,
	Calendar,
	Compass,
	FileText,
	Activity,
	MessageCircle,
	Settings,
] as const;

export function getUserAvatarPreset(uid: string): { gradientClass: string; Icon: LucideIcon } {
	return {
		gradientClass: pickDeterministic(AVATAR_GRADIENTS, uid, 'avatar:gradient'),
		Icon: pickDeterministic(AVATAR_ICONS, uid, 'avatar:icon'),
	};
}
