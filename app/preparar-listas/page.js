"use client";
import { useState } from "react";
import FileUpload from "../../components/FileUpload";
import Header from "../../components/Header";

export default function PrepararListas() {
	const [file, setFile] = useState(null);
	const [grado, setGrado] = useState("");
	const [className, setClassName] = useState("RAF");
	const [grupos, setGrupos] = useState([]);
	const [externalRefs, setExternalRefs] = useState({});
	const [startStudentId, setStartStudentId] = useState(1);
	const [isProcessing, setIsProcessing] = useState(false);
	const [downloadReady, setDownloadReady] = useState(false);
	const [error, setError] = useState("");
	const [estadisticas, setEstadisticas] = useState(null);
	const [detectedStudents, setDetectedStudents] = useState(0);

	const handleFileSelect = async (selectedFile) => {
		setError("");
		setFile(selectedFile);
		setEstadisticas(null);
		setDetectedStudents(0);

		try {
			const validExtensions = [".xlsx", ".xls", ".csv", ".ods"];
			const fileExtension =
				"." + selectedFile.name.toLowerCase().split(".").pop();

			if (!validExtensions.includes(fileExtension)) {
				setError(`Formato no compatible. Use: ${validExtensions.join(", ")}`);
				setFile(null);
				return;
			}

			const formData = new FormData();
			formData.append("file", selectedFile);

			const response = await fetch("/api/detect-groups", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				let errorMessage = `Error ${response.status}: ${response.statusText}`;
				let errorDetails = null;
				try {
					const errorText = await response.text();
					if (errorText) {
						try {
							const errorData = JSON.parse(errorText);
							errorMessage = errorData.error || errorData.details || errorMessage;
							errorDetails = errorData.details || errorData.stack;
						} catch (parseError) {
							// Si no es JSON, usar el texto directamente
							errorMessage = errorText || errorMessage;
						}
					}
				} catch (e) {
					console.error("Error al procesar respuesta de error:", e);
				}
				
				// Mensajes más amigables según el código de estado
				if (response.status === 500) {
					errorMessage = "Error interno del servidor. Por favor, verifique que el archivo no esté corrupto y vuelva a intentar.";
				} else if (response.status === 400) {
					// El mensaje ya viene del servidor, solo asegurarse de que sea claro
					if (!errorMessage || errorMessage.includes("Error 400")) {
						errorMessage = "El archivo no es válido o está corrupto. Por favor, verifique el formato.";
					}
				}
				
				const finalError = new Error(errorMessage);
				if (errorDetails && process.env.NODE_ENV === 'development') {
					console.error("Detalles del error:", errorDetails);
				}
				throw finalError;
			}

			const responseText = await response.text();
			if (!responseText || responseText.trim() === "") {
				throw new Error("El servidor retornó una respuesta vacía. Por favor, verifique que el archivo no esté corrupto.");
			}

			let data;
			try {
				data = JSON.parse(responseText);
			} catch (parseError) {
				console.error("Error al parsear respuesta:", parseError);
				throw new Error("Error al procesar la respuesta del servidor. Por favor, intente nuevamente.");
			}

			if (!data.success) {
				throw new Error(data.error || "Error al procesar el archivo");
			}

			const detectedGroups = data.grupos || [];
			const totalStudents = data.totalEstudiantes || 0;

			if (detectedGroups.length === 0) {
				setError(
					"No se detectaron grupos. Asegúrese de que cada grupo esté en una hoja separada.",
				);
				setFile(null);
				return;
			}

			setGrupos(detectedGroups);
			setDetectedStudents(totalStudents);

			const initialRefs = {};
			detectedGroups.forEach((grupo) => {
				const grupoSimple = grupo.match(/(\d+[A-Za-z])/)?.[0] || grupo;
				initialRefs[grupo] = `Z1EST5M${grupoSimple}`;
			});
			setExternalRefs(initialRefs);

			setEstadisticas({
				totalHojas: data.totalHojas || 0,
				gruposDetectados: data.gruposDetectados || 0,
				estudiantesDetectados: totalStudents,
			});
		} catch (error) {
			console.error("Error al procesar archivo:", error);
			setError(`Error al leer el archivo: ${error.message}`);
			setFile(null);
			setGrupos([]);
			setEstadisticas(null);
		}
	};

	const handleExternalRefChange = (grupo, value) => {
		setExternalRefs((prev) => ({
			...prev,
			[grupo]: value,
		}));
	};

	const validateForm = () => {
		if (!file) {
			setError(
				"Por favor, seleccione un archivo con las listas de estudiantes",
			);
			return false;
		}

		if (!grado) {
			setError("Por favor, seleccione el grado");
			return false;
		}

		if (!className.trim()) {
			setError("Por favor, ingrese el nombre del examen");
			return false;
		}

		if (grupos.length === 0) {
			setError("No se detectaron grupos en el archivo. Verifique el formato.");
			return false;
		}

		const missingRefs = grupos.filter((grupo) => !externalRefs[grupo]?.trim());
		if (missingRefs.length > 0) {
			setError(
				`Por favor, complete el External Ref para los grupos: ${missingRefs.join(", ")}`,
			);
			return false;
		}

		return true;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setDownloadReady(false);

		if (!validateForm()) return;

		setIsProcessing(true);

		try {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("grado", grado);
			formData.append("className", className);
			formData.append("grupos", JSON.stringify(grupos));
			formData.append("externalRefs", JSON.stringify(externalRefs));
			formData.append("startStudentId", startStudentId.toString());

			const response = await fetch("/api/process-lists", {
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
						`Error ${response.status}: ${response.statusText}`,
				);
			}

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;

			let filename = `zipgrade_${grado}_${className}_${new Date().getTime()}.csv`;
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

			setDownloadReady(true);
			setTimeout(() => setDownloadReady(false), 10000);
		} catch (error) {
			console.error("Error al procesar:", error);
			setError(
				`❌ ${error.message || "Ocurrió un error al procesar el archivo"}`,
			);
		} finally {
			setIsProcessing(false);
		}
	};

	const descargarPlantilla = async () => {
		try {
			const response = await fetch("/api/download-template");
			if (!response.ok) {
				throw new Error("Error al descargar la plantilla");
			}

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = "plantilla_listas_estudiantes.xlsx";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			window.URL.revokeObjectURL(url);
		} catch (error) {
			console.error("Error al descargar plantilla:", error);
			setError(`Error al descargar la plantilla: ${error.message}`);
		}
	};

	return (
		<>
			<Header />

			<main className="main">
				<div className="container">
					<div className="page-header">
						<h1 className="title">Crear Listas para ZipGrade</h1>
						<p className="subtitle">
							Descarga la plantilla, completa los datos y genera el archivo CSV
							perfecto para importar en ZipGrade
						</p>
					</div>

					<div className="info-alert">
						<div className="alert-icon">📋</div>
						<div>
							<h3>Instrucciones</h3>
							<p>
								<strong>Formato requerido:</strong> Una hoja por grupo en Excel.
								Columna A: Apellidos, Columna B: Nombres. El nombre de cada hoja
								debe ser el nombre del grupo (ej: "1A", "1B", "2A").
							</p>
							<p>
								<small>
									Puedes incluir encabezados "Apellidos" y "Nombres" en la primera fila.
									Si no tienes una plantilla, descarga la nuestra haciendo clic en el botón
									"Descargar Plantilla" más abajo.
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

					<form onSubmit={handleSubmit} className="form">
						<FileUpload
							onFileSelect={handleFileSelect}
							acceptedFormats=".xlsx, .xls, .csv, .ods"
							label="Arrastre su archivo de listas aquí o haga clic para seleccionar"
						/>

						{file && estadisticas && (
							<div className="file-info-card">
								<div className="file-info-content">
									<i className="fas fa-file-excel"></i>
									<div>
										<h4>{file.name}</h4>
										<p>Tamaño: {(file.size / 1024).toFixed(1)} KB</p>
									</div>
								</div>
								<div className="stats-preview">
									<div className="stat-item">
										<span className="stat-label">Hojas</span>
										<span className="stat-value">
											{estadisticas.totalHojas}
										</span>
									</div>
									<div className="stat-item">
										<span className="stat-label">Grupos</span>
										<span className="stat-value">
											{estadisticas.gruposDetectados}
										</span>
									</div>
									<div className="stat-item">
										<span className="stat-label">Estudiantes</span>
										<span className="stat-value">
											{estadisticas.estudiantesDetectados}
										</span>
									</div>
								</div>
							</div>
						)}

						<div className="form-grid">
							<div className="form-group">
								<label htmlFor="grado">
									<i className="fas fa-graduation-cap"></i>
									Grado *
								</label>
								<select
									id="grado"
									value={grado}
									onChange={(e) => setGrado(e.target.value)}
									className="form-control"
									required
									disabled={isProcessing}
								>
									<option value="">Seleccione el grado</option>
									<option value="1SEC">1° Secundaria</option>
									<option value="2SEC">2° Secundaria</option>
									<option value="3SEC">3° Secundaria</option>
								</select>
								<small className="form-help">
									El formato debe coincidir con ZipGrade
								</small>
							</div>

							<div className="form-group">
								<label htmlFor="className">
									<i className="fas fa-chalkboard-teacher"></i>
									Nombre de Examen *
								</label>
								<input
									type="text"
									id="className"
									value={className}
									onChange={(e) => setClassName(e.target.value)}
									className="form-control"
									required
									placeholder="Ej: RAF-Matemáticas"
									disabled={isProcessing}
								/>
								<small className="form-help">
									Aparecerá en ZipGrade para identificar el examen
								</small>
							</div>
						</div>

						{grupos.length > 0 && (
							<div className="grupos-section">
								<div className="grupos-header">
									<h3>
										<i className="fas fa-users"></i>
										Configuración de Grupos ({grupos.length} grupos detectados)
									</h3>
									<div className="grupos-info">
										<span className="info-badge">
											<i className="fas fa-user-graduate"></i>
											{detectedStudents} estudiantes detectados
										</span>
									</div>
								</div>

								<p className="form-help">
									Cada grupo necesita un <strong>External Ref</strong> único
									para identificarlo en ZipGrade. Por defecto se genera: Z1EST5M
									+ NombreGrupo
								</p>

								<div className="form-group" style={{ marginBottom: "1rem" }}>
									<label htmlFor="start-student-id">
										<i className="fas fa-hashtag"></i>
										Student ID Inicial *
									</label>
									<input
										type="number"
										id="start-student-id"
										min="1"
										value={startStudentId}
										onChange={(e) => {
											const value = parseInt(e.target.value, 10) || 1;
											setStartStudentId(value < 1 ? 1 : value);
										}}
										className="form-control"
										required
										disabled={isProcessing}
										style={{ maxWidth: "200px" }}
									/>
									<small className="form-help" style={{ marginTop: "0.5rem", marginBottom: 0, padding: 0, background: "transparent", border: "none" }}>
										El número desde el cual comenzarán los Student ID (por defecto: 1)
									</small>
								</div>

								<div className="grupos-grid">
									{grupos.map((grupo, index) => (
										<div key={index} className="form-group grupo-item">
											<label htmlFor={`external-ref-${index}`}>
												<span className="grupo-label">Grupo {grupo}</span>
											</label>
											<div className="input-group">
												<input
													type="text"
													id={`external-ref-${index}`}
													value={externalRefs[grupo] || ""}
													onChange={(e) =>
														handleExternalRefChange(grupo, e.target.value)
													}
													className="form-control"
													required
													placeholder={`Z1EST5M${grupo}`}
													disabled={isProcessing}
												/>
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						<div className="form-actions">
							<button
								type="submit"
								className="primary-button"
								disabled={isProcessing || !file || grupos.length === 0}
							>
								{isProcessing ? (
									<>
										<div className="spinner"></div>
										<span>Procesando...</span>
									</>
								) : (
									<>
										<i className="fas fa-file-export"></i>
										<span>Generar Archivo CSV para ZipGrade</span>
									</>
								)}
							</button>

							<div className="secondary-actions">
								<button
									type="button"
									className="secondary-button"
									onClick={descargarPlantilla}
									disabled={isProcessing}
								>
									<i className="fas fa-download"></i>
									<span>Descargar Plantilla</span>
								</button>

								<button
									type="button"
									className="secondary-button"
									onClick={() => {
									setFile(null);
									setGrupos([]);
									setGrado("");
									setClassName("RAF");
									setExternalRefs({});
									setStartStudentId(1);
									setError("");
									setEstadisticas(null);
									setDetectedStudents(0);
									}}
									disabled={isProcessing}
								>
									<i className="fas fa-redo"></i>
									<span>Limpiar Formulario</span>
								</button>
							</div>
						</div>
					</form>

					{downloadReady && (
						<div className="result-section success">
							<div className="result-icon">
								<i className="fas fa-check-circle"></i>
							</div>
							<div className="result-content">
								<h3>¡Archivo Generado Exitosamente!</h3>
								<p>
									Su archivo CSV ha sido descargado automáticamente. Ya puede
									importarlo en ZipGrade.
								</p>
								<div className="result-instructions">
									<h4>Instrucciones para importar en ZipGrade:</h4>
									<ol>
										<li>Abra ZipGrade en su dispositivo</li>
										<li>
											Vaya a la sección <strong>"Students"</strong>
										</li>
										<li>
											Seleccione <strong>"Import Student List"</strong>
										</li>
										<li>Busque y seleccione el archivo descargado</li>
										<li>Confirme la importación</li>
									</ol>
								</div>
							</div>
						</div>
					)}
				</div>
			</main>

			<style jsx>{`
				.container {
					scrollbar-width: none; /* Firefox */
					-ms-overflow-style: none; /* IE y Edge */
				}

				.container::-webkit-scrollbar {
					display: none; /* Chrome, Safari y Opera */
				}

				.page-header {
					margin-bottom: 1.5rem;
					margin-top: 1rem;
				}

				.page-header .subtitle {
					margin-bottom: 0;
					margin-top: 0.5rem;
					font-size: clamp(0.85rem, 2vw, 1rem);
				}

				.file-info-card {
					background: linear-gradient(135deg, var(--primary-lightest) 0%, white 100%);
					padding: 1rem;
					border-radius: var(--radius-lg);
					margin-bottom: 1rem;
					border: 2px solid var(--primary-light);
					box-shadow: var(--shadow-md);
				}

				.file-info-content {
					display: flex;
					align-items: center;
					gap: 0.75rem;
					margin-bottom: 0.75rem;
				}

				.file-info-content i {
					font-size: 2rem;
					color: var(--primary);
				}

				.file-info-content h4 {
					font-size: 1rem;
					font-weight: 600;
					color: var(--dark);
				}

				.file-info-content p {
					font-size: 0.85rem;
					color: var(--gray);
				}

				.stats-preview {
					display: flex;
					gap: 0.5rem;
					justify-content: center;
					flex-wrap: wrap;
					margin-top: 0.5rem;
				}

				.stat-item {
					text-align: center;
					background: white;
					padding: 0.75rem 1rem;
					border-radius: var(--radius-md);
					box-shadow: var(--shadow);
					min-width: 90px;
					transition: var(--transition);
				}

				.stat-item:hover {
					transform: translateY(-2px);
					box-shadow: var(--shadow-md);
				}

				.stat-label {
					display: block;
					font-size: 0.75rem;
					color: var(--gray);
					margin-bottom: 0.3rem;
					font-weight: 600;
					text-transform: uppercase;
					letter-spacing: 0.5px;
				}

				.stat-value {
					display: block;
					font-size: 1.5rem;
					font-weight: 800;
					color: var(--primary);
				}

				.grupos-section {
					margin-top: 1rem;
					padding: 1.25rem;
					background: var(--primary-lightest);
					border-radius: var(--radius-lg);
					border: 1px solid rgba(230, 81, 0, 0.15);
					box-shadow: var(--shadow-sm);
				}

				.grupos-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 1rem;
					flex-wrap: wrap;
					gap: 0.75rem;
					padding-bottom: 0.75rem;
					border-bottom: 2px solid var(--primary-lightest);
				}

				.grupos-header h3 {
					font-size: 1.1rem;
					font-weight: 700;
					color: var(--dark);
					display: flex;
					align-items: center;
					gap: 0.5rem;
				}

				.grupos-header h3 i {
					color: var(--primary);
				}

				.grupos-info {
					display: flex;
					gap: 0.75rem;
				}

				.info-badge {
					background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
					color: white;
					padding: 0.5rem 1rem;
					border-radius: var(--radius-full);
					font-size: 0.9rem;
					display: flex;
					align-items: center;
					gap: 0.5rem;
					font-weight: 600;
					box-shadow: var(--shadow);
				}

				.form-group {
					margin-bottom: 1rem;
				}

				.form-group label {
					font-size: 0.9rem;
					margin-bottom: 0.5rem;
				}

				.form-control {
					padding: 0.65rem 0.85rem;
					font-size: 0.95rem;
				}

				.form-help {
					font-size: 0.85rem;
					margin-top: 0.5rem;
					margin-bottom: 1rem;
					line-height: 1.5;
					color: var(--gray);
					padding: 0.75rem;
					background: var(--primary-lightest);
					border-radius: var(--radius-md);
					border-left: 3px solid var(--primary);
				}

				.grupos-grid {
					display: grid;
					grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr));
					gap: 1rem;
					margin-top: 1rem;
				}

				.grupo-item {
					background: white;
					padding: 1rem;
					border-radius: var(--radius-md);
					border: 2px solid var(--gray-light);
					transition: var(--transition);
					box-shadow: var(--shadow-sm);
				}

				.grupo-item:hover {
					border-color: var(--primary);
					box-shadow: var(--shadow-md);
					transform: translateY(-2px);
				}

				.grupo-label {
					font-weight: 700;
					color: var(--primary);
					display: block;
					margin-bottom: 0.5rem;
					font-size: 0.95rem;
					display: flex;
					align-items: center;
					gap: 0.5rem;
				}

				.grupo-label::before {
					content: "👥";
					font-size: 1rem;
				}

				.grupo-item .form-control {
					padding: 0.6rem 0.75rem;
					font-size: 0.9rem;
					font-weight: 500;
					font-family: 'Courier New', monospace;
				}

				.input-group {
					position: relative;
				}

				.form-actions {
					margin-top: 1.5rem;
					padding-top: 1.5rem;
					border-top: 2px solid var(--gray-lighter);
				}

				.secondary-actions {
					display: flex;
					gap: 0.75rem;
					margin-top: 1rem;
					flex-wrap: wrap;
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

				.file-upload {
					padding: 1.5rem !important;
					margin-bottom: 1rem;
				}

				.upload-icon {
					font-size: 1.25rem !important;
					margin-bottom: 0.3rem;
				}

				.file-upload h3 {
					font-size: 0.85rem !important;
					margin-bottom: 0.2rem;
				}

				.formats-info {
					font-size: 0.7rem !important;
					margin-bottom: 0.4rem;
				}

				.select-file-button {
					padding: 0.5rem 1rem !important;
					font-size: 0.85rem !important;
				}


				.result-section.success {
					margin-top: 1rem;
					background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, white 100%);
					border: 2px solid var(--success);
					border-radius: var(--radius-md);
					padding: 1rem;
					animation: slideIn 0.3s ease;
				}

				.result-icon {
					font-size: 2rem;
					color: var(--success);
					text-align: center;
					margin-bottom: 0.75rem;
				}

				.result-content h3 {
					color: var(--success);
					margin-bottom: 0.75rem;
					font-size: 1.25rem;
				}

				.result-instructions {
					background: white;
					padding: 1rem;
					border-radius: var(--radius-md);
					margin: 1rem 0;
					border-left: 4px solid var(--primary);
				}

				.result-instructions h4 {
					margin-bottom: 0.75rem;
					color: var(--dark);
					font-size: 0.95rem;
				}

				.result-instructions ol {
					margin-left: 1.25rem;
					margin-top: 0.75rem;
				}

				.result-instructions li {
					margin-bottom: 0.4rem;
					color: var(--gray);
					font-size: 0.85rem;
				}

				@keyframes slideIn {
					from {
						opacity: 0;
						transform: translateY(20px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
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

					.grupos-section {
						padding: 1rem;
					}

					.grupos-header {
						flex-direction: column;
						align-items: flex-start;
						gap: 0.5rem;
					}

					.grupos-header h3 {
						font-size: 1rem;
					}

					.info-badge {
						font-size: 0.85rem;
						padding: 0.4rem 0.8rem;
					}

					.form-help {
						font-size: 0.8rem;
						padding: 0.6rem;
					}

					.grupos-grid {
						grid-template-columns: 1fr;
						gap: 0.75rem;
					}

					.grupo-item {
						padding: 0.75rem;
					}

					.secondary-actions {
						flex-direction: column;
					}

					.secondary-actions button {
						width: 100%;
					}

					.stats-preview {
						gap: 0.75rem;
					}

					.file-info-card {
						padding: 0.75rem;
					}
				}
			`}</style>
		</>
	);
}
