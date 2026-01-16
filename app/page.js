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
					</div>
				</div>
			</main>

			<style jsx>{`
				.hero {
					padding: 0.5rem 0 0 0;
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
					margin-top: 0.75rem;
				}

				.feature-card {
					padding: 1.25rem;
					height: 100%;
					display: flex;
					flex-direction: column;
					justify-content: space-between;
				}

				.feature-card p {
					flex: 1;
				}

				.feature-card .primary-button {
					margin-top: auto;
				}

				.feature-icon {
					width: 60px;
					height: 60px;
					font-size: 1.5rem;
					margin-bottom: 0.75rem;
				}

				.feature-card h3 {
					font-size: 1.15rem;
					margin-bottom: 0.5rem;
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
					margin-bottom: 0.75rem;
					padding: 0.75rem;
				}

				.info-alert h3 {
					font-size: 0.95rem;
					margin-bottom: 0.3rem;
				}

				.info-alert p {
					font-size: 0.85rem;
					line-height: 1.4;
				}

				@media (max-width: 768px) {
					.hero {
						padding: 0.75rem 0 0 0;
						margin-bottom: 0.75rem;
					}

					.hero-content .title {
						font-size: 1.75rem;
					}

					.info-alert {
						margin-bottom: 0.75rem;
						padding: 1rem;
					}

					.info-alert h3 {
						font-size: 0.95rem;
						margin-bottom: 0.4rem;
					}

					.info-alert p {
						font-size: 0.85rem;
						line-height: 1.4;
					}

					.feature-grid {
						gap: 1rem;
						margin-top: 0.75rem;
					}

					.feature-card {
						padding: 1.25rem;
						min-height: auto;
					}

					.feature-icon {
						width: 50px;
						height: 50px;
						font-size: 1.25rem;
						margin-bottom: 0.75rem;
					}

					.feature-card h3 {
						font-size: 1rem;
						margin-bottom: 0.5rem;
						line-height: 1.3;
					}

					.feature-card p {
						font-size: 0.875rem;
						margin-bottom: 0.75rem;
						line-height: 1.5;
					}

					.feature-card .primary-button {
						padding: 0.65rem 1rem;
						font-size: 0.875rem;
						margin-top: 0.5rem;
					}
				}

				@media (max-width: 480px) {
					.hero {
						padding: 0.75rem 0 0 0;
						margin-bottom: 0.75rem;
					}

					.hero-content .title {
						font-size: 1.5rem;
						margin-bottom: 0;
					}

					.info-alert {
						margin-bottom: 0.75rem;
						padding: 0.875rem;
					}

					.info-alert h3 {
						font-size: 0.9rem;
						margin-bottom: 0.4rem;
					}

					.info-alert p {
						font-size: 0.8rem;
						line-height: 1.4;
					}

					.feature-grid {
						gap: 0.875rem;
						margin-top: 0.75rem;
					}

					.feature-card {
						padding: 1.125rem;
						min-height: auto;
					}

					.feature-icon {
						width: 48px;
						height: 48px;
						font-size: 1.2rem;
						margin-bottom: 0.7rem;
					}

					.feature-card h3 {
						font-size: 0.95rem;
						margin-bottom: 0.5rem;
						line-height: 1.3;
					}

					.feature-card p {
						font-size: 0.85rem;
						margin-bottom: 0.7rem;
						line-height: 1.5;
					}

					.feature-card .primary-button {
						padding: 0.6rem 0.9rem;
						font-size: 0.85rem;
						margin-top: 0.5rem;
					}
				}
			`}</style>
		</>
	);
}
