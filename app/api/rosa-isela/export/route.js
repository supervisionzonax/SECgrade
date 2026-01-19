import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

function sanitizeSheetName(name, usedNames) {
	let s = String(name ?? "").trim();
	if (!s) s = "Unknown";

	s = s.replace(/[\\\/\?\*\[\]\:]/g, "_");
	s = s.slice(0, 31);

	let base = s;
	let i = 1;
	while (usedNames.has(s)) {
		const suffix = `_${i++}`;
		s = (base.slice(0, 31 - suffix.length) + suffix).slice(0, 31);
	}

	usedNames.add(s);
	return s;
}

// Función para encontrar el índice de una columna de pregunta
// ZipGrade usa: Stu1, Stu2, etc. para respuestas del estudiante
// Points1, Points2, etc. para puntos (1=correcto, 0=incorrecto)
// Mark1, Mark2, etc. para marca (C=correcto, X=incorrecto)
function encontrarColumnaPregunta(header, numPregunta) {
	// Primero intentar con formato ZipGrade estándar
	const patronesZipGrade = [
		`Stu${numPregunta}`, // Respuesta del estudiante
		`Points${numPregunta}`, // Puntos (1 o 0)
		`Mark${numPregunta}`, // Marca (C o X)
	];
	
	for (const patron of patronesZipGrade) {
		const index = header.findIndex(
			(h) => String(h || "").trim().toLowerCase() === patron.toLowerCase()
		);
		if (index !== -1) return index;
	}

	// Patrones alternativos
	const patrones = [
		`Q${numPregunta}`,
		`Q${numPregunta}_Correct`,
		`Q${numPregunta}_Answer`,
		`Pregunta${numPregunta}`,
		`Question${numPregunta}`,
		String(numPregunta),
	];

	for (const patron of patrones) {
		const index = header.findIndex(
			(h) => String(h || "").trim().toLowerCase() === patron.toLowerCase()
		);
		if (index !== -1) return index;
	}

	// Buscar por número al inicio
	const index = header.findIndex((h) => {
		const str = String(h || "").trim();
		const match = str.match(/^(\d+)/);
		return match && parseInt(match[1]) === numPregunta;
	});

	return index;
}

// Buscar columna que indique si la pregunta es correcta
// ZipGrade usa: Points1, Points2, etc. (1=correcto, 0=incorrecto)
// O Mark1, Mark2, etc. (C=correcto, X=incorrecto)
function encontrarColumnaCorrecta(header, numPregunta) {
	// Primero buscar formato ZipGrade
	const patronesZipGrade = [
		`Points${numPregunta}`,   // Points1, Points2, etc. (1 o 0)
		`Mark${numPregunta}`,     // Mark1, Mark2, etc. (C o X)
	];

	for (const patron of patronesZipGrade) {
		const index = header.findIndex(
			(h) => String(h || "").trim().toLowerCase() === patron.toLowerCase()
		);
		if (index !== -1) return index;
	}

	// Patrones genéricos
	const patronesCorrectos = [
		`Q${numPregunta}_Correct`,
		`Q${numPregunta}_Right`,
		`Q${numPregunta}_Score`,
		`Pregunta${numPregunta}_Correct`,
		`Question${numPregunta}_Correct`,
		`Q${numPregunta}C`,
		`Q${numPregunta}R`,
	];

	for (const patron of patronesCorrectos) {
		const index = header.findIndex(
			(h) => String(h || "").trim().toLowerCase() === patron.toLowerCase()
		);
		if (index !== -1) return index;
	}

	return -1;
}

// Buscar el Answer Key (respuestas correctas) en el archivo
function encontrarAnswerKey(rows, header) {
	// Buscar en las primeras filas por una fila que tenga "Answer Key" o similar
	for (let i = 0; i < Math.min(5, rows.length); i++) {
		const row = rows[i];
		if (!row || !Array.isArray(row)) continue;
		
		// Buscar si alguna celda dice "Answer Key" o "Key"
		for (let j = 0; j < row.length; j++) {
			const cellValue = String(row[j] || "").trim().toLowerCase();
			if (cellValue.includes("answer key") || cellValue === "key" || cellValue.includes("correct answer")) {
				// Esta fila probablemente tiene las respuestas correctas
				return row;
			}
		}
	}
	
	// Si no encontramos una fila explícita, buscar columnas que contengan "AnswerKey" o "Correct Answer"
	const answerKeyRow = new Array(header.length).fill(null);
	header.forEach((colName, index) => {
		const colNameLower = String(colName || "").trim().toLowerCase();
		if (colNameLower.includes("answerkey") || colNameLower.includes("correctanswer")) {
			// Buscar en las primeras filas el valor de esta columna
			for (let i = 0; i < Math.min(5, rows.length); i++) {
				if (rows[i] && rows[i][index]) {
					answerKeyRow[index] = String(rows[i][index]).trim();
					break;
				}
			}
		}
	});
	
	// Si encontramos al menos una respuesta correcta, retornar
	if (answerKeyRow.some(v => v !== null)) {
		return answerKeyRow;
	}
	
	return null;
}

// Encontrar columna con la respuesta del estudiante
// ZipGrade usa: Stu1, Stu2, etc. (respuesta del estudiante: A, B, C, etc.)
function encontrarColumnaRespuestaEstudiante(header, numPregunta) {
	// Primero buscar formato ZipGrade
	const patronesZipGrade = [
		`Stu${numPregunta}`,  // Stu1, Stu2, etc.
	];

	for (const patron of patronesZipGrade) {
		const index = header.findIndex(
			(h) => String(h || "").trim().toLowerCase() === patron.toLowerCase()
		);
		if (index !== -1) return index;
	}

	// Patrones genéricos
	const patrones = [
		`Q${numPregunta}`,
		`Q${numPregunta}_Answer`,
		`Pregunta${numPregunta}`,
		`Question${numPregunta}`,
		`Answer${numPregunta}`,
		String(numPregunta),
	];

	for (const patron of patrones) {
		const index = header.findIndex(
			(h) => String(h || "").trim().toLowerCase() === patron.toLowerCase()
		);
		if (index !== -1) return index;
	}

	// Buscar por número al inicio (pero no si es _Correct)
	const index = header.findIndex((h) => {
		const str = String(h || "").trim().toLowerCase();
		if (str.includes("correct")) return false; // Evitar columnas _Correct
		const match = str.match(/^(\d+)/);
		return match && parseInt(match[1]) === numPregunta;
	});

	return index;
}

// Calcular puntuación por categoría
function calcularCategoriaPorEstudiante(row, header, categoria, answerKey) {
	let correctas = 0;
	let total = 0;

	for (let pregunta = categoria.inicio; pregunta <= categoria.fin; pregunta++) {
		// Método 1: Buscar columna Points1, Points2, etc. (1=correcto, 0=incorrecto)
		// O Mark1, Mark2, etc. (C=correcto, X=incorrecto)
		let colCorrecta = encontrarColumnaCorrecta(header, pregunta);
		let esCorrecta = false;
		
		if (colCorrecta !== -1 && colCorrecta < row.length) {
			total++;
			const valor = row[colCorrecta];
			const colName = String(header[colCorrecta] || "").trim().toLowerCase();
			
			if (valor !== undefined && valor !== null && valor !== "") {
				const valorStr = String(valor).trim().toUpperCase();
				
				// Si es columna Points (1 o 0)
				if (colName.startsWith("points")) {
					if (valorStr === "1" || parseFloat(valorStr) === 1) {
						esCorrecta = true;
						correctas++;
					}
				}
				// Si es columna Mark (C o X)
				else if (colName.startsWith("mark")) {
					if (valorStr === "C" || valorStr === "✓" || valorStr === "V" || valorStr === "CORRECT") {
						esCorrecta = true;
						correctas++;
					}
				}
				// Verificaciones genéricas
				else if (
					valorStr === "1" ||
					valorStr === "CORRECT" ||
					valorStr === "RIGHT" ||
					valorStr === "SI" ||
					valorStr === "YES" ||
					valorStr === "TRUE" ||
					valorStr === "✓" ||
					valorStr === "V" ||
					(parseFloat(valorStr) > 0 && !isNaN(parseFloat(valorStr)))
				) {
					esCorrecta = true;
					correctas++;
				}
			}
		} else {
			// Método 2: Comparar respuesta del estudiante (Stu1, Stu2, etc.) con respuesta correcta (PriKey1, PriKey2, etc.)
			const colRespuesta = encontrarColumnaRespuestaEstudiante(header, pregunta);
			
			if (colRespuesta !== -1 && colRespuesta < row.length) {
				total++;
				const respuestaEstudiante = String(row[colRespuesta] || "").trim().toUpperCase();
				
				// Buscar columna PriKey (respuesta correcta en ZipGrade)
				const colCorrectaKey = header.findIndex((h) => {
					const hLower = String(h || "").trim().toLowerCase();
					return hLower === `prikey${pregunta}`; // PriKey1, PriKey2, etc.
				});
				
				if (colCorrectaKey !== -1 && colCorrectaKey < row.length && row[colCorrectaKey]) {
					const respuestaCorrecta = String(row[colCorrectaKey]).trim().toUpperCase();
					if (respuestaEstudiante === respuestaCorrecta && respuestaEstudiante !== "" && respuestaCorrecta !== "") {
						esCorrecta = true;
						correctas++;
					}
				} 
				// Si no hay PriKey, buscar en Answer Key
				else if (answerKey && Array.isArray(answerKey) && answerKey[colRespuesta]) {
					const respuestaCorrecta = String(answerKey[colRespuesta]).trim().toUpperCase();
					if (respuestaEstudiante === respuestaCorrecta && respuestaEstudiante !== "" && respuestaCorrecta !== "") {
						esCorrecta = true;
						correctas++;
					}
				} else {
					// Buscar otros formatos de respuesta correcta
					const colCorrectaKeyAlt = header.findIndex((h) => {
						const hLower = String(h || "").trim().toLowerCase();
						return (
							hLower === `q${pregunta}_key` ||
							hLower === `q${pregunta}_correctanswer` ||
							hLower === `answer${pregunta}` ||
							(hLower.includes(`answer key`) && hLower.includes(String(pregunta)))
						);
					});
					
					if (colCorrectaKeyAlt !== -1 && colCorrectaKeyAlt < row.length && row[colCorrectaKeyAlt]) {
						const respuestaCorrecta = String(row[colCorrectaKeyAlt]).trim().toUpperCase();
						if (respuestaEstudiante === respuestaCorrecta && respuestaEstudiante !== "" && respuestaCorrecta !== "") {
							esCorrecta = true;
							correctas++;
						}
					}
				}
			}
		}
	}

	const porcentaje = total > 0 ? Math.round((correctas / total) * 100 * 100) / 100 : 0;
	
	return {
		correctas,
		total,
		porcentaje,
	};
}

export async function POST(request) {
	try {
		const formData = await request.formData();
		const file = formData.get("file");
		const categoriasJson = formData.get("categorias");
		const totalPreguntas = parseInt(formData.get("totalPreguntas") || "20");

		if (!file) {
			return NextResponse.json(
				{
					success: false,
					error: "No se proporcionó archivo",
				},
				{ status: 400 }
			);
		}

		if (!categoriasJson) {
			return NextResponse.json(
				{
					success: false,
					error: "No se proporcionaron categorías",
				},
				{ status: 400 }
			);
		}

		let categorias;
		try {
			categorias = JSON.parse(categoriasJson);
		} catch {
			return NextResponse.json(
				{
					success: false,
					error: "Formato de categorías inválido",
				},
				{ status: 400 }
			);
		}

		if (!Array.isArray(categorias) || categorias.length === 0) {
			return NextResponse.json(
				{
					success: false,
					error: "Debe proporcionar al menos una categoría",
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

		const buffer = await file.arrayBuffer();
		let workbook;

		try {
			if (fileExtension === ".csv") {
				const data = new TextDecoder("utf-8").decode(buffer);
				workbook = XLSX.read(data, {
					type: "string",
					codepage: 65001,
					raw: false,
					cellDates: true,
				});
			} else {
				workbook = XLSX.read(buffer, {
					type: "buffer",
					cellDates: true,
					cellStyles: false,
				});
			}
		} catch (readError) {
			return NextResponse.json(
				{
					success: false,
					error: "No se pudo leer el archivo. Verifique que no esté corrupto.",
					details: readError.message,
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

		const rows = XLSX.utils.sheet_to_json(worksheet, {
			header: 1,
			defval: "",
			blankrows: false,
			raw: false,
		});

		if (rows.length < 2) {
			return NextResponse.json(
				{
					success: false,
					error: "El archivo no contiene datos suficientes",
				},
				{ status: 400 }
			);
		}

		const header = rows[0].map((h) => String(h || "").trim());

		const colIndex = {
			FirstName: header.findIndex((h) => h.toLowerCase().includes("firstname") || h.toLowerCase().includes("nombre")),
			LastName: header.findIndex((h) => h.toLowerCase().includes("lastname") || h.toLowerCase().includes("apellido")),
			CustomId: header.findIndex((h) => h.toLowerCase().includes("customid") || h.toLowerCase().includes("custom_id")),
		};

		// Validar columnas requeridas
		if (colIndex.FirstName === -1 || colIndex.LastName === -1 || colIndex.CustomId === -1) {
			return NextResponse.json(
				{
					success: false,
					error: "El archivo debe contener columnas: FirstName, LastName, CustomID",
					availableHeaders: header.slice(0, 20), // Mostrar primeras 20 columnas
				},
				{ status: 400 }
			);
		}

		// Buscar el Answer Key (respuestas correctas) en el archivo
		const answerKey = encontrarAnswerKey(rows, header);
		
		// Determinar dónde empiezan los datos de estudiantes (saltar Answer Key si existe)
		let startRow = 1;
		if (answerKey) {
			// Buscar en qué fila está el Answer Key para saltarla
			for (let i = 0; i < Math.min(5, rows.length); i++) {
				const row = rows[i];
				if (!row || !Array.isArray(row)) continue;
				for (let j = 0; j < row.length; j++) {
					const cellValue = String(row[j] || "").trim().toLowerCase();
					if (cellValue.includes("answer key") || cellValue === "key" || cellValue.includes("correct answer")) {
						startRow = Math.max(startRow, i + 1);
						break;
					}
				}
			}
		}

		// Procesar estudiantes y calcular categorías
		const grupos = new Map();

		for (let r = startRow; r < rows.length; r++) {
			const row = rows[r];

			if (!row || !Array.isArray(row) || row.length === 0) continue;

			// Asegurar que el row tenga suficientes columnas
			if (colIndex.FirstName >= row.length || colIndex.LastName >= row.length || colIndex.CustomId >= row.length) {
				continue;
			}

			const customId = String(row[colIndex.CustomId] || "").trim();
			if (!customId || customId === "" || customId.toLowerCase() === "customid") {
				continue;
			}

			// Saltar si esta fila parece ser el Answer Key o un encabezado duplicado
			const customIdLower = customId.toLowerCase();
			if (customIdLower.includes("answer") || 
				customIdLower.includes("key") || 
				customIdLower === "header" ||
				customIdLower.includes("total") ||
				customIdLower.includes("summary")) {
				continue;
			}

			const firstName = String(row[colIndex.FirstName] || "").trim();
			const lastName = String(row[colIndex.LastName] || "").trim();

			// Saltar si no hay nombre válido
			if ((!firstName || firstName === "") && (!lastName || lastName === "")) {
				continue;
			}

			// Calcular resultados por categoría
			const resultadosCategorias = {};
			
			for (const categoria of categorias) {
				if (!categoria.nombre || !categoria.inicio || !categoria.fin) {
					continue;
				}
				const resultado = calcularCategoriaPorEstudiante(
					row,
					header,
					categoria,
					answerKey
				);
				resultadosCategorias[categoria.nombre] = resultado;
			}

			if (!grupos.has(customId)) {
				grupos.set(customId, []);
			}

			grupos.get(customId).push({
				FirstName: firstName || "Sin nombre",
				LastName: lastName || "",
				...resultadosCategorias,
			});
		}

		if (grupos.size === 0) {
			return NextResponse.json(
				{
					success: false,
					error: "No se encontraron estudiantes con datos válidos",
				},
				{ status: 400 }
			);
		}

		// Crear Excel con resultados
		const outWorkbook = XLSX.utils.book_new();
		const usedSheetNames = new Set();

		// Ordenar grupos (matutinos primero, luego vespertinos)
		const sortedGroups = Array.from(grupos.entries()).sort((a, b) => {
			const groupA = String(a[0] || "").trim().toUpperCase();
			const groupB = String(b[0] || "").trim().toUpperCase();

			const isMatutinoA = groupA.includes("M") && !groupA.includes("V");
			const isMatutinoB = groupB.includes("M") && !groupB.includes("V");
			const isVespertinoA = groupA.includes("V");
			const isVespertinoB = groupB.includes("V");

			if (isMatutinoA && !isMatutinoB) return -1;
			if (!isMatutinoA && isMatutinoB) return 1;
			if (isVespertinoA && !isVespertinoB) return 1;
			if (!isVespertinoA && isVespertinoB) return -1;

			return groupA.localeCompare(groupB);
		});

		// Crear encabezados dinámicos basados en categorías
		const headers = ["FirstName", "LastName"];
		for (const categoria of categorias) {
			if (categoria.nombre && categoria.inicio && categoria.fin) {
				headers.push(`${categoria.nombre} (${categoria.inicio}-${categoria.fin})`);
				headers.push(`${categoria.nombre} %`);
			}
		}

		if (headers.length <= 2) {
			return NextResponse.json(
				{
					success: false,
					error: "No se pudo generar el reporte. Verifique que las categorías estén correctamente configuradas.",
				},
				{ status: 400 }
			);
		}

		for (const [customId, estudiantes] of sortedGroups) {
			const sanitizedName = sanitizeSheetName(customId, usedSheetNames);

			// Preparar datos para la hoja
			const datos = estudiantes.map((estudiante) => {
				const fila = {
					FirstName: estudiante.FirstName,
					LastName: estudiante.LastName,
				};

			for (const categoria of categorias) {
				if (categoria.nombre && categoria.inicio && categoria.fin) {
					const resultado = estudiante[categoria.nombre];
					if (resultado && resultado.total > 0) {
						fila[`${categoria.nombre} (${categoria.inicio}-${categoria.fin})`] = 
							`${resultado.correctas}/${resultado.total}`;
						fila[`${categoria.nombre} %`] = resultado.porcentaje;
					} else {
						fila[`${categoria.nombre} (${categoria.inicio}-${categoria.fin})`] = "0/0";
						fila[`${categoria.nombre} %`] = 0;
					}
				}
			}

				return fila;
			});

			const outSheet = XLSX.utils.json_to_sheet(datos, {
				header: headers,
			});

			XLSX.utils.book_append_sheet(outWorkbook, outSheet, sanitizedName);
		}

		const excelBuffer = XLSX.write(outWorkbook, {
			type: "buffer",
			bookType: "xlsx",
		});

		const baseName = file.name.replace(/\.[^/.]+$/, "");
		const timestamp = new Date().getTime();
		const filename = `${baseName}_categorias_${timestamp}.xlsx`;

		return new Response(excelBuffer, {
			headers: {
				"Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				"Content-Disposition": `attachment; filename="${filename}"`,
			},
		});
	} catch (error) {
		console.error("Error en export:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Error interno del servidor al procesar el archivo",
				details: process.env.NODE_ENV === "development" ? error.message : undefined,
			},
			{ status: 500 }
		);
	}
}
