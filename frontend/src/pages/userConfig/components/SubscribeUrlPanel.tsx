import { useState } from 'preact/hooks';
import { copyToClipboard } from '../utils/configUtils';

interface SubscribeUrlPanelProps {
	uid: string;
	token: string;
}

export function SubscribeUrlPanel({ uid, token }: SubscribeUrlPanelProps) {
	const [copySuccess, setCopySuccess] = useState(false);
	
	const subscribeURL = `${window.location.origin}/${uid}?token=${token}`;

	const handleCopySubscribeURL = async () => {
		const success = await copyToClipboard(subscribeURL);
		if (success) {
			setCopySuccess(true);
			setTimeout(() => setCopySuccess(false), 2000);
		}
	};

	return (
		<div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
			<div className="flex items-center space-x-2 flex-shrink-0">
				<svg
					className="h-5 w-5 text-gray-500"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
					/>
				</svg>
				<span className="text-sm font-medium text-gray-700">固定链接：</span>
			</div>
			<div className="flex-1 min-w-0 w-full sm:w-auto">
				<a
					href={subscribeURL}
					target="_blank"
					className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-colors duration-200 truncate text-center sm:text-left"
				>
					{subscribeURL}
				</a>
			</div>
			<button
				onClick={handleCopySubscribeURL}
				className={`inline-flex items-center justify-center px-4 py-2 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 w-full sm:w-auto flex-shrink-0 ${
					copySuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'
				}`}
			>
				{!copySuccess && (
					<svg
						className="h-4 w-4 mr-2 transition-opacity duration-200"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
						/>
					</svg>
				)}
				{copySuccess && (
					<svg
						className="h-4 w-4 mr-2 transition-opacity duration-200"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
					</svg>
				)}
				<span>{copySuccess ? '已复制！' : '复制链接'}</span>
			</button>
		</div>
	);
} 