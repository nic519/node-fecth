interface ValidationMessageProps {
	validationErrors: string[];
}

export function ValidationMessage({ validationErrors }: ValidationMessageProps) {
	if (validationErrors.length > 0) {
		return (
			<div className="mb-4 rounded-xl bg-red-50 p-4 border border-red-100 flex-shrink-0">
				<div className="flex">
					<div className="flex-shrink-0">
						<svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
							<path
								fillRule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
								clipRule="evenodd"
							/>
						</svg>
					</div>
					<div className="ml-3">
						<h3 className="text-sm font-bold text-red-800">配置验证失败</h3>
						<div className="mt-2 text-sm text-red-700">
							<ul className="list-disc pl-5 space-y-1">
								{validationErrors.map((error, index) => (
									<li key={index}>{error}</li>
								))}
							</ul>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return null;
}
