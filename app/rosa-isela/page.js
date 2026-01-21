"use client";
import { useState } from "react";
import FileUpload from "../../components/FileUpload";
import Header from "../../components/Header";
import ProcessingLoader from "../../components/ProcessingLoader";

export default function RosaIsela() {
	const [file, setFile] = useState(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [isDetecting, setIsDetecting] = useState(false);
	const [error, setError] = useState("");
	const [successMessage, setSuccessMessage] = useState("");
	const [categorias, setCategorias] = useState([
		{ nombre: "Comprensión Lectora", inicio: 0, fin: 0 },
		{ nombre: "Retención", inicio: 0, fin: 0 },
		{ nombre: "Conocimiento General", inicio: 0, fin: 0 },
	]);

	// Asegurar que los valores numéricos estén definidos
	const categoriasConValores = categorias.map((cat) => ({
		...cat,
		inicio: cat.inicio === "" || cat.inicio === null || cat.inicio === undefined ? 1 : parseInt(cat.inicio) || 1,
		fin: cat.fin === "" || cat.fin === null || cat.fin === undefined ? 1 : parseInt(cat.fin) || 1,
	}));
	const [totalPreguntas, setTotalPreguntas] = useState(20);

	const handleFileSelect = async (selectedFile) => {
		// Prevenir múltiples llamadas simultáneas
		if (isDetecting) {
			console.log("Detección ya en curso, ignorando llamada duplicada");
			return;
		}

		setError("");
		setSuccessMessage("");
		
		// Validar formato de archivo antes de establecer el archivo
		const validExtensions = [".xlsx", ".xls", ".csv", ".ods"];
		const fileExtension = "." + selectedFile.name.toLowerCase().split(".").pop();
		
		if (!validExtensions.includes(fileExtension)) {
			setError(`Formato no compatible. Use: ${validExtensions.join(", ")}`);
			return;
		}

		setIsDetecting(true);
		setFile(selectedFile);

		// Intentar detectar el número total de preguntas del archivo
		try {
			const formData = new FormData();
			formData.append("file", selectedFile);

			console.log("Iniciando detección de preguntas...");
			const response = await fetch("/api/rosa-isela/detect", {
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
							errorMessage = errorData.error || errorData.message || errorMessage;
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
					errorMessage = "El archivo no es compatible. Por favor, suba el archivo original exportado desde ZipGrade.";
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

			// Si llegamos aquí, la respuesta es OK, leer el JSON
			const responseText = await response.text();
			if (!responseText || responseText.trim() === "") {
				throw new Error("El servidor retornó una respuesta vacía. Por favor, verifique que el archivo no esté corrupto.");
			}

			let data;
			try {
				data = JSON.parse(responseText);
			} catch (parseError) {
				console.error("Error al parsear respuesta:", parseError);
				console.error("Respuesta recibida (primeros 200 caracteres):", responseText.substring(0, 200));
				throw new Error("Error al procesar la respuesta del servidor. Por favor, intente nuevamente.");
			}

			console.log("Respuesta de detección recibida:", data);
			
			if (!data) {
				throw new Error("El servidor no devolvió datos válidos");
			}

			if (!data.success) {
				const errorMsg = data.error || "Error al detectar preguntas";
				// Si el error es sobre formato incompatible, usar el mensaje específico
				if (errorMsg.includes("no es compatible") || errorMsg.includes("zipgrade")) {
					throw new Error("Tu archivo Excel no es compatible, descargalo de zipgrade.");
				}
				throw new Error(errorMsg);
			}

			// Establecer el archivo solo después de una detección exitosa
			setFile(selectedFile);

			if (data.totalPreguntas && data.totalPreguntas > 0) {
				console.log("Total de preguntas detectadas:", data.totalPreguntas);
				const newTotal = parseInt(data.totalPreguntas, 10) || 30;
				setTotalPreguntas(newTotal);
				
				// Ajustar categorías existentes si es necesario - usando setTimeout para evitar problemas de estado
				setTimeout(() => {
					setCategorias(prevCategorias => {
						try {
							if (!prevCategorias || !Array.isArray(prevCategorias)) {
								return prevCategorias;
							}
							const updated = prevCategorias.map((cat) => {
								const inicio = parseInt(cat.inicio, 10) || 1;
								const fin = parseInt(cat.fin, 10) || inicio;
								return {
									...cat,
									inicio: Math.min(inicio, newTotal),
									fin: Math.min(fin, newTotal),
								};
							});
							return updated;
						} catch (catError) {
							console.error("Error ajustando categorías:", catError);
							return prevCategorias; // Retornar sin cambios si hay error
						}
					});
				}, 100);
			} else {
				console.warn("No se detectaron preguntas, usando valor por defecto: 30");
				setTotalPreguntas(30);
			}
		} catch (err) {
			console.error("Error detectando preguntas:", err);
			console.error("Error stack:", err.stack);
			console.error("Error name:", err.name);
			
			let errorMessage = err.message || "Error desconocido al leer el archivo";
			
			// Mensajes más específicos según el tipo de error
			if (err.message.includes("500") || err.message.includes("Internal Server Error")) {
				errorMessage = "El archivo no es compatible. Por favor, suba el archivo original exportado desde ZipGrade.";
			} else if (err.message.includes("400") || err.message.includes("Bad Request")) {
				errorMessage = "El archivo no es válido o está corrupto. Por favor, verifique el formato y vuelva a intentar.";
			} else if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
				errorMessage = "Error de conexión. Por favor, verifique su conexión a internet e intente nuevamente.";
			}
			
			setError(`❌ ${errorMessage}`);
			setFile(null);
			setTotalPreguntas(20); // Resetear a valor por defecto
		} finally {
			setIsDetecting(false);
		}
	};

	const agregarCategoria = () => {
		setCategorias([
			...categorias,
			{
				nombre: `Categoría ${categorias.length + 1}`,
				inicio: 0,
				fin: 0,
			},
		]);
		setError("");
	};

	const eliminarCategoria = (index) => {
		// Obtener el nombre de la categoría para mostrar en el mensaje
		const nombreCategoria = categorias[index]?.nombre || "esta categoría";
		
		// Confirmar antes de eliminar
		const confirmar = window.confirm(
			`¿Estás seguro de que deseas eliminar la categoría "${nombreCategoria}"?\n\nEsta acción no se puede deshacer.`
		);
		
		// Si el usuario cancela, no hacer nada
		if (!confirmar) {
			return;
		}

		if (categorias.length <= 1) {
			setError("Debe haber al menos una categoría");
			return;
		}
		
		setCategorias(categorias.filter((_, i) => i !== index));
		setError("");
	};

	const actualizarCategoria = (index, campo, valor) => {
		const nuevasCategorias = [...categorias];
		
		if (campo === "nombre") {
			// Permitir cadenas vacías para que el usuario pueda borrar completamente el texto
			nuevasCategorias[index].nombre = valor === null || valor === undefined ? `Categoría ${index + 1}` : valor;
			setCategorias(nuevasCategorias);
			setError("");
		} else if (campo === "inicio") {
			// Permitir cualquier valor mientras el usuario escribe, incluyendo cadena vacía
			// Esto permite que el usuario pueda borrar completamente el campo
			if (valor === null || valor === undefined || valor === "") {
				nuevasCategorias[index].inicio = "";
			} else {
				// Si hay un valor, guardarlo como está (permite escribir parcialmente)
				nuevasCategorias[index].inicio = valor;
			}
			setCategorias(nuevasCategorias);
			setError("");
		} else if (campo === "fin") {
			// Permitir cualquier valor mientras el usuario escribe, incluyendo cadena vacía
			// Esto permite que el usuario pueda borrar completamente el campo
			if (valor === null || valor === undefined || valor === "") {
				nuevasCategorias[index].fin = "";
			} else {
				// Si hay un valor, guardarlo como está (permite escribir parcialmente)
				nuevasCategorias[index].fin = valor;
			}
			setCategorias(nuevasCategorias);
			setError("");
		}
	};

	const validarYNormalizarCategoria = (index) => {
		const nuevasCategorias = [...categorias];
		const cat = nuevasCategorias[index];
		
		// Obtener valores como string primero para verificar si están vacíos
		const inicioStr = String(cat.inicio || "").trim();
		const finStr = String(cat.fin || "").trim();
		
		// Si el campo está vacío, establecer a 0 (solo al hacer blur)
		let inicio = inicioStr === "" ? 0 : parseInt(inicioStr, 10);
		let fin = finStr === "" ? 0 : parseInt(finStr, 10);
		
		// Si los valores no son números válidos o son negativos, establecer a 0
		if (isNaN(inicio) || inicio < 0) {
			inicio = 0;
		}
		if (isNaN(fin) || fin < 0) {
			fin = 0;
		}
		
		// Si ambos son 0, mantenerlos en 0 (el usuario puede configurarlos después)
		if (inicio === 0 && fin === 0) {
			nuevasCategorias[index].inicio = 0;
			nuevasCategorias[index].fin = 0;
			setCategorias(nuevasCategorias);
			setError("");
			return;
		}
		
		// Si solo uno es 0, ajustar al valor del otro (si es válido)
		if (inicio === 0 && fin > 0) {
			// Si el fin está configurado pero el inicio no, establecer inicio a 1 o al fin
			inicio = Math.max(1, Math.min(fin, totalPreguntas));
		}
		if (fin === 0 && inicio > 0) {
			// Si el inicio está configurado pero el fin no, establecer fin igual al inicio
			fin = Math.max(inicio, Math.min(inicio, totalPreguntas));
		}
		
		// Asegurar que estén dentro del rango válido (si no son 0)
		if (inicio > 0) {
			inicio = Math.max(1, Math.min(inicio, totalPreguntas));
		}
		if (fin > 0) {
			fin = Math.max(1, Math.min(fin, totalPreguntas));
		}
		
		// Asegurar que inicio <= fin (si ambos son mayores que 0)
		if (inicio > 0 && fin > 0 && inicio > fin) {
			fin = inicio;
		}
		
		nuevasCategorias[index].inicio = inicio;
		nuevasCategorias[index].fin = fin;
		
		setCategorias(nuevasCategorias);
		setError("");
	};

	const exportarResultados = async () => {
		setError("");

		// Validaciones
		if (!file) {
			setError("Por favor, seleccione un archivo primero");
			return;
		}

		if (categorias.length === 0) {
			setError("Por favor, configure al menos una categoría");
			return;
		}

		// Validar y normalizar categorías
		const categoriasValidadas = [];
		const rangosUsados = new Set();

		for (let i = 0; i < categorias.length; i++) {
			const cat = categorias[i];
			const nombre = (cat.nombre || `Categoría ${i + 1}`).trim();
			
			if (!nombre) {
				setError(`La categoría ${i + 1} debe tener un nombre`);
				return;
			}

			let inicio = parseInt(cat.inicio);
			let fin = parseInt(cat.fin);

			if (isNaN(inicio) || inicio < 0) {
				setError(`La categoría "${nombre}" tiene un valor de inicio inválido. Debe ser 0 o mayor.`);
				return;
			}

			if (isNaN(fin) || fin < 0) {
				setError(`La categoría "${nombre}" tiene un valor de fin inválido. Debe ser 0 o mayor.`);
				return;
			}

			// Validar que ambas estén configuradas (no pueden ser 0 ambas)
			if (inicio === 0 || fin === 0) {
				setError(`La categoría "${nombre}" debe tener valores válidos para inicio y fin (mayores a 0)`);
				return;
			}

			if (inicio > fin) {
				setError(`En la categoría "${nombre}", el inicio (${inicio}) no puede ser mayor que el fin (${fin})`);
				return;
			}

			if (inicio > totalPreguntas || fin > totalPreguntas) {
				setError(`La categoría "${nombre}" tiene preguntas fuera del rango (máximo: ${totalPreguntas})`);
				return;
			}

			// Verificar solapamiento
			for (let p = inicio; p <= fin; p++) {
				if (rangosUsados.has(p)) {
					const categoriaSolapada = categorias.find((c, idx) => {
						const cInicio = parseInt(c.inicio) || 1;
						const cFin = parseInt(c.fin) || 1;
						return idx !== i && p >= cInicio && p <= cFin;
					});
					setError(`La pregunta ${p} está incluida en múltiples categorías. Revise "${nombre}" y "${categoriaSolapada?.nombre || 'otra categoría'}"`);
					return;
				}
				rangosUsados.add(p);
			}

			categoriasValidadas.push({
				nombre,
				inicio,
				fin,
			});
		}

		setIsProcessing(true);

		try {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("categorias", JSON.stringify(categoriasValidadas));
			formData.append("totalPreguntas", totalPreguntas.toString());

			const response = await fetch("/api/rosa-isela/export", {
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

			let filename = `resultados_categorias_${new Date().getTime()}.xlsx`;
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

			// Mostrar mensaje de éxito
			setError("");
			setSuccessMessage(`✅ Archivo generado exitosamente: ${filename}`);
			
			// Limpiar mensaje de éxito después de 10 segundos
			setTimeout(() => {
				setSuccessMessage("");
			}, 10000);
		} catch (error) {
			console.error("Error al exportar resultados:", error);
			let errorMessage = error.message || "Ocurrió un error al exportar el archivo";
			// Si el error es sobre formato incompatible, usar el mensaje específico
			if (errorMessage.includes("no es compatible") || errorMessage.includes("zipgrade")) {
				errorMessage = "Tu archivo Excel no es compatible, descargalo de zipgrade.";
			}
			setError(`❌ ${errorMessage}`);
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<>
			{(isProcessing || isDetecting) && <ProcessingLoader />}
			<Header />

			<main className="main">
				<div className="container">
					<div className="page-header">
						<h1 className="title">Rosa Isela - Análisis por Categorías</h1>
						<p className="subtitle">
							Sube el archivo de resultados de ZipGrade y analiza el desempeño de
							los estudiantes por categorías de preguntas
						</p>
					</div>

					<div className="info-alert">
						<div className="alert-icon">📊</div>
						<div>
							<h3>¿Cómo funciona?</h3>
							<p>
								Esta herramienta te permite categorizar las preguntas del examen
								y obtener un análisis detallado del desempeño de cada estudiante
								por categoría (ej: Comprensión Lectora, Retención, etc.).
							</p>
							<p>
								<small>
									El archivo debe ser el export completo de ZipGrade que incluye
									las respuestas individuales a cada pregunta.
								</small>
							</p>
						</div>
					</div>

					{error && (
						<div className="error-alert">
							<i className="fas fa-exclamation-triangle"></i>
							<div className="error-content">
								<strong>Error:</strong> {error}
								{error.includes("columnas") && (
									<p style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>
										<strong>Nota:</strong> Asegúrate de exportar desde ZipGrade con la opción 
										"Export Responses" que incluye las respuestas individuales a cada pregunta.
									</p>
								)}
							</div>
						</div>
					)}

					{successMessage && (
						<div className="success-alert">
							<i className="fas fa-check-circle"></i>
							<div className="success-content">
								<strong>Éxito:</strong> {successMessage}
							</div>
						</div>
					)}

					<FileUpload
						onFileSelect={handleFileSelect}
						acceptedFormats=".xlsx, .xls, .csv, .ods"
						label="Arrastre su archivo de resultados de ZipGrade aquí o haga clic para seleccionar"
						disabled={isDetecting || isProcessing}
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
										{totalPreguntas > 0 && (
											<p className="info-text">
												<i className="fas fa-info-circle"></i>{" "}
												{totalPreguntas} preguntas detectadas
											</p>
										)}
									</div>
								</div>
							</div>

							<div className="categorias-section">
								<div className="section-header">
									<h3>
										<i className="fas fa-chart-pie"></i> Configurar Categorías
									</h3>
									<button
										type="button"
										onClick={agregarCategoria}
										className="secondary-button"
									>
										<i className="fas fa-plus"></i> Agregar Categoría
									</button>
								</div>

								<div className="form-help">
									Define las categorías y el rango de preguntas para cada una.
									Ejemplo: Comprensión Lectora (preguntas 1-5), Retención
									(preguntas 6-10), etc.
								</div>

								<div className="categorias-grid">
									{categorias.map((categoria, index) => (
										<div key={index} className="categoria-card">
											<div className="categoria-header">
												<input
													type="text"
													id={`categoria-nombre-${index}`}
													name={`categoria-nombre-${index}`}
													value={categoria.nombre}
													onChange={(e) =>
														actualizarCategoria(index, "nombre", e.target.value)
													}
													placeholder="Nombre de la categoría"
													className="form-control categoria-nombre"
												/>
												<button
													type="button"
													onClick={() => eliminarCategoria(index)}
													className="delete-button"
													title="Eliminar categoría"
												>
													<i className="fas fa-trash"></i>
												</button>
											</div>
											<div className="categoria-rango">
												<label htmlFor={`categoria-inicio-${index}`}>
													Pregunta Inicial:
													<input
														type="number"
														id={`categoria-inicio-${index}`}
														name={`categoria-inicio-${index}`}
														min="0"
														max={totalPreguntas || 999}
														value={categoria.inicio === "" || categoria.inicio === null || categoria.inicio === undefined ? "" : String(categoria.inicio)}
														onChange={(e) =>
															actualizarCategoria(
																index,
																"inicio",
																e.target.value
															)
														}
														onBlur={() => {
															// Cuando pierde el foco, validar y normalizar
															validarYNormalizarCategoria(index);
														}}
														className="form-control rango-input"
													/>
												</label>
												<span className="rango-separator">-</span>
												<label htmlFor={`categoria-fin-${index}`}>
													Pregunta Final:
													<input
														type="number"
														id={`categoria-fin-${index}`}
														name={`categoria-fin-${index}`}
														min="0"
														max={totalPreguntas || 999}
														value={categoria.fin === "" || categoria.fin === null || categoria.fin === undefined ? "" : String(categoria.fin)}
														onChange={(e) =>
															actualizarCategoria(
																index,
																"fin",
																e.target.value
															)
														}
														onBlur={() => {
															// Cuando pierde el foco, validar y normalizar
															validarYNormalizarCategoria(index);
														}}
														className="form-control rango-input"
													/>
												</label>
											</div>
											<div className="categoria-info">
												<span className="info-badge">
													{((categoria.fin || 0) - (categoria.inicio || 0) + 1) || 0} preguntas
												</span>
											</div>
										</div>
									))}
								</div>

								<div className="total-preguntas-info">
									<label htmlFor="total-preguntas-input">
										Total de preguntas en el examen:
										<input
											type="number"
											id="total-preguntas-input"
											name="total-preguntas"
											min="1"
											value={totalPreguntas || ""}
											onChange={(e) => {
												const valor = e.target.value;
												if (valor === "" || valor === null || valor === undefined) {
													setTotalPreguntas("");
												} else {
													const num = parseInt(valor);
													if (!isNaN(num) && num >= 1) {
														setTotalPreguntas(num);
														
														// Ajustar categorías si es necesario
														setCategorias(categorias.map(cat => {
															const inicio = parseInt(cat.inicio) || 1;
															const fin = parseInt(cat.fin) || inicio;
															return {
																...cat,
																inicio: Math.min(inicio, num),
																fin: Math.min(fin, num),
															};
														}));
													}
												}
											}}
											onBlur={(e) => {
												const valor = e.target.value;
												if (valor === "" || isNaN(parseInt(valor))) {
													const defaultTotal = totalPreguntas > 0 ? totalPreguntas : 30;
													setTotalPreguntas(defaultTotal);
												}
											}}
											className="form-control"
											style={{ marginLeft: "0.5rem", width: "100px" }}
											disabled={isProcessing}
										/>
									</label>
								</div>
							</div>

							<div className="export-actions">
								<button
									onClick={exportarResultados}
									className="primary-button"
									disabled={isProcessing || categorias.length === 0}
								>
									{isProcessing ? (
										<>
											<div className="spinner"></div>
											<span>Procesando y Generando Excel...</span>
										</>
									) : (
										<>
											<i className="fas fa-chart-bar"></i>
											<span>Generar Reporte por Categorías</span>
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

				.info-text {
					margin-top: 0.3rem;
					font-size: 0.75rem;
					color: var(--primary);
					display: flex;
					align-items: center;
					gap: 0.3rem;
				}

				.file-actions {
					margin-top: 1rem;
				}

				.file-info-card {
					background: linear-gradient(135deg, var(--primary-lightest) 0%, white 100%);
					padding: 0.75rem;
					border-radius: var(--radius-md);
					border: 2px solid var(--primary-light);
					box-shadow: var(--shadow);
					margin-bottom: 1rem;
				}

				.file-info-content {
					display: flex;
					align-items: flex-start;
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

				.categorias-section {
					background: white;
					padding: 1.25rem;
					border-radius: var(--radius-lg);
					border: 2px solid var(--gray-light);
					margin-bottom: 1rem;
					box-shadow: var(--shadow-sm);
				}

				.section-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 1rem;
					flex-wrap: wrap;
					gap: 0.75rem;
				}

				.section-header h3 {
					font-size: 1.1rem;
					font-weight: 700;
					color: var(--dark);
					display: flex;
					align-items: center;
					gap: 0.5rem;
				}

				.section-header h3 i {
					color: var(--primary);
				}

				.form-help {
					font-size: 0.85rem;
					color: var(--gray);
					margin-bottom: 1rem;
					padding: 0.75rem;
					background: var(--primary-lightest);
					border-radius: var(--radius-md);
					border-left: 3px solid var(--primary);
				}

				.categorias-grid {
					display: grid;
					grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr));
					gap: 1rem;
					margin-bottom: 1rem;
				}

				.categoria-card {
					background: var(--light-gray);
					padding: 1rem;
					border-radius: var(--radius-md);
					border: 2px solid var(--gray-light);
					box-shadow: var(--shadow-sm);
				}

				.categoria-header {
					display: flex;
					gap: 0.5rem;
					margin-bottom: 0.75rem;
				}

				.categoria-nombre {
					flex: 1;
				}

				.delete-button {
					background: transparent;
					color: black;
					border: none;
					padding: 0.5rem 0.75rem;
					border-radius: var(--radius-md);
					cursor: pointer;
					transition: color 0.2s ease;
					display: flex;
					align-items: center;
					justify-content: center;
				}

				.delete-button:hover {
					color: #ff6600;
					background: transparent;
				}

				.delete-button:focus {
					outline: none;
				}

				.delete-button i {
					transition: color 0.2s ease;
				}

				.categoria-rango {
					display: flex;
					align-items: center;
					gap: 0.5rem;
					margin-bottom: 0.5rem;
					flex-wrap: wrap;
				}

				.categoria-rango label {
					display: flex;
					flex-direction: column;
					gap: 0.25rem;
					font-size: 0.85rem;
					color: var(--gray);
				}

				.rango-input {
					width: 80px;
					padding: 0.4rem 0.5rem;
				}

				.rango-separator {
					font-weight: 700;
					color: var(--primary);
					font-size: 1.1rem;
				}

				.categoria-info {
					display: flex;
					justify-content: flex-start;
				}

				.info-badge {
					background: var(--primary);
					color: white;
					padding: 0.3rem 0.75rem;
					border-radius: var(--radius-full);
					font-size: 0.75rem;
					font-weight: 600;
				}

				.total-preguntas-info {
					margin-top: 1rem;
					padding-top: 1rem;
					border-top: 2px solid var(--gray-lighter);
					display: flex;
					align-items: center;
					gap: 0.5rem;
				}

				.total-preguntas-info label {
					font-size: 0.9rem;
					color: var(--dark);
					font-weight: 600;
					display: flex;
					align-items: center;
				}

				.export-actions {
					margin-top: 1rem;
				}

				.export-actions .primary-button {
					width: 100%;
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

					.categorias-grid {
						grid-template-columns: 1fr;
					}

					.section-header {
						flex-direction: column;
						align-items: stretch;
					}

					.section-header .secondary-button {
						width: 100%;
					}

					.categoria-rango {
						flex-direction: column;
						align-items: stretch;
					}

					.rango-separator {
						text-align: center;
					}

					.total-preguntas-info {
						flex-direction: column;
						align-items: stretch;
					}

					.total-preguntas-info label {
						flex-direction: column;
						align-items: stretch;
					}

					.total-preguntas-info input {
						width: 100% !important;
						margin-left: 0 !important;
						margin-top: 0.5rem;
					}
				}
			`}</style>
		</>
	);
}
