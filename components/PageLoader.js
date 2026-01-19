"use client";
import { useEffect, useState } from "react";

export default function PageLoader() {
	// Estado inicial siempre false para evitar problemas de hidratación
	const [isLoading, setIsLoading] = useState(false);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		// Marcar como montado solo en el cliente
		setMounted(true);

		// Verificar si hay un refresh en progreso solo en el cliente
		if (typeof window !== "undefined") {
			const isRefreshing = sessionStorage.getItem("isRefreshing");
			if (isRefreshing === "true") {
				setIsLoading(true);
				// Ocultar contenido mientras carga
				if (document.body) {
					document.body.style.opacity = "0";
				}
			}
		}

		// Ocultar loading cuando la página termine de cargar
		const handleLoad = () => {
			setTimeout(() => {
				setIsLoading(false);
				if (typeof window !== "undefined") {
					sessionStorage.removeItem("isRefreshing");
				}
				if (document.body) {
					document.body.style.opacity = "1";
					document.body.style.pointerEvents = "auto";
					document.body.style.transition = "";
				}
			}, 300);
		};

		if (typeof window !== "undefined") {
			if (document.readyState === "complete") {
				handleLoad();
			} else {
				window.addEventListener("load", handleLoad);
			}

			return () => {
				window.removeEventListener("load", handleLoad);
			};
		}
	}, []);

	// No renderizar nada hasta que el componente esté montado en el cliente
	if (!mounted || !isLoading) return null;

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
