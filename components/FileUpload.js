"use client";
import { useRef, useState } from "react";

export default function FileUpload({ onFileSelect, acceptedFormats, label }) {
	const [isDragging, setIsDragging] = useState(false);
	const [fileName, setFileName] = useState("");
	const fileInputRef = useRef(null);

	const handleDragOver = (e) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = (e) => {
		e.preventDefault();
		setIsDragging(false);
	};

	const handleDrop = (e) => {
		e.preventDefault();
		setIsDragging(false);

		const files = e.dataTransfer.files;
		if (files.length > 0) {
			const file = files[0];
			if (validateFileType(file)) {
				setFileName(file.name);
				onFileSelect(file);
			} else {
				alert(`Formato no compatible. Use: ${acceptedFormats}`);
			}
		}
	};

	const handleFileInput = (e) => {
		if (e.target.files.length > 0) {
			const file = e.target.files[0];
			if (validateFileType(file)) {
				setFileName(file.name);
				onFileSelect(file);
			} else {
				alert(`Formato no compatible. Use: ${acceptedFormats}`);
				e.target.value = "";
			}
		}
	};

	const validateFileType = (file) => {
		const validExtensions = acceptedFormats
			.split(",")
			.map((ext) => ext.trim().replace(".", "").toLowerCase());

		const fileExtension = file.name.toLowerCase().split(".").pop();

		const mimeTypes = {
			xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			xls: "application/vnd.ms-excel",
			csv: "text/csv",
			ods: "application/vnd.oasis.opendocument.spreadsheet",
		};

		const isValidExtension = validExtensions.includes(fileExtension);
		const isValidMimeType =
			!file.type ||
			file.type === mimeTypes[fileExtension] ||
			file.type.includes("spreadsheet") ||
			file.type.includes("excel") ||
			file.type.includes("csv");

		return isValidExtension || isValidMimeType;
	};

	const handleButtonClick = (e) => {
		e.preventDefault();
		e.stopPropagation();
		fileInputRef.current?.click();
	};

	const handleContainerClick = (e) => {
		if (!e.target.closest("button")) {
			fileInputRef.current?.click();
		}
	};

	const handleClearFile = (e) => {
		e.preventDefault();
		e.stopPropagation();
		setFileName("");
		onFileSelect(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	return (
		<div
			className={`file-upload ${isDragging ? "dragging" : ""} ${fileName ? "has-file" : ""}`}
			onDragOver={handleDragOver}
			onDragLeave={handleDragLeave}
			onDrop={handleDrop}
			onClick={handleContainerClick}
		>
			<div className="upload-icon">
				<i className="fas fa-cloud-upload-alt"></i>
			</div>
			<h3>{label}</h3>
			<p className="formats-info">Formatos aceptados: {acceptedFormats}</p>

			{fileName ? (
				<div className="file-info" onClick={(e) => e.stopPropagation()}>
					<div className="file-icon">
						{fileName.endsWith(".csv") ? (
							<i className="fas fa-file-csv"></i>
						) : fileName.endsWith(".xlsx") || fileName.endsWith(".xls") ? (
							<i className="fas fa-file-excel"></i>
						) : fileName.endsWith(".ods") ? (
							<i className="fas fa-file-alt"></i>
						) : (
							<i className="fas fa-file"></i>
						)}
					</div>
					<div className="file-details">
						<span className="file-name">{fileName}</span>
						<span className="file-type">
							{fileName.includes(".")
								? fileName.split(".").pop().toUpperCase()
								: "Archivo"}
						</span>
					</div>
					<button
						type="button"
						className="clear-file"
						onClick={handleClearFile}
						aria-label="Eliminar archivo"
						title="Eliminar archivo"
					>
						<i className="fas fa-times"></i>
					</button>
				</div>
			) : (
				<div className="upload-buttons" onClick={(e) => e.stopPropagation()}>
					<button
						type="button"
						className="secondary-button select-file-button"
						onClick={handleButtonClick}
					>
						<i className="fas fa-search"></i>
						<span>Seleccionar Archivo</span>
					</button>
					<p className="or-text">o arrastre y suelte aquí</p>
					<div className="format-icons">
						<span className="format-icon" title="Excel (.xlsx)">
							<i className="fas fa-file-excel"></i>
							<small>.xlsx</small>
						</span>
						<span className="format-icon" title="Excel (.xls)">
							<i className="fas fa-file-excel"></i>
							<small>.xls</small>
						</span>
						<span className="format-icon" title="CSV">
							<i className="fas fa-file-csv"></i>
							<small>.csv</small>
						</span>
						<span className="format-icon" title="OpenDocument (.ods)">
							<i className="fas fa-file-alt"></i>
							<small>.ods</small>
						</span>
					</div>
				</div>
			)}

			<input
				ref={fileInputRef}
				type="file"
				className="file-input"
				onChange={handleFileInput}
				accept=".xlsx,.xls,.csv,.ods,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,application/vnd.oasis.opendocument.spreadsheet"
			/>
		</div>
	);
}
