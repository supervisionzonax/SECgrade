import * as XLSX from "xlsx";

// Función helper para crear respuestas JSON
function jsonResponse(data, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			"Content-Type": "application/json",
		},
	});
}

function detectGroupsFromWorkbook(workbook) {
	if (!workbook || !workbook.SheetNames) return [];

	return workbook.SheetNames.map((sheetName) => {
		const match = sheetName.match(/(\d+[A-Za-z])/);
		return match ? match[1].toUpperCase() : sheetName.trim();
	});
}

function countTotalStudents(workbook) {
	let total = 0;

	try {
		if (!workbook || !workbook.SheetNames || !Array.isArray(workbook.SheetNames)) {
			return 0;
		}

		workbook.SheetNames.forEach((sheetName) => {
			try {
				const worksheet = workbook.Sheets[sheetName];
				if (!worksheet) return;

				const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

				if (!data || !Array.isArray(data) || data.length === 0) return;

				// Validar que la primera fila existe antes de acceder
				const firstRow = data[0];
				const hasHeaders = firstRow && Array.isArray(firstRow) && (
					(firstRow[0] && String(firstRow[0]).toLowerCase().includes("apellido")) ||
					(firstRow[1] && String(firstRow[1]).toLowerCase().includes("nombre"))
				);
				const startRow = hasHeaders ? 1 : 0;

				for (let i = startRow; i < data.length; i++) {
					const row = data[i];
					if (row && Array.isArray(row) && (row[0] || row[1])) {
						total++;
					}
				}
			} catch (sheetError) {
				console.error(`Error procesando hoja ${sheetName}:`, sheetError);
				// Continuar con la siguiente hoja
			}
		});
	} catch (error) {
		console.error("Error en countTotalStudents:", error);
	}

	return total;
}

export async function POST(request) {
	console.log("=== INICIO detect-groups API ===");
	
	try {
		let formData;
		try {
			console.log("Leyendo FormData...");
			formData = await request.formData();
			console.log("FormData leído correctamente");
		} catch (formError) {
			console.error("Error al leer FormData:", formError);
			console.error("FormError stack:", formError.stack);
			return jsonResponse(
				{
					success: false,
					error: "Error al procesar el formulario",
					details: process.env.NODE_ENV === "development" ? formError.message : undefined,
				},
				400
			);
		}

		if (!formData) {
			return jsonResponse(
				{
					success: false,
					error: "No se pudo leer el formulario",
				},
				400
			);
		}

		console.log("Obteniendo archivo del FormData...");
		const file = formData.get("file");
		console.log("Archivo obtenido:", file ? `Nombre: ${file.name}, Tamaño: ${file.size}` : "null");

		if (!file) {
			console.error("No se proporcionó archivo");
			return jsonResponse(
				{
					success: false,
					error: "No se proporcionó archivo",
				},
				400
			);
		}

		// Validar que el archivo tenga un nombre válido
		if (!file.name || typeof file.name !== 'string') {
			console.error("El archivo no tiene un nombre válido:", file.name);
			return jsonResponse(
				{
					success: false,
					error: "El archivo no tiene un nombre válido",
				},
				400
			);
		}
		
		console.log("Nombre del archivo:", file.name);

		// Validar tamaño del archivo (máximo 50MB)
		const maxSize = 50 * 1024 * 1024; // 50MB
		if (file.size > maxSize) {
			return jsonResponse(
				{
					success: false,
					error: "El archivo es demasiado grande. El tamaño máximo es 50MB",
				},
				400
			);
		}

		if (file.size === 0) {
			return jsonResponse(
				{
					success: false,
					error: "El archivo está vacío",
				},
				400
			);
		}

		const validExtensions = [".xlsx", ".xls", ".csv", ".ods"];
		const fileExtension = "." + file.name.toLowerCase().split(".").pop();

		if (!validExtensions.includes(fileExtension)) {
			return jsonResponse(
				{
					success: false,
					error: `Formato no compatible. Use: ${validExtensions.join(", ")}`,
				},
				400
			);
		}

		let buffer;
		try {
			console.log("Leyendo buffer del archivo...");
			// Leer el archivo como ArrayBuffer
			buffer = await file.arrayBuffer();
			console.log("Buffer leído. Tamaño:", buffer.byteLength, "bytes");
			
			// Validar que el buffer se haya leído correctamente
			if (!buffer) {
				throw new Error("No se pudo leer el contenido del archivo");
			}
			
			if (buffer.byteLength === 0) {
				throw new Error("El archivo está vacío");
			}
			
			// Validar tamaño mínimo (al menos algunos bytes para ser un archivo válido)
			if (buffer.byteLength < 10) {
				throw new Error("El archivo es demasiado pequeño para ser válido");
			}
		} catch (bufferError) {
			console.error("Error al leer buffer del archivo:", bufferError);
			console.error("Tipo de error:", bufferError.name);
			console.error("Mensaje:", bufferError.message);
			console.error("Stack:", bufferError.stack);
			return jsonResponse(
				{
					success: false,
					error: bufferError.message || "Error al leer el archivo. Verifique que el archivo no esté corrupto.",
					details: process.env.NODE_ENV === "development" ? bufferError.message : undefined,
				},
				400
			);
		}

		let workbook;

		try {
			console.log("Procesando archivo con extensión:", fileExtension);
			console.log("Usando biblioteca XLSX...");
			
			if (fileExtension === ".csv") {
				console.log("Procesando como CSV...");
				const data = new TextDecoder("utf-8").decode(buffer);
				workbook = XLSX.read(data, {
					type: "string",
					codepage: 65001,
					raw: false,
					cellDates: true,
					cellStyles: false,
					cellNF: false,
					cellText: false,
					dense: false,
				});
			} else {
				console.log("Procesando como Excel/ODS...");
				workbook = XLSX.read(buffer, {
					type: "buffer",
					cellDates: true,
					cellStyles: false,
					cellNF: false,
					cellText: false,
					dense: false,
				});
			}
			console.log("Archivo procesado correctamente. Hojas encontradas:", workbook.SheetNames?.length || 0);
		} catch (readError) {
			console.error("Error al leer archivo Excel:", readError);
			console.error("Error name:", readError.name);
			console.error("Error message:", readError.message);
			console.error("Stack:", readError.stack);
			return jsonResponse(
				{
					success: false,
					error: "No se pudo leer el archivo. Verifique que no esté corrupto y que sea un archivo Excel válido.",
					details: process.env.NODE_ENV === "development" ? readError.message : undefined,
					stack: process.env.NODE_ENV === "development" ? readError.stack : undefined,
				},
				400
			);
		}

		if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
			return jsonResponse(
				{
					success: false,
					error: "El archivo no contiene hojas válidas.",
				},
				400
			);
		}

		// Validar formato del archivo: debe tener columnas Apellidos y Nombres
		let formatoValido = false;
		try {
			for (const sheetName of workbook.SheetNames) {
				const worksheet = workbook.Sheets[sheetName];
				if (!worksheet) continue;

				const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
				if (!data || !Array.isArray(data) || data.length === 0) continue;

				const firstRow = data[0];
				if (!firstRow || !Array.isArray(firstRow)) continue;

				// Buscar columnas Apellidos y Nombres (pueden estar en cualquier orden)
				const hasApellidos = firstRow.some(cell => 
					cell && String(cell).toLowerCase().includes("apellido")
				);
				const hasNombres = firstRow.some(cell => 
					cell && String(cell).toLowerCase().includes("nombre")
				);

				if (hasApellidos && hasNombres) {
					formatoValido = true;
					break;
				}
			}
		} catch (validationError) {
			console.error("Error validando formato:", validationError);
		}

		if (!formatoValido) {
			return jsonResponse(
				{
					success: false,
					error: "El formato del archivo no es válido. Por favor, verifique que el archivo contenga las columnas 'Apellidos' y 'Nombres' y vuelva a intentarlo.",
				},
				400
			);
		}

		let detectedGroups;
		try {
			detectedGroups = detectGroupsFromWorkbook(workbook);
		} catch (detectError) {
			console.error("Error al detectar grupos:", detectError);
			return jsonResponse(
				{
					success: false,
					error: "Error al procesar las hojas del archivo",
					details: process.env.NODE_ENV === "development" ? detectError.message : undefined,
				},
				400
			);
		}

		if (!detectedGroups || detectedGroups.length === 0) {
			return jsonResponse(
				{
					success: false,
					error:
						"No se detectaron grupos. Asegúrese de que cada grupo esté en una hoja separada.",
				},
				400
			);
		}

		let totalStudents = 0;
		try {
			totalStudents = countTotalStudents(workbook);
		} catch (countError) {
			console.error("Error al contar estudiantes:", countError);
			// Continuar con totalStudents = 0 si hay error
		}

		console.log("=== ÉXITO detect-groups API ===");
		console.log("Grupos detectados:", detectedGroups.length);
		console.log("Total estudiantes:", totalStudents);
		
		return jsonResponse({
			success: true,
			grupos: detectedGroups,
			totalEstudiantes: totalStudents,
			totalHojas: workbook.SheetNames.length,
			gruposDetectados: detectedGroups.length,
			estudiantesDetectados: totalStudents,
		});
	} catch (error) {
		console.error("=== ERROR CRÍTICO en detect-groups ===");
		console.error("Error en detect-groups:", error);
		console.error("Error stack:", error.stack);
		console.error("Error name:", error.name);
		console.error("Error message:", error.message);
		console.error("Error toString:", error.toString());
		
		try {
			return jsonResponse(
				{
					success: false,
					error: "Error interno del servidor al procesar el archivo",
					details: process.env.NODE_ENV === "development" ? error.message : undefined,
					stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
				},
				500
			);
		} catch (responseError) {
			console.error("Error al crear respuesta de error:", responseError);
			return new Response(
				JSON.stringify({
					success: false,
					error: "Error interno del servidor",
					details: process.env.NODE_ENV === "development" ? error.message : undefined,
				}),
				{
					status: 500,
					headers: { "Content-Type": "application/json" },
				}
			);
		}
	}
}
