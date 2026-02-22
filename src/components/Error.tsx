import { useState } from "react";
import clsx from "clsx";

// NOTE: This used to be a full-screen blocker on mobile/tablet.
// Now it's just a small, dismissible banner so the app works everywhere.
const Error = () => {
	const [dismissed, setDismissed] = useState(false);

	return (
		<div
			className={clsx(
				"fixed left-0 right-0 z-50 px-3 lg:hidden",
				"bottom-[calc(0.75rem+env(safe-area-inset-bottom))]",
				{ hidden: dismissed },
			)}
		>
			<div className="mx-auto max-w-180 bg-primary-bg border border-border-bg rounded-2xl shadow-[0_0_60px_0_rgba(0,0,0,0.55)] p-3">
				<p className="text-white font-github text-sm leading-5">
					Mobile/tablet support is enabled. For the best experience, try
					landscape mode.
				</p>
				<div className="mt-2 flex justify-end">
					<button
						type="button"
						onClick={() => setDismissed(true)}
						className="rounded-xl bg-white/10 hover:bg-white/20 px-3 py-1 text-white font-github text-sm"
					>
						Dismiss
					</button>
				</div>
			</div>
		</div>
	);
};

export default Error;