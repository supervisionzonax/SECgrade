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

export async function POST(request) {
	try {
		const formData = await request.formData();
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
			} else if (fileExtension === ".ods") {
				workbook = XLSX.read(buffer, {
					type: "buffer",
					cellDates: true,
					cellStyles: false,
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
					error: "El archivo no contiene datos suficientes. Mínimo 2 filas (encabezado + datos).",
				},
				{ status: 400 }
			);
		}

		const header = rows[0].map((h) => String(h || "").trim());

		// Buscar columnas en formato de resumen (FirstName, LastName, CustomID, PercentCorrect)
		const colIndex = {
			FirstName: header.findIndex(h => h.toLowerCase() === "firstname"),
			LastName: header.findIndex(h => h.toLowerCase() === "lastname"),
			CustomId: header.findIndex(h => h.toLowerCase() === "customid" || h.toLowerCase() === "custom_id"),
			PercentCorrect: header.findIndex(h => h.toLowerCase() === "percentcorrect" || h.toLowerCase() === "percent_correct"),
		};

		// Verificar si tiene formato de respuestas individuales (StuX, PointsX, MarkX, PriKeyX)
		const patronesZipGrade = [
			/^Stu(\d+)$/i,      // Stu1, Stu2, etc.
			/^Points(\d+)$/i,   // Points1, Points2, etc.
			/^Mark(\d+)$/i,     // Mark1, Mark2, etc.
			/^PriKey(\d+)$/i,   // PriKey1, PriKey2, etc.
		];
		
		let tieneFormatoRespuestas = false;
		for (const colName of header) {
			if (!colName || typeof colName !== "string") continue;
			for (const patron of patronesZipGrade) {
				if (patron.test(colName)) {
					tieneFormatoRespuestas = true;
					break;
				}
			}
			if (tieneFormatoRespuestas) break;
		}

		// Si tiene formato de respuestas individuales pero no tiene formato de resumen,
		// necesitamos calcular el PercentCorrect a partir de las respuestas
		if (tieneFormatoRespuestas && (colIndex.FirstName === -1 || colIndex.LastName === -1 || colIndex.CustomId === -1)) {
			// Buscar columnas alternativas que puedan tener nombre y CustomID
			// Algunos archivos ZipGrade pueden tener diferentes nombres de columnas
			const firstNameAlt = header.findIndex(h => {
				const lower = h.toLowerCase();
				return lower.includes("first") || lower.includes("nombre") || lower.includes("name");
			});
			const lastNameAlt = header.findIndex(h => {
				const lower = h.toLowerCase();
				return lower.includes("last") || lower.includes("apellido") || lower.includes("surname");
			});
			const customIdAlt = header.findIndex(h => {
				const lower = h.toLowerCase();
				return lower.includes("custom") || lower.includes("id") || lower.includes("student");
			});

			if (firstNameAlt !== -1) colIndex.FirstName = firstNameAlt;
			if (lastNameAlt !== -1) colIndex.LastName = lastNameAlt;
			if (customIdAlt !== -1) colIndex.CustomId = customIdAlt;
		}

		const missing = [];
		if (colIndex.FirstName === -1) missing.push("FirstName");
		if (colIndex.LastName === -1) missing.push("LastName");
		if (colIndex.CustomId === -1) missing.push("CustomID");

		if (missing.length) {
			return NextResponse.json(
				{
					success: false,
					error: "Tu archivo Excel no es compatible, descargalo de zipgrade.",
					availableHeaders: header,
					suggestion: "El archivo debe contener las columnas: FirstName, LastName, CustomID y PercentCorrect (o formato de respuestas individuales con StuX, PointsX, etc.)",
				},
				{ status: 400 }
			);
		}

		// Si no tiene PercentCorrect pero tiene formato de respuestas individuales, calcularlo
		const necesitaCalcularPercentCorrect = colIndex.PercentCorrect === -1 && tieneFormatoRespuestas;
		
		// Si necesitamos calcular PercentCorrect, encontrar todas las columnas PointsX
		let columnasPoints = [];
		if (necesitaCalcularPercentCorrect) {
			for (let i = 0; i < header.length; i++) {
				const colName = header[i];
				if (colName && /^Points(\d+)$/i.test(colName)) {
					const match = colName.match(/^Points(\d+)$/i);
					if (match && match[1]) {
						columnasPoints.push({ index: i, pregunta: parseInt(match[1], 10) });
					}
				}
			}
		}

		const groups = new Map();

		for (let r = 1; r < rows.length; r++) {
			const row = rows[r];

			if (!row || row.length === 0) continue;

			const customId = String(row[colIndex.CustomId] || "").trim();

			if (!customId) {
				continue;
			}

			const firstName = String(row[colIndex.FirstName] || "").trim();
			const lastName = String(row[colIndex.LastName] || "").trim();
			
			let percentCorrect;
			if (necesitaCalcularPercentCorrect && columnasPoints.length > 0) {
				// Calcular PercentCorrect a partir de las columnas PointsX
				let totalPuntos = 0;
				let puntosObtenidos = 0;
				for (const colPoints of columnasPoints) {
					const puntos = parseFloat(row[colPoints.index]) || 0;
					const maxPuntos = 1; // Asumimos que cada pregunta vale 1 punto
					totalPuntos += maxPuntos;
					if (puntos > 0) {
						puntosObtenidos += puntos;
					}
				}
				percentCorrect = totalPuntos > 0 ? (puntosObtenidos / totalPuntos) * 100 : 0;
			} else {
				percentCorrect = colIndex.PercentCorrect !== -1 ? parseFloat(row[colIndex.PercentCorrect]) || 0 : 0;
			}

			const outRow = {
				FirstName: firstName,
				LastName: lastName,
				PercentCorrect: percentCorrect,
			};

			if (!groups.has(customId)) {
				groups.set(customId, []);
			}
			groups.get(customId).push(outRow);
		}

		if (groups.size === 0) {
			return NextResponse.json(
				{
					success: false,
					error: "No se encontraron estudiantes con datos válidos en el archivo. Verifique el formato.",
					fileHeaders: header,
				},
				{ status: 400 }
			);
		}

		const outWorkbook = XLSX.utils.book_new();
		const usedSheetNames = new Set();

		const sortedGroups = Array.from(groups.entries()).sort((a, b) => {
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

		for (const [customId, data] of sortedGroups) {
			const sanitizedName = sanitizeSheetName(customId, usedSheetNames);

			const outSheet = XLSX.utils.json_to_sheet(data, {
				header: ["FirstName", "LastName", "PercentCorrect"],
			});

			XLSX.utils.book_append_sheet(outWorkbook, outSheet, sanitizedName);
		}

		const excelBuffer = XLSX.write(outWorkbook, {
			type: "buffer",
			bookType: "xlsx",
		});

		const baseName = file.name.replace(/\.[^/.]+$/, "");
		const timestamp = new Date().getTime();
		const filename = `${baseName}_formatted_${timestamp}.xlsx`;

		return new Response(excelBuffer, {
			headers: {
				"Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				"Content-Disposition": `attachment; filename="${filename}"`,
			},
		});
	} catch (error) {
		return NextResponse.json(
			{
				success: false,
				error: "Error interno del servidor al procesar el archivo",
				details: process.env.NODE_ENV === "development" ? error.message : undefined,
				suggestion: "Intente convertir el archivo a formato CSV o Excel (.xlsx)",
			},
			{ status: 500 }
		);
	}
}
