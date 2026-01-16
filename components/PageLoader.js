"use client";
import { useEffect, useState } from "react";

export default function PageLoader() {
	const [isLoading, setIsLoading] = useState(() => {
		// Verificar inmediatamente si hay un refresh en progreso
		if (typeof window !== "undefined") {
			return sessionStorage.getItem("isRefreshing") === "true";
		}
		return false;
	});

	useEffect(() => {
		// Verificar si hay un refresh en progreso
		const isRefreshing = sessionStorage.getItem("isRefreshing");
		if (isRefreshing === "true") {
			setIsLoading(true);
			// Ocultar contenido mientras carga
			if (document.body) {
				document.body.style.opacity = "0";
			}
		}

		// Ocultar loading cuando la página termine de cargar
		const handleLoad = () => {
			setTimeout(() => {
				setIsLoading(false);
				sessionStorage.removeItem("isRefreshing");
				if (document.body) {
					document.body.style.opacity = "1";
					document.body.style.pointerEvents = "auto";
					document.body.style.transition = "";
				}
			}, 300);
		};

		if (document.readyState === "complete") {
			handleLoad();
		} else {
			window.addEventListener("load", handleLoad);
		}

		return () => {
			window.removeEventListener("load", handleLoad);
		};
	}, []);

	if (!isLoading) return null;

	return (
		<div className="loading-overlay">
			<div className="loading-spinner">
				<div className="spinner-ring"></div>
				<div className="spinner-ring"></div>
				<div className="spinner-ring"></div>
			</div>
		</div>
	);
}
