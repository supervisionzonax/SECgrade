import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function POST(request) {
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

		// Procesar header EXACTAMENTE igual que Rosa Isela
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

		// Validar formato ZipGrade: EXACTAMENTE igual que Rosa Isela
		// Debe tener al menos una columna StuX, PointsX, MarkX o PriKeyX
		const patronesZipGrade = [
			/^Stu(\d+)$/i,      // Stu1, Stu2, etc.
			/^Points(\d+)$/i,   // Points1, Points2, etc.
			/^Mark(\d+)$/i,     // Mark1, Mark2, etc.
			/^PriKey(\d+)$/i,   // PriKey1, PriKey2, etc.
		];

		let tieneFormatoZipGrade = false;
		console.log("=== VALIDATE-ZIPGRADE DEBUG ===");
		console.log("Header length:", header.length);
		console.log("Primeras 20 columnas:", header.slice(0, 20));
		
		for (const colName of header) {
			try {
				if (!colName || typeof colName !== "string") continue;
				for (const patron of patronesZipGrade) {
					if (patron.test(colName)) {
						console.log("✓ Columna encontrada que coincide:", colName);
						tieneFormatoZipGrade = true;
						break;
					}
				}
				if (tieneFormatoZipGrade) break;
			} catch (colError) {
				continue;
			}
		}

		console.log("tieneFormatoZipGrade:", tieneFormatoZipGrade);

		if (!tieneFormatoZipGrade) {
			console.error("Archivo rechazado: No tiene formato ZipGrade");
			console.error("Total columnas:", header.length);
			console.error("Primeras 30 columnas:", header.slice(0, 30));
			return NextResponse.json(
				{
					success: false,
					error: "Tu archivo Excel no es compatible, descargalo de zipgrade.",
				},
				{ status: 400 }
			);
		}

		console.log("✓ Archivo aceptado. Formato ZipGrade válido.");
		// Archivo válido - retornar éxito
		try {
			return NextResponse.json({
				success: true,
			});
		} catch (nextResponseError) {
			console.error("Error usando NextResponse.json, usando Response directamente:", nextResponseError);
			return new Response(
				JSON.stringify({
					success: true,
				}),
				{
					status: 200,
					headers: { "Content-Type": "application/json" },
				}
			);
		}
	} catch (error) {
		console.error("=== ERROR en validate-zipgrade API ===");
		console.error("Error:", error);
		console.error("Error name:", error?.name);
		console.error("Error message:", error?.message);
		console.error("Error stack:", error?.stack);
		console.error("=== FIN validate-zipgrade API (error) ===");
		
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
