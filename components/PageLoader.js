"use client";
import { useEffect, useState } from "react";

export default function PageLoader() {
	// Estado inicial siempre false para evitar problemas de hidratación
	const [isLoading, setIsLoading] = useState(false);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		// Marcar como montado solo en el cliente
		setMounted(true);

		// Marcar body y html como loaded INMEDIATAMENTE al montar para evitar reflow
		if (typeof window !== "undefined") {
			// Usar requestAnimationFrame para asegurar que se ejecute después del primer render
			requestAnimationFrame(() => {
				if (document.body) {
					document.body.classList.add("loaded");
				}
				if (document.documentElement) {
					document.documentElement.classList.add("loaded");
					document.documentElement.classList.remove("loading");
				}
			});

			// Verificar si hay un refresh en progreso solo en el cliente
			const isRefreshing = sessionStorage.getItem("isRefreshing");
			if (isRefreshing === "true") {
				setIsLoading(true);
			}
		}

		// Ocultar loading cuando la página termine de cargar
		const handleLoad = () => {
			if (typeof window !== "undefined") {
				setIsLoading(false);
				sessionStorage.removeItem("isRefreshing");
				// Asegurar que body esté visible
				if (document.body) {
					document.body.classList.add("loaded");
					document.body.style.opacity = "";
					document.body.style.pointerEvents = "";
					document.body.style.transition = "";
				}
			}
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
