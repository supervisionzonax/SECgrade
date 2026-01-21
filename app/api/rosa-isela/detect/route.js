import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function POST(request) {
	console.log("=== INICIO detect API ===");
	
	try {
		let formData;
		try {
			formData = await request.formData();
		} catch (formError) {
			console.error("Error al leer FormData:", formError);
			return NextResponse.json(
				{
					success: false,
					error: "Error al procesar el formulario",
					details: process.env.NODE_ENV === "development" ? formError.message : undefined,
				},
				{ status: 400 }
			);
		}

		if (!formData) {
			return NextResponse.json(
				{
					success: false,
					error: "No se pudo leer el formulario",
				},
				{ status: 400 }
			);
		}

		const file = formData.get("file");

		if (!file) {
			return NextResponse.json(
				{
					success: false,
					error: "No se proporcionó archivo",
				},
				{ status: 400 }
			);
		}

		if (!file.name || typeof file.name !== "string") {
			console.error("El archivo no tiene un nombre válido:", file.name);
			return NextResponse.json(
				{
					success: false,
					error: "El archivo no tiene un nombre válido",
				},
				{ status: 400 }
			);
		}

		// Validar tamaño del archivo (máximo 50MB)
		const maxSize = 50 * 1024 * 1024; // 50MB
		if (file.size > maxSize) {
			return NextResponse.json(
				{
					success: false,
					error: "El archivo es demasiado grande. El tamaño máximo es 50MB",
				},
				{ status: 400 }
			);
		}

		if (file.size === 0) {
			return NextResponse.json(
				{
					success: false,
					error: "El archivo está vacío",
				},
				{ status: 400 }
			);
		}

		const validExtensions = [".xlsx", ".xls", ".csv", ".ods"];
		const fileExtension = "." + file.name.toLowerCase().split(".").pop();

		if (!validExtensions.includes(fileExtension)) {
			return NextResponse.json(
				{
					success: false,
					error: `Formato de archivo no válido. Use: ${validExtensions.join(", ")}.`,
				},
				{ status: 400 }
			);
		}

		let buffer;
		try {
			buffer = await file.arrayBuffer();
		} catch (bufferError) {
			console.error("Error al leer buffer del archivo:", bufferError);
			return NextResponse.json(
				{
					success: false,
					error: "No se pudo leer el archivo",
					details: process.env.NODE_ENV === "development" ? bufferError.message : undefined,
				},
				{ status: 400 }
			);
		}

		if (!buffer || buffer.byteLength === 0) {
			return NextResponse.json(
				{
					success: false,
					error: "El archivo está vacío",
				},
				{ status: 400 }
			);
		}

		let workbook;
		console.log("Procesando archivo con extensión:", fileExtension);

		try {
			if (fileExtension === ".csv") {
				console.log("Procesando como CSV...");
				const data = new TextDecoder("utf-8").decode(buffer);
				workbook = XLSX.read(data, {
					type: "string",
					codepage: 65001,
					raw: false,
					cellDates: true,
					dense: false,
				});
			} else {
				console.log("Procesando como Excel/ODS...");
				workbook = XLSX.read(buffer, {
					type: "buffer",
					cellDates: true,
					cellStyles: false,
					dense: false,
				});
			}
			console.log("Archivo procesado correctamente. Hojas encontradas:", workbook.SheetNames?.length || 0);
		} catch (readError) {
			console.error("Error al leer archivo Excel:", readError);
			console.error("Error name:", readError.name);
			console.error("Error message:", readError.message);
			console.error("Stack:", readError.stack);
			return NextResponse.json(
				{
					success: false,
					error: "No se pudo leer el archivo. Verifique que no esté corrupto y que sea un archivo Excel válido.",
					details: process.env.NODE_ENV === "development" ? readError.message : undefined,
					stack: process.env.NODE_ENV === "development" ? readError.stack : undefined,
				},
				{ status: 400 }
			);
		}

		if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
			return NextResponse.json(
				{
					success: false,
					error: "El archivo no contiene hojas de cálculo",
				},
				{ status: 400 }
			);
		}

		const sheetName = workbook.SheetNames[0];
		const worksheet = workbook.Sheets[sheetName];

		if (!worksheet) {
			return NextResponse.json(
				{
					success: false,
					error: `No se pudo acceder a la hoja "${sheetName}"`,
				},
				{ status: 400 }
			);
		}

		let rows;
		try {
			console.log("Convirtiendo hoja a JSON...");
			rows = XLSX.utils.sheet_to_json(worksheet, {
				header: 1,
				defval: "",
				blankrows: false,
				raw: false,
				dense: false,
			});
			console.log("Filas obtenidas:", rows?.length || 0);
		} catch (jsonError) {
			console.error("Error al convertir hoja a JSON:", jsonError);
			console.error("Error name:", jsonError.name);
			console.error("Error message:", jsonError.message);
			console.error("Stack:", jsonError.stack);
			return NextResponse.json(
				{
					success: false,
					error: "No se pudo leer los datos de la hoja de cálculo",
					details: process.env.NODE_ENV === "development" ? jsonError.message : undefined,
					stack: process.env.NODE_ENV === "development" ? jsonError.stack : undefined,
				},
				{ status: 400 }
			);
		}

		if (!rows || !Array.isArray(rows) || rows.length < 2) {
			return NextResponse.json(
				{
					success: false,
					error: "El archivo no contiene datos suficientes (se requieren al menos 2 filas)",
				},
				{ status: 400 }
			);
		}

		const headerRow = rows[0];
		if (!headerRow || !Array.isArray(headerRow)) {
			return NextResponse.json(
				{
					success: false,
					error: "No se pudo leer la fila de encabezados del archivo",
				},
				{ status: 400 }
			);
		}

		let header;
		try {
			header = headerRow
				.map((h) => {
					try {
						if (h === null || h === undefined) return "";
						return String(h).trim();
					} catch (err) {
						console.warn("Error procesando header item:", h, err);
						return "";
					}
				})
				.filter(h => h !== null && h !== undefined && h !== "");
			
			console.log("Header procesado. Columnas:", header.length);
			console.log("Primeras 10 columnas:", header.slice(0, 10));
		} catch (headerError) {
			console.error("Error procesando header:", headerError);
			return NextResponse.json(
				{
					success: false,
					error: "Error al procesar los encabezados del archivo",
					details: process.env.NODE_ENV === "development" ? headerError.message : undefined,
				},
				{ status: 400 }
			);
		}

		if (!header || header.length === 0) {
			return NextResponse.json(
				{
					success: false,
					error: "No se encontraron columnas en el archivo",
				},
				{ status: 400 }
			);
		}

		// Validar formato ZipGrade: debe tener al menos una columna StuX, PointsX, MarkX o PriKeyX
		const patronesZipGrade = [
			/^Stu(\d+)$/i,      // Stu1, Stu2, etc.
			/^Points(\d+)$/i,   // Points1, Points2, etc.
			/^Mark(\d+)$/i,     // Mark1, Mark2, etc.
			/^PriKey(\d+)$/i,   // PriKey1, PriKey2, etc.
		];

		let tieneFormatoZipGrade = false;
		for (const colName of header) {
			try {
				if (!colName || typeof colName !== "string") continue;
				for (const patron of patronesZipGrade) {
					if (patron.test(colName)) {
						tieneFormatoZipGrade = true;
						break;
					}
				}
				if (tieneFormatoZipGrade) break;
			} catch (colError) {
				continue;
			}
		}

		if (!tieneFormatoZipGrade) {
			return NextResponse.json(
				{
					success: false,
					error: "Tu archivo Excel no es compatible, descargalo de zipgrade.",
				},
				{ status: 400 }
			);
		}

		// Buscar columnas de preguntas en formato ZipGrade
		let maxPreguntaDetectada = 0;
		let maxPreguntaConDatos = 0;

		// También patrones genéricos
		const patronesGenericos = [
			/^Q(\d+)$/i,
			/^Q(\d+)_Correct$/i,
			/^Q(\d+)_Answer$/i,
			/^Pregunta(\d+)$/i,
			/^Question(\d+)$/i,
		];

		try {
			// PRIORIDAD 1: Buscar SOLO columnas StuX (Stu1, Stu2, ... Stu40)
			// Estas son las únicas que realmente indican el número de pregunta real
			// Cada pregunta tiene 4 columnas: StuX, PointsX, MarkX, PriKeyX
			// Pero solo StuX indica la pregunta real del examen
			const patronStu = /^Stu(\d+)$/i;
			
			// Primero encontrar todas las columnas StuX y su índice en el header
			const columnasStu = [];
			for (let i = 0; i < header.length; i++) {
				const colName = header[i];
				try {
					if (!colName || typeof colName !== "string") continue;
					
					const match = colName.match(patronStu);
					if (match && match[1]) {
						const numPregunta = parseInt(match[1], 10);
						if (!isNaN(numPregunta)) {
							columnasStu.push({ numPregunta, colIndex: i });
							if (numPregunta > maxPreguntaDetectada) {
								maxPreguntaDetectada = numPregunta;
							}
						}
					}
				} catch (colError) {
					console.error("Error procesando columna Stu:", colName, colError);
					continue;
				}
			}

			console.log("Max pregunta detectada (StuX):", maxPreguntaDetectada);
			console.log("Total columnas StuX encontradas:", columnasStu.length);

			// Ahora verificar cuántas columnas realmente tienen datos
			// Iterar desde la pregunta más alta hacia abajo para encontrar la última con datos
			if (columnasStu.length > 0 && rows.length > 1) {
				// Ordenar por número de pregunta descendente
				columnasStu.sort((a, b) => b.numPregunta - a.numPregunta);
				
				// Verificar cada columna de mayor a menor hasta encontrar una con datos
				for (const colStu of columnasStu) {
					const colIndex = colStu.colIndex;
					let tieneDatos = false;
					
					// Revisar las primeras 50 filas de datos (excluyendo header) para ver si hay datos
					for (let rowIndex = 1; rowIndex < rows.length && rowIndex < 51; rowIndex++) {
						const row = rows[rowIndex];
						if (!row || !Array.isArray(row)) continue;
						
						if (colIndex < row.length) {
							const valor = row[colIndex];
							// Considerar que tiene datos si el valor no está vacío, null, undefined, o solo espacios
							if (valor !== null && valor !== undefined && valor !== "" && String(valor).trim() !== "") {
								tieneDatos = true;
								break;
							}
						}
					}
					
					if (tieneDatos) {
						maxPreguntaConDatos = colStu.numPregunta;
						console.log(`Pregunta ${colStu.numPregunta} tiene datos`);
						break; // Encontramos la última pregunta con datos
					}
				}
			}

			console.log("Max pregunta con datos reales:", maxPreguntaConDatos);

			// Contar preguntas consecutivas desde 1 hasta encontrar un gap o hasta el máximo con datos
			// Esto asegura que si hay Stu1-Stu30 pero también Stu31 (vacía), solo cuente hasta 30
			let totalPreguntasConsecutivas = 0;
			if (columnasStu.length > 0 && rows.length > 1) {
				// Ordenar por número de pregunta ascendente
				const columnasStuOrdenadas = [...columnasStu].sort((a, b) => a.numPregunta - b.numPregunta);
				
				// Verificar preguntas consecutivas desde 1
				for (let i = 0; i < columnasStuOrdenadas.length; i++) {
					const colStu = columnasStuOrdenadas[i];
					const numPreguntaEsperada = i + 1;
					
					// Si el número de pregunta no coincide con el esperado consecutivo, detener
					if (colStu.numPregunta !== numPreguntaEsperada) {
						break;
					}
					
					// Verificar si esta pregunta tiene datos
					const colIndex = colStu.colIndex;
					let tieneDatos = false;
					
					for (let rowIndex = 1; rowIndex < rows.length && rowIndex < 51; rowIndex++) {
						const row = rows[rowIndex];
						if (!row || !Array.isArray(row)) continue;
						
						if (colIndex < row.length) {
							const valor = row[colIndex];
							if (valor !== null && valor !== undefined && valor !== "" && String(valor).trim() !== "") {
								tieneDatos = true;
								break;
							}
						}
					}
					
					// Si tiene datos, incrementar contador; si no, detener
					if (tieneDatos) {
						totalPreguntasConsecutivas = numPreguntaEsperada;
					} else {
						break;
					}
				}
			}

			// Si encontramos preguntas consecutivas, usarlas; sino usar maxPreguntaConDatos
			if (totalPreguntasConsecutivas > 0) {
				maxPreguntaConDatos = totalPreguntasConsecutivas;
				console.log("Total preguntas consecutivas con datos:", totalPreguntasConsecutivas);
			}

			// Si no encontramos datos en ninguna columna StuX, buscar otros patrones como fallback
			if (maxPreguntaConDatos === 0) {
				maxPreguntaConDatos = maxPreguntaDetectada; // Usar el máximo detectado
				
				// Si tampoco encontramos StuX, buscar otros patrones ZipGrade
				if (maxPreguntaDetectada === 0) {
					for (const colName of header) {
						try {
							if (!colName || typeof colName !== "string") continue;
							
							for (const patron of patronesZipGrade) {
								const match = colName.match(patron);
								if (match && match[1]) {
									const numPregunta = parseInt(match[1], 10);
									if (!isNaN(numPregunta) && numPregunta > maxPreguntaConDatos) {
										maxPreguntaConDatos = numPregunta;
									}
									break;
								}
							}
						} catch (colError) {
							console.error("Error procesando columna ZipGrade:", colName, colError);
							continue;
						}
					}
					console.log("Max pregunta detectada (ZipGrade fallback):", maxPreguntaConDatos);
				}
			}
		} catch (patternError) {
			console.error("Error al buscar patrones:", patternError);
			console.error("Stack:", patternError.stack);
			// Continuar con maxPreguntaConDatos = 0 y usar el valor por defecto
		}

		// Usar maxPreguntaConDatos si tiene valor, sino maxPreguntaDetectada, sino 30 por defecto
		const totalPreguntas = maxPreguntaConDatos > 0 ? maxPreguntaConDatos : (maxPreguntaDetectada > 0 ? maxPreguntaDetectada : 30);

		console.log("Max pregunta detectada:", maxPreguntaDetectada);
		console.log("Max pregunta con datos:", maxPreguntaConDatos);
		console.log("Total de preguntas a retornar:", totalPreguntas);
		console.log("=== FIN detect API (éxito) ===");

		// Preparar resultado - solo datos esenciales para evitar problemas de serialización
		console.log("Preparando respuesta. totalPreguntas:", totalPreguntas);

		// Crear objeto simple y serializable
		const result = {
			success: true,
			totalPreguntas: totalPreguntas,
			maxPreguntaDetectada: maxPreguntaDetectada,
			maxPreguntaConDatos: maxPreguntaConDatos,
		};

		console.log("Resultado preparado. Objeto:", JSON.stringify(result));

		// Verificar si NextResponse.json está disponible, si no usar Response directamente
		if (typeof NextResponse?.json === 'function') {
			return NextResponse.json(result);
		} else {
			console.warn("NextResponse.json no está disponible, usando Response directamente");
			return new Response(JSON.stringify(result), {
				status: 200,
				headers: {
					"Content-Type": "application/json",
				},
			});
		}
	} catch (error) {
		console.error("=== ERROR en detect API ===");
		console.error("Error:", error);
		console.error("Error name:", error?.name);
		console.error("Error message:", error?.message);
		console.error("Stack trace:", error?.stack);
		console.error("=== FIN detect API (error) ===");
		
		// Si NextResponse.json falla, usar Response directamente
		try {
			return NextResponse.json(
				{
					success: false,
					error: error?.message || "Error interno del servidor",
					details: process.env.NODE_ENV === "development" ? error?.stack : undefined,
				},
				{ status: 500 }
			);
		} catch (nextResponseError) {
			console.error("Error usando NextResponse.json, usando Response directamente:", nextResponseError);
			return new Response(
				JSON.stringify({
					success: false,
					error: error?.message || "Error interno del servidor",
					details: process.env.NODE_ENV === "development" ? error?.stack : undefined,
				}),
				{
					status: 500,
					headers: { "Content-Type": "application/json" },
				}
			);
		}
	}
}
