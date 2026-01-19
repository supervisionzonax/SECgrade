"use client";
import { useState } from "react";
import FileUpload from "../../components/FileUpload";
import Header from "../../components/Header";

export default function Resultados() {
	const [file, setFile] = useState(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [error, setError] = useState("");

	const handleFileSelect = (selectedFile) => {
		setError("");
		setFile(selectedFile);
	};


	const exportFormattedExcel = async () => {
		if (!file) {
			setError("Por favor, seleccione un archivo primero");
			return;
		}

		setIsProcessing(true);
		setError("");

		try {
			const formData = new FormData();
			formData.append("file", file);

			const response = await fetch("/api/process-results/export", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				const errorText = await response.text();
				let errorData;
				try {
					errorData = JSON.parse(errorText);
				} catch {
					errorData = { error: errorText || "Error desconocido" };
				}
				throw new Error(
					errorData.error ||
						errorData.details ||
						`Error ${response.status}: ${response.statusText}`
				);
			}

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;

			let filename = `resultados_formateados_${new Date().getTime()}.xlsx`;
			const contentDisposition = response.headers.get("content-disposition");
			if (contentDisposition) {
				const match = contentDisposition.match(/filename="?([^"]+)"?/);
				if (match) filename = match[1];
			}

			link.download = filename;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error("Error al exportar Excel formateado:", error);
			setError(`❌ ${error.message || "Ocurrió un error al exportar el archivo"}`);
		} finally {
			setIsProcessing(false);
		}
	};


	return (
		<>
			<Header />

			<main className="main">
				<div className="container">
					<div className="page-header">
						<h1 className="title">Procesar Resultados</h1>
						<p className="subtitle">
							Sube el archivo de resultados exportado desde ZipGrade y obtén
							un reporte organizado por grupos
						</p>
					</div>

					<div className="info-alert">
						<div className="alert-icon">📊</div>
						<div>
							<h3>Formato de archivo compatible</h3>
							<p>
								Suba cualquier archivo exportado desde ZipGrade: Excel (.xlsx,
								.xls), CSV u OpenDocument (.ods).
							</p>
							<p>
								<small>
									En ZipGrade: Export → Export Responses → Elija su formato
									preferido
								</small>
							</p>
						</div>
					</div>

					{error && (
						<div className="error-alert">
							<i className="fas fa-exclamation-triangle"></i>
							<div className="error-content">
								<strong>Error:</strong> {error}
							</div>
						</div>
					)}

					<FileUpload
						onFileSelect={handleFileSelect}
						acceptedFormats=".xlsx, .xls, .csv, .ods"
						label="Arrastre su archivo de resultados aquí o haga clic para seleccionar"
					/>

					{file && (
						<div className="file-actions">
							<div className="file-info-card">
								<div className="file-info-content">
									<i className="fas fa-file-alt"></i>
									<div>
										<h4>{file.name}</h4>
										<p>
											{(file.size / 1024).toFixed(1)} KB •{" "}
											{file.type || "Archivo"}
										</p>
									</div>
								</div>
								<button
									onClick={exportFormattedExcel}
									className="primary-button"
									disabled={isProcessing}
									style={{ width: "100%" }}
								>
									{isProcessing ? (
										<>
											<div className="spinner"></div>
											<span>Generando Excel Formateado...</span>
										</>
									) : (
										<>
											<i className="fas fa-file-excel"></i>
											<span>Descargar Excel Formateado</span>
										</>
									)}
								</button>
							</div>
						</div>
					)}

				</div>
			</main>

			<style jsx>{`
				.page-header {
					margin-top: 1rem;
					margin-bottom: 1.5rem;
				}

				.page-header .subtitle {
					margin-top: 0.5rem;
					font-size: clamp(0.85rem, 2vw, 1rem);
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

				.file-actions {
					margin-bottom: 0.75rem;
				}

				.file-info-card {
					background: linear-gradient(135deg, var(--primary-lightest) 0%, white 100%);
					padding: 0.75rem;
					border-radius: var(--radius-md);
					border: 2px solid var(--primary-light);
					box-shadow: var(--shadow);
					display: flex;
					justify-content: space-between;
					align-items: center;
					flex-wrap: wrap;
					gap: 0.5rem;
				}

				.file-info-content {
					display: flex;
					align-items: center;
					gap: 0.6rem;
				}

				.file-info-content i {
					font-size: 1.5rem;
					color: var(--primary);
				}

				.file-info-content h4 {
					font-size: 0.9rem;
					font-weight: 600;
					color: var(--dark);
					margin-bottom: 0.2rem;
				}

				.file-info-content p {
					font-size: 0.75rem;
					color: var(--gray);
				}

				.stats-grid {
					margin-bottom: 0.75rem;
				}

				.grupo-resultados {
					margin-top: 0.5rem;
					flex: 1;
					display: flex;
					flex-direction: column;
					overflow: hidden;
					min-height: 0;
				}

				.grupo-header {
					margin-bottom: 0.4rem;
					flex-shrink: 0;
				}

				.grupo-header h4 {
					font-size: clamp(0.95rem, 2.5vw, 1.1rem);
					font-weight: 700;
					color: var(--dark);
					margin-bottom: 0.2rem;
				}

				.grupo-subtitle {
					color: var(--gray);
					font-size: clamp(0.75rem, 1.8vw, 0.85rem);
				}

				.summary {
					margin-top: 0.4rem;
					padding: 0.5rem;
					background: var(--light-gray);
					border-radius: var(--radius-md);
					flex-shrink: 0;
				}

				.summary-grid {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(min(90px, 100%), 1fr));
					gap: 0.4rem;
				}

				.summary-item {
					display: flex;
					flex-direction: column;
					align-items: center;
					padding: 0.5rem;
					background: white;
					border-radius: var(--radius-md);
					box-shadow: var(--shadow);
					transition: var(--transition);
				}

				.summary-item:hover {
					transform: translateY(-2px);
					box-shadow: var(--shadow-md);
				}

				.summary-label {
					font-size: 0.7rem;
					color: var(--gray);
					text-align: center;
					margin-bottom: 0.3rem;
					font-weight: 500;
					line-height: 1.2;
				}

				.summary-count {
					font-size: 1.25rem;
					font-weight: 700;
					padding: 0.3rem 0.6rem;
					border-radius: var(--radius-full);
					min-width: 35px;
					text-align: center;
				}

				@media (max-width: 768px) {
					.page-header {
						margin-top: 0.75rem;
						margin-bottom: 1rem;
					}

					.page-header .title {
						font-size: clamp(1.2rem, 3vw, 1.4rem) !important;
					}

					.page-header .subtitle {
						font-size: clamp(0.8rem, 2vw, 0.9rem) !important;
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
				}

				@media (max-width: 480px) {
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
				}

				@media (max-width: 360px) {
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

					.file-info-card {
						flex-direction: column;
						align-items: stretch;
						padding: 0.75rem;
					}

					.file-info-content {
						margin-bottom: 0.75rem;
					}

					.primary-button {
						width: 100%;
					}

					.stats-grid {
						margin-bottom: 0.5rem;
					}

					.results-container {
						padding: 0.5rem;
						margin-top: 0.4rem;
					}

					.results-header {
						margin-bottom: 0.4rem;
					}

					.tabs-container {
						margin-bottom: 0.4rem;
					}

					.summary-grid {
						grid-template-columns: repeat(2, 1fr);
						gap: 0.3rem;
					}

					.summary-item {
						padding: 0.4rem;
					}

					.summary-label {
						font-size: 0.65rem;
					}

					.summary-count {
						font-size: 1rem;
					}
				}
			`}</style>
		</>
	);
}
