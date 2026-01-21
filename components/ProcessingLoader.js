"use client";

export default function ProcessingLoader() {
	return (
		<div className="processing-loader-overlay">
			<div className="processing-loader-container">
				{/* Anillo principal con efecto de arco */}
				<div className="spinner-ring">
					<div className="spinner-arc"></div>
				</div>
				
				{/* Logo centrado */}
				<div className="processing-logo-wrapper">
					<img 
						src="/loading-sonora.png" 
						alt="Gobierno de Sonora"
						className="processing-logo"
						onError={(e) => {
							e.target.style.display = "none";
						}}
					/>
				</div>
			</div>
			<style jsx>{`
				.processing-loader-overlay {
					position: fixed;
					top: 0;
					left: 0;
					right: 0;
					bottom: 0;
					background: rgba(255, 255, 255, 0.96);
					display: flex;
					align-items: center;
					justify-content: center;
					z-index: 9999;
					backdrop-filter: blur(6px);
				}

				.processing-loader-container {
					position: relative;
					width: 220px;
					height: 220px;
					display: flex;
					align-items: center;
					justify-content: center;
				}

				.spinner-ring {
					position: absolute;
					width: 100%;
					height: 100%;
					border-radius: 50%;
					border: 4px solid rgba(230, 81, 0, 0.1);
				}

				.spinner-arc {
					position: absolute;
					width: 100%;
					height: 100%;
					border-radius: 50%;
					border: 4px solid transparent;
					border-top: 4px solid var(--primary);
					border-right: 4px solid var(--primary-light);
					animation: spinner-rotate 1.5s cubic-bezier(0.5, 0, 0.5, 1) infinite;
					box-shadow: 0 0 20px rgba(230, 81, 0, 0.3);
				}

				.processing-logo-wrapper {
					position: relative;
					width: 140px;
					height: 140px;
					display: flex;
					align-items: center;
					justify-content: center;
					z-index: 10;
				}

				.processing-logo {
					width: 120px;
					height: auto;
					object-fit: contain;
					filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1));
				}

				@keyframes spinner-rotate {
					0% {
						transform: rotate(0deg);
					}
					100% {
						transform: rotate(360deg);
					}
				}

				@media (max-width: 768px) {
					.processing-loader-container {
						width: 180px;
						height: 180px;
					}

					.processing-logo-wrapper {
						width: 120px;
						height: 120px;
					}

					.processing-logo {
						width: 100px;
					}

					.spinner-ring {
						border-width: 3px;
					}

					.spinner-arc {
						border-width: 3px;
					}
				}

				@media (max-width: 480px) {
					.processing-loader-container {
						width: 160px;
						height: 160px;
					}

					.processing-logo-wrapper {
						width: 110px;
						height: 110px;
					}

					.processing-logo {
						width: 90px;
					}

					.spinner-ring {
						border-width: 2.5px;
					}

					.spinner-arc {
						border-width: 2.5px;
					}
				}
			`}</style>
		</div>
	);
}
