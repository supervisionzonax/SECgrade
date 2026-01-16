import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
	try {
		const workbook = XLSX.utils.book_new();

		const datos1A = [
			["Apellidos", "Nombres"],
			["García López", "Juan Carlos"],
			["Rodríguez Martínez", "María Fernanda"],
			["Pérez González", "Carlos Alberto"],
			["Hernández Silva", "Ana Sofía"],
		];
		const ws1A = XLSX.utils.aoa_to_sheet(datos1A);
		XLSX.utils.book_append_sheet(workbook, ws1A, "1A");

		const datos1B = [
			["Apellidos", "Nombres"],
			["Martínez Díaz", "Luis Fernando"],
			["González Ramírez", "Laura Isabel"],
			["Sánchez Cruz", "Pedro Antonio"],
			["Ramírez Flores", "Isabel Carmen"],
		];
		const ws1B = XLSX.utils.aoa_to_sheet(datos1B);
		XLSX.utils.book_append_sheet(workbook, ws1B, "1B");

		const excelBuffer = XLSX.write(workbook, {
			type: "buffer",
			bookType: "xlsx",
		});

		return new Response(excelBuffer, {
			headers: {
				"Content-Type":
					"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				"Content-Disposition": 'attachment; filename="plantilla_listas_estudiantes.xlsx"',
			},
		});
	} catch (error) {
		console.error("Error al generar plantilla:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Error al generar la plantilla",
				details: process.env.NODE_ENV === "development" ? error.message : undefined,
			},
			{ status: 500 }
		);
	}
}
