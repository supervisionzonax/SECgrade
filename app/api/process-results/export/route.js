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

		const colIndex = {
			FirstName: header.indexOf("FirstName"),
			LastName: header.indexOf("LastName"),
			CustomId: header.indexOf("CustomID"),
			PercentCorrect: header.indexOf("PercentCorrect"),
		};

		const missing = Object.entries(colIndex)
			.filter(([_, idx]) => idx === -1)
			.map(([k]) => k);

		if (missing.length) {
			return NextResponse.json(
				{
					success: false,
					error: `Missing required header(s): ${missing.join(", ")}`,
					availableHeaders: header,
					suggestion: "El archivo debe contener exactamente estas columnas: FirstName, LastName, CustomID, PercentCorrect",
				},
				{ status: 400 }
			);
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
			const percentCorrect = row[colIndex.PercentCorrect];

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
