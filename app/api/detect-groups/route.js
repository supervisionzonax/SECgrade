import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

function detectGroupsFromWorkbook(workbook) {
	if (!workbook || !workbook.SheetNames) return [];

	return workbook.SheetNames.map((sheetName) => {
		const match = sheetName.match(/(\d+[A-Za-z])/);
		return match ? match[1].toUpperCase() : sheetName.trim();
	});
}

function countTotalStudents(workbook) {
	let total = 0;

	workbook.SheetNames.forEach((sheetName) => {
		const worksheet = workbook.Sheets[sheetName];
		const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

		const hasHeaders =
			data[0]?.[0]?.toString().toLowerCase().includes("apellido") ||
			data[0]?.[1]?.toString().toLowerCase().includes("nombre");
		const startRow = hasHeaders ? 1 : 0;

		for (let i = startRow; i < data.length; i++) {
			const row = data[i];
			if (row && (row[0] || row[1])) {
				total++;
			}
		}
	});

	return total;
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
					error: `Formato no compatible. Use: ${validExtensions.join(", ")}`,
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
					error: "El archivo no contiene hojas válidas.",
				},
				{ status: 400 }
			);
		}

		const detectedGroups = detectGroupsFromWorkbook(workbook);

		if (detectedGroups.length === 0) {
			return NextResponse.json(
				{
					success: false,
					error:
						"No se detectaron grupos. Asegúrese de que cada grupo esté en una hoja separada.",
				},
				{ status: 400 }
			);
		}

		const totalStudents = countTotalStudents(workbook);

		return NextResponse.json({
			success: true,
			grupos: detectedGroups,
			totalEstudiantes: totalStudents,
			totalHojas: workbook.SheetNames.length,
			gruposDetectados: detectedGroups.length,
			estudiantesDetectados: totalStudents,
		});
	} catch (error) {
		console.error("Error en detect-groups:", error);
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
