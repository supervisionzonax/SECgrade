"use client";

export default function Loading() {
	return (
		<div className="loading-overlay">
			<div className="loading-spinner">
				<div className="spinner-ring"></div>
				<div className="spinner-ring"></div>
				<div className="spinner-ring"></div>
			</div>
		</div>
	);
}
