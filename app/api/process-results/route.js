import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function POST(request) {
	try {
		if (!request) {
			return NextResponse.json(
				{
					success: false,
					error: "Request inválida",
				},
				{ status: 400 }
			);
		}

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
				{ status: 400 },
			);
		}

		const validExtensions = [".xlsx", ".xls", ".csv", ".ods"];
		const fileExtension = "." + file.name.toLowerCase().split(".").pop();

		if (!validExtensions.includes(fileExtension)) {
			return NextResponse.json(
				{
					success: false,
					error: `Formato de archivo no válido. Use: ${validExtensions.join(", ")}.`,
					supportedFormats: validExtensions,
				},
				{ status: 400 },
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
					suggestion:
						"Intente guardar el archivo en formato CSV o Excel más reciente.",
				},
				{ status: 400 },
			);
		}

		if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
			return NextResponse.json(
				{
					success: false,
					error: "El archivo no contiene hojas de cálculo",
				},
				{ status: 400 },
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
					error:
						"El archivo no contiene datos suficientes. Mínimo 2 filas (encabezado + datos).",
				},
				{ status: 400 },
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
					error: "Tu archivo Excel no es compatible, descargalo de zipgrade.",
					availableHeaders: header,
					suggestion:
						"El archivo debe contener exactamente estas columnas: FirstName, LastName, CustomID, PercentCorrect",
				},
				{ status: 400 },
			);
		}

		const grupos = new Map();
		let studentId = 1;
		let totalCalificacion = 0;
		let estudiantesProcesados = 0;

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

			let calificacion = 0;
			if (
				percentCorrect !== undefined &&
				percentCorrect !== null &&
				percentCorrect !== ""
			) {
				try {
					const cleanValue = String(percentCorrect).replace("%", "").trim();
					calificacion = parseFloat(cleanValue);
					if (isNaN(calificacion)) {
						calificacion = 0;
					}
				} catch {
					calificacion = 0;
				}
			}

			if (!grupos.has(customId)) {
				grupos.set(customId, []);
			}

			const estudianteData = {
				id: studentId++,
				nombre: `${firstName} ${lastName}`.trim() || "Sin nombre",
				calificacion: Math.round(calificacion),
				firstName: firstName,
				lastName: lastName,
				percentCorrect: calificacion,
			};

			grupos.get(customId).push(estudianteData);
			totalCalificacion += estudianteData.calificacion;
			estudiantesProcesados++;
		}

		if (estudiantesProcesados === 0) {
			return NextResponse.json(
				{
					success: false,
					error:
						"No se encontraron estudiantes con datos válidos en el archivo. Verifique el formato.",
					fileHeaders: header,
				},
				{ status: 400 },
			);
		}

		const promediosGrupos = {};
		const resultados = {};

		grupos.forEach((estudiantes, grupoId) => {
			const promedio =
				estudiantes.reduce((sum, est) => sum + est.calificacion, 0) /
				estudiantes.length;
			promediosGrupos[grupoId] = Math.round(promedio);
			resultados[grupoId] = estudiantes.sort((a, b) =>
				a.nombre.localeCompare(b.nombre),
			);
		});

		const promedioGeneral = Math.round(
			totalCalificacion / estudiantesProcesados,
		);

		const responseData = {
			success: true,
			grupos: resultados,
			estadisticas: {
				totalGrupos: grupos.size,
				totalEstudiantes: estudiantesProcesados,
				promedioGeneral,
				promediosGrupos,
				archivoProcesado: file.name,
				formato: fileExtension.toUpperCase().replace(".", ""),
			},
			metadata: {
				procesadoEn: new Date().toISOString(),
				tiempoProcesamiento: new Date().toISOString(),
			},
		};

		return NextResponse.json(responseData);
	} catch (error) {
		console.error("Error en process-results:", error);
		
		try {
			return NextResponse.json(
				{
					success: false,
					error: "Error interno del servidor al procesar el archivo",
					details:
						process.env.NODE_ENV === "development" ? error.message : undefined,
					stack:
						process.env.NODE_ENV === "development" ? error.stack : undefined,
					suggestion:
						"Intente convertir el archivo a formato CSV o Excel (.xlsx)",
				},
				{ status: 500 },
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
