import * as XLSX from "xlsx";

/**
 * Parse un archivo Excel y devuelve el workbook
 * @param {File} file - Archivo Excel subido por el usuario
 * @returns {Promise<Object>} Workbook de XLSX
 */
export const parseExcelFile = async (file) => {
	try {
		const buffer = await file.arrayBuffer();
		const workbook = XLSX.read(buffer, {
			type: "buffer",
			cellDates: true,
			cellStyles: true,
			sheetStubs: false,
		});
		return workbook;
	} catch (error) {
		console.error("Error al parsear archivo Excel:", error);
		throw new Error(`No se pudo leer el archivo Excel: ${error.message}`);
	}
};

/**
 * Detectar nombres de grupos desde los nombres de las hojas
 * @param {Object} workbook - Workbook de XLSX
 * @returns {Array<string>} Lista de nombres de grupos detectados
 */
export const detectGroupsFromWorkbook = (workbook) => {
	if (!workbook || !workbook.SheetNames) {
		return [];
	}

	return workbook.SheetNames.map((sheetName) => {
		// Intentar extraer patrón de grupo (ej: "1A", "2B", "3C")
		const match = sheetName.match(/(\d+[A-Za-z])/);

		if (match) {
			return match[1].toUpperCase(); // Normalizar a mayúsculas
		}

		// Si no hay patrón, usar el nombre de la hoja
		return sheetName.trim();
	});
};

/**
 * Obtener datos de una hoja específica
 * @param {Object} workbook - Workbook de XLSX
 * @param {string} sheetName - Nombre de la hoja
 * @param {Object} options - Opciones de conversión
 * @returns {Array<Array<any>>} Datos de la hoja en formato de matriz
 */
export const getSheetData = (workbook, sheetName, options = {}) => {
	try {
		const worksheet = workbook.Sheets[sheetName];
		if (!worksheet) {
			throw new Error(`Hoja "${sheetName}" no encontrada`);
		}

		const defaultOptions = {
			header: 1, // Retornar como matriz
			defval: "",
			blankrows: false,
			raw: false,
		};

		const mergedOptions = { ...defaultOptions, ...options };
		return XLSX.utils.sheet_to_json(worksheet, mergedOptions);
	} catch (error) {
		console.error(`Error al obtener datos de la hoja ${sheetName}:`, error);
		throw error;
	}
};

/**
 * Detectar columnas de nombres y apellidos en una hoja
 * @param {Array<Array<any>>} sheetData - Datos de la hoja
 * @returns {Object} Índices de columnas detectadas
 */
export const detectNameColumns = (sheetData) => {
	if (!sheetData || sheetData.length === 0) {
		return { apellidosIndex: 0, nombresIndex: 1 };
	}

	const firstRow = sheetData[0];
	const columnIndices = {
		apellidosIndex: 0,
		nombresIndex: 1,
	};

	// Buscar encabezados comunes
	firstRow.forEach((cell, index) => {
		const cellStr = String(cell || "")
			.toLowerCase()
			.trim();

		if (
			cellStr.includes("apellido") ||
			cellStr.includes("lastname") ||
			cellStr.includes("apellidos")
		) {
			columnIndices.apellidosIndex = index;
		}

		if (
			(cellStr.includes("nombre") ||
				cellStr.includes("firstname") ||
				cellStr.includes("nombres")) &&
			!cellStr.includes("apellido")
		) {
			columnIndices.nombresIndex = index;
		}
	});

	return columnIndices;
};

/**
 * Extraer estudiantes de una hoja
 * @param {Array<Array<any>>} sheetData - Datos de la hoja
 * @param {Object} columnIndices - Índices de columnas
 * @returns {Array<Object>} Lista de estudiantes
 */
export const extractStudentsFromSheet = (sheetData, columnIndices) => {
	const students = [];
	const { apellidosIndex, nombresIndex } = columnIndices;

	// Determinar fila de inicio (0 si no hay encabezados, 1 si hay)
	const firstRow = sheetData[0];
	const hasHeaders =
		firstRow &&
		(String(firstRow[apellidosIndex] || "")
			.toLowerCase()
			.includes("apellido") ||
			String(firstRow[nombresIndex] || "")
				.toLowerCase()
				.includes("nombre"));

	const startRow = hasHeaders ? 1 : 0;

	for (let i = startRow; i < sheetData.length; i++) {
		const row = sheetData[i];

		if (row && row.length >= Math.max(apellidosIndex, nombresIndex) + 1) {
			const apellidos = String(row[apellidosIndex] || "").trim();
			const nombres = String(row[nombresIndex] || "").trim();

			if (apellidos || nombres) {
				students.push({
					apellidos,
					nombres,
					rowIndex: i + 1, // Para referencias de depuración
				});
			}
		}
	}

	return students;
};

/**
 * Validar formato del archivo Excel
 * @param {File} file - Archivo a validar
 * @returns {Object} Resultado de la validación
 */
export const validateExcelFile = (file) => {
	const validTypes = [
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"application/vnd.ms-excel",
		"text/csv",
	];

	const maxSize = 10 * 1024 * 1024; // 10MB

	if (!file) {
		return { valid: false, error: "No se proporcionó archivo" };
	}

	if (!validTypes.includes(file.type)) {
		return {
			valid: false,
			error: `Formato no soportado. Use: .xlsx, .xls o .csv`,
		};
	}

	if (file.size > maxSize) {
		return {
			valid: false,
			error: `Archivo demasiado grande. Máximo: ${maxSize / (1024 * 1024)}MB`,
		};
	}

	return { valid: true, error: null };
};

/**
 * Crear workbook para exportación
 * @param {Array<Object>} data - Datos a exportar
 * @param {Array<string>} headers - Encabezados de columnas
 * @param {string} sheetName - Nombre de la hoja
 * @returns {Object} Workbook listo para exportar
 */
export const createWorkbookForExport = (
	data,
	headers,
	sheetName = "Resultados",
) => {
	const worksheet = XLSX.utils.json_to_sheet(data, { header: headers });
	const workbook = XLSX.utils.book_new();

	// Auto-ajustar ancho de columnas
	const colWidths = headers.map((header) => ({
		wch: Math.max(header.length, 20),
	}));

	worksheet["!cols"] = colWidths;
	XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

	return workbook;
};

/**
 * Exportar workbook a archivo
 * @param {Object} workbook - Workbook de XLSX
 * @param {string} filename - Nombre del archivo
 */
export const exportWorkbookToFile = (workbook, filename) => {
	XLSX.writeFile(workbook, filename);
};

/**
 * Generar CSV para ZipGrade
 * @param {Array<Object>} students - Lista de estudiantes
 * @param {string} externalRef - Referencia externa del grupo
 * @param {string} grade - Grado
 * @param {string} className - Nombre de la clase
 * @returns {string} Contenido CSV
 */
export const generateZipGradeCSV = (
	students,
	externalRef,
	grade,
	className,
) => {
	const headers = [
		"Student ID",
		"External Ref.",
		"First Name",
		"Last Name",
		"Grade",
		"Class Name",
	];

	const rows = students.map((student, index) => ({
		"Student ID": index + 1,
		"External Ref.": externalRef,
		"First Name": student.nombres,
		"Last Name": student.apellidos,
		Grade: grade,
		"Class Name": className,
	}));

	const csvContent = [
		headers.join(","),
		...rows.map(
			(row) =>
				`${row["Student ID"]},${row["External Ref."]},"${row["First Name"]}","${row["Last Name"]}",${row.Grade},${row["Class Name"]}`,
		),
	].join("\n");

	return csvContent;
};

export default {
	parseExcelFile,
	detectGroupsFromWorkbook,
	getSheetData,
	detectNameColumns,
	extractStudentsFromSheet,
	validateExcelFile,
	createWorkbookForExport,
	exportWorkbookToFile,
	generateZipGradeCSV,
};
