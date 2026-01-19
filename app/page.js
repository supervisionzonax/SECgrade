"use client";
import Header from "../components/Header";
import Link from "next/link";

export default function Home() {
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
						<Link href="/preparar-listas" className="feature-card-link">
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

						<Link href="/resultados" className="feature-card-link">
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

						<Link href="/rosa-isela" className="feature-card-link">
							<div className="feature-card">
								<div className="feature-icon">
									<i className="fas fa-tags"></i>
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
					padding: 0.5rem 0 0 0;
					margin-bottom: 0.4rem;
				}

				.hero-content .title {
					font-size: clamp(1.5rem, 5vw, 3rem) !important;
					margin-top: 1.5rem;
					margin-bottom: 1.5rem;
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
					gap: 0.4rem;
					margin-top: 0.4rem;
					align-items: stretch;
				}

				.feature-card {
					padding: 1rem;
					min-height: 240px;
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
					padding: 0.5rem 0.85rem;
					font-size: 0.85rem;
				}

				.feature-icon {
					width: 48px;
					height: 48px;
					font-size: 1.3rem;
					margin-bottom: 0.6rem;
				}

				.feature-card h3 {
					font-size: 1rem;
					margin-bottom: 0.4rem;
					text-decoration: none !important;
					text-decoration-line: none !important;
				}

				.feature-card p {
					font-size: 0.85rem;
					margin-bottom: 0.6rem;
					line-height: 1.4;
					text-decoration: none !important;
					text-decoration-line: none !important;
				}

				.feature-card button {
					text-decoration: none !important;
				}

				.info-alert {
					margin-bottom: 0.3rem;
					padding: 0.5rem;
				}

				.info-alert h3 {
					font-size: 0.8rem;
					margin-bottom: 0.2rem;
				}

				.info-alert p {
					font-size: 0.7rem;
					line-height: 1.25;
				}

				@media (max-width: 768px) {
					.hero {
						padding: 0.5rem 0 0 0;
						margin-bottom: 0.35rem;
					}

					.hero-content .title {
						font-size: 1.75rem !important;
						margin-top: 1rem;
						margin-bottom: 1rem;
					}

					.info-alert {
						margin-bottom: 0.4rem;
						padding: 0.6rem;
					}

					.info-alert h3 {
						font-size: 0.85rem;
						margin-bottom: 0.25rem;
					}

					.info-alert p {
						font-size: 0.75rem;
						line-height: 1.3;
					}

					.feature-grid {
						gap: 0.4rem;
						margin-top: 0.4rem;
						align-items: stretch;
					}

					.feature-card {
						padding: 0.9rem;
						min-height: 180px;
						height: 100%;
						align-self: stretch;
					}

					.feature-icon {
						width: 40px;
						height: 40px;
						font-size: 1rem;
						margin-bottom: 0.5rem;
					}

					.feature-card h3 {
						font-size: 0.9rem;
						margin-bottom: 0.4rem;
						line-height: 1.2;
					}

					.feature-card p {
						font-size: 0.75rem;
						margin-bottom: 0.5rem;
						line-height: 1.3;
					}

					.feature-card .primary-button {
						padding: 0.5rem 0.8rem;
						font-size: 0.8rem;
						margin-top: 0.4rem;
					}
				}

				@media (max-width: 480px) {
					.hero {
						padding: 0.25rem 0 0 0 !important;
						margin-bottom: 0.2rem !important;
					}

					.hero-content .title {
						font-size: 1.3rem !important;
						margin-top: 0.75rem !important;
						margin-bottom: 0.75rem !important;
					}

					.info-alert {
						margin-bottom: 0.25rem !important;
						padding: 0.4rem !important;
					}

					.info-alert h3 {
						font-size: 0.75rem !important;
						margin-bottom: 0.15rem !important;
					}

					.info-alert p {
						font-size: 0.65rem !important;
						line-height: 1.2 !important;
					}

					.feature-grid {
						gap: 0.3rem !important;
						margin-top: 0.25rem !important;
						align-items: stretch !important;
					}

					.feature-card {
						padding: 0.65rem !important;
						min-height: 160px !important;
						height: 100% !important;
						align-self: stretch !important;
					}

					.feature-icon {
						width: 32px !important;
						height: 32px !important;
						font-size: 0.85rem !important;
						margin-bottom: 0.3rem !important;
					}

					.feature-card h3 {
						font-size: 0.8rem !important;
						margin-bottom: 0.25rem !important;
						line-height: 1.15 !important;
					}

					.feature-card p {
						font-size: 0.65rem !important;
						margin-bottom: 0.3rem !important;
						line-height: 1.25 !important;
					}

					.feature-card .primary-button {
						padding: 0.4rem 0.65rem !important;
						font-size: 0.7rem !important;
						margin-top: 0.25rem !important;
					}

					.feature-card .primary-button i {
						font-size: 0.65rem !important;
					}

					.feature-card .primary-button span {
						font-size: 0.7rem !important;
					}
				}

				@media (max-width: 360px) {
					.hero {
						padding: 0.3rem 0 0 0;
						margin-bottom: 0.25rem;
					}

					.hero-content .title {
						font-size: 1.35rem !important;
						margin-top: 0.75rem;
						margin-bottom: 0.75rem;
					}

					.info-alert {
						margin-bottom: 0.25rem;
						padding: 0.45rem;
					}

					.info-alert h3 {
						font-size: 0.75rem;
						margin-bottom: 0.15rem;
					}

					.info-alert p {
						font-size: 0.65rem;
						line-height: 1.2;
					}

					.feature-grid {
						gap: 0.3rem;
						margin-top: 0.25rem;
						align-items: stretch;
					}

					.feature-card {
						padding: 0.65rem;
						min-height: 160px;
						height: 100%;
						align-self: stretch;
					}

					.feature-icon {
						width: 32px;
						height: 32px;
						font-size: 0.85rem;
						margin-bottom: 0.35rem;
					}

					.feature-card h3 {
						font-size: 0.8rem;
						margin-bottom: 0.25rem;
					}

					.feature-card p {
						font-size: 0.65rem;
						margin-bottom: 0.35rem;
					}

					.feature-card .primary-button {
						padding: 0.4rem 0.65rem;
						font-size: 0.7rem;
						margin-top: 0.25rem;
					}
				}
			`}</style>
		</>
	);
}
