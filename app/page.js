"use client";
import Header from "../components/Header";
import Link from "next/link";

export default function Home() {
	const handleLinkClick = (e) => {
		// Disparar evento personalizado para que el NavigationLoader lo detecte
		document.dispatchEvent(new CustomEvent('navigation-start', { bubbles: true, cancelable: true }));
	};

	return (
		<>
			<Header />

			<main className="main">
				<div className="container">
					{/* Hero Section */}
					<div className="hero">
						<div className="hero-content">
							<h1 className="title">ZipGrade Sonora</h1>
						</div>
					</div>

					{/* Info Alert */}
					<div className="info-alert">
						<div className="alert-icon">💡</div>
						<div>
							<h3>¿Cómo funciona?</h3>
							<p>
								Esta plataforma facilita el proceso de gestión de evaluaciones con ZipGrade.
								Puedes crear listas de estudiantes en formato compatible o procesar resultados
								de exámenes escaneados. Todo de forma sencilla y automática.
							</p>
						</div>
					</div>

					{/* Feature Cards */}
					<div className="feature-grid">
						<Link href="/preparar-listas" className="feature-card-link" onClick={handleLinkClick}>
							<div className="feature-card">
								<div className="feature-icon">
									<i className="fas fa-file-upload"></i>
								</div>
								<h3>Crear Listas para ZipGrade</h3>
								<p>
									Descarga la plantilla Excel, completa los datos de tus estudiantes
									por grupo y genera el archivo CSV perfecto para importar en ZipGrade.
								</p>
								<button className="primary-button">
									<i className="fas fa-arrow-right"></i>
									<span>Comenzar</span>
								</button>
							</div>
						</Link>

						<Link href="/resultados" className="feature-card-link" onClick={handleLinkClick}>
							<div className="feature-card">
								<div className="feature-icon">
									<i className="fas fa-chart-bar"></i>
								</div>
								<h3>Procesar Resultados</h3>
								<p>
									Sube el archivo de resultados exportado desde ZipGrade y obtén
									un reporte organizado por grupos con las calificaciones de cada estudiante.
								</p>
								<button className="primary-button">
									<i className="fas fa-arrow-right"></i>
									<span>Comenzar</span>
								</button>
							</div>
						</Link>

						<Link href="/rosa-isela" className="feature-card-link" onClick={handleLinkClick}>
							<div className="feature-card">
								<div className="feature-icon">
									<i className="fas fa-chart-pie"></i>
								</div>
								<h3>Rosa Isela - Análisis por Categorías</h3>
								<p>
									Analiza el desempeño de los estudiantes por categorías de preguntas.
									Configura categorías personalizadas y obtén reportes detallados por área de conocimiento.
								</p>
								<button className="primary-button">
									<i className="fas fa-arrow-right"></i>
									<span>Comenzar</span>
								</button>
							</div>
						</Link>
					</div>
				</div>
			</main>

			<style jsx>{`
				.hero {
					padding: 1rem 0 0 0;
					margin-bottom: 1rem;
				}

				.hero-content .title {
					font-size: clamp(1.5rem, 5vw, 3rem) !important;
					margin-top: 0.75rem;
					margin-bottom: 0.75rem;
				}

				.feature-card-link {
					text-decoration: none !important;
					color: inherit;
					display: block;
					height: 100%;
				}

				.feature-card-link,
				.feature-card-link *,
				.feature-card-link h3,
				.feature-card-link p,
				.feature-card-link span,
				.feature-card-link div {
					text-decoration: none !important;
					text-decoration-line: none !important;
					text-decoration-style: none !important;
					text-decoration-color: transparent !important;
				}

				.feature-grid {
					gap: 1rem;
					margin-top: 1.25rem;
					align-items: stretch;
				}

				.feature-card {
					padding: 1.5rem;
					min-height: 260px;
					height: 100%;
					display: flex;
					flex-direction: column;
					justify-content: space-between;
					align-self: stretch;
				}

				.feature-card p {
					flex: 1;
				}

				.feature-card .primary-button {
					margin-top: auto;
					padding: 0.65rem 1.1rem;
					font-size: 0.9rem;
				}

				.feature-icon {
					width: 52px;
					height: 52px;
					font-size: 1.4rem;
					margin-bottom: 0.75rem;
				}

				.feature-card h3 {
					font-size: 1.05rem;
					margin-bottom: 0.6rem;
					text-decoration: none !important;
					text-decoration-line: none !important;
				}

				.feature-card p {
					font-size: 0.9rem;
					margin-bottom: 0.75rem;
					line-height: 1.5;
					text-decoration: none !important;
					text-decoration-line: none !important;
				}

				.feature-card button {
					text-decoration: none !important;
				}

				.info-alert {
					margin-bottom: 1rem;
					padding: 1rem;
				}

				.info-alert h3 {
					font-size: 0.95rem;
					margin-bottom: 0.4rem;
				}

				.info-alert p {
					font-size: 0.85rem;
					line-height: 1.5;
				}

				@media (max-width: 768px) {
					.hero {
						padding: 0.5rem 0 0 0;
						margin-bottom: 0.75rem;
					}

					.hero-content .title {
						font-size: 1.5rem !important;
						margin-top: 0.5rem;
						margin-bottom: 0.5rem;
					}

					.info-alert {
						margin-bottom: 0.75rem;
						padding: 0.75rem;
					}

					.info-alert h3 {
						font-size: 0.85rem;
						margin-bottom: 0.35rem;
					}

					.info-alert p {
						font-size: 0.75rem;
						line-height: 1.35;
					}

					.feature-grid {
						gap: 0.75rem;
						margin-top: 0.75rem;
						align-items: stretch;
					}

					.feature-card {
						padding: 1rem;
						min-height: auto;
						height: 100%;
						align-self: stretch;
					}

					.feature-icon {
						width: 40px;
						height: 40px;
						font-size: 1.1rem;
						margin-bottom: 0.5rem;
					}

					.feature-card h3 {
						font-size: 0.9rem;
						margin-bottom: 0.4rem;
						line-height: 1.25;
					}

					.feature-card p {
						font-size: 0.75rem;
						margin-bottom: 0.5rem;
						line-height: 1.35;
					}

					.feature-card .primary-button {
						padding: 0.5rem 0.85rem;
						font-size: 0.8rem;
						margin-top: 0.35rem;
					}
				}

				@media (max-width: 480px) {
					.hero {
						padding: 0.4rem 0 0 0 !important;
						margin-bottom: 0.5rem !important;
					}

					.hero-content .title {
						font-size: 1.3rem !important;
						margin-top: 0.35rem !important;
						margin-bottom: 0.35rem !important;
					}

					.info-alert {
						margin-bottom: 0.5rem !important;
						padding: 0.6rem !important;
					}

					.info-alert h3 {
						font-size: 0.8rem !important;
						margin-bottom: 0.3rem !important;
					}

					.info-alert p {
						font-size: 0.7rem !important;
						line-height: 1.3 !important;
					}

					.feature-grid {
						gap: 0.5rem !important;
						margin-top: 0.5rem !important;
						align-items: stretch !important;
					}

					.feature-card {
						padding: 0.85rem !important;
						min-height: auto !important;
						height: 100% !important;
						align-self: stretch !important;
					}

					.feature-icon {
						width: 36px !important;
						height: 36px !important;
						font-size: 1rem !important;
						margin-bottom: 0.4rem !important;
					}

					.feature-card h3 {
						font-size: 0.85rem !important;
						margin-bottom: 0.35rem !important;
						line-height: 1.2 !important;
					}

					.feature-card p {
						font-size: 0.7rem !important;
						margin-bottom: 0.4rem !important;
						line-height: 1.3 !important;
					}

					.feature-card .primary-button {
						padding: 0.45rem 0.75rem !important;
						font-size: 0.75rem !important;
						margin-top: 0.3rem !important;
					}

					.feature-card .primary-button i {
						font-size: 0.7rem !important;
					}

					.feature-card .primary-button span {
						font-size: 0.75rem !important;
					}
				}

				@media (max-width: 360px) {
					.hero {
						padding: 0.35rem 0 0 0;
						margin-bottom: 0.45rem;
					}

					.hero-content .title {
						font-size: 1.2rem !important;
						margin-top: 0.3rem;
						margin-bottom: 0.3rem;
					}

					.info-alert {
						margin-bottom: 0.45rem;
						padding: 0.55rem;
					}

					.info-alert h3 {
						font-size: 0.75rem;
						margin-bottom: 0.25rem;
					}

					.info-alert p {
						font-size: 0.65rem;
						line-height: 1.3;
					}

					.feature-grid {
						gap: 0.45rem;
						margin-top: 0.45rem;
						align-items: stretch;
					}

					.feature-card {
						padding: 0.75rem;
						min-height: auto;
						height: 100%;
						align-self: stretch;
					}

					.feature-icon {
						width: 32px;
						height: 32px;
						font-size: 0.9rem;
						margin-bottom: 0.35rem;
					}

					.feature-card h3 {
						font-size: 0.8rem;
						margin-bottom: 0.3rem;
					}

					.feature-card p {
						font-size: 0.65rem;
						margin-bottom: 0.35rem;
					}

					.feature-card .primary-button {
						padding: 0.4rem 0.7rem;
						font-size: 0.7rem;
						margin-top: 0.25rem;
					}
				}
			`}</style>
		</>
	);
}
