"use client";
import { useEffect } from "react";

export default function PullToRefresh() {
	useEffect(() => {
		let touchStartY = 0;
		let touchCurrentY = 0;
		let isPulling = false;
		let pullDistance = 0;
		const threshold = 80; // Distancia mínima para activar refresh

		const handleTouchStart = (e) => {
			// Solo activar si estamos en la parte superior de la página
			if (window.scrollY === 0 || document.documentElement.scrollTop === 0) {
				touchStartY = e.touches[0].clientY;
				isPulling = true;
			}
		};

		const handleTouchMove = (e) => {
			if (!isPulling) return;

			touchCurrentY = e.touches[0].clientY;
			pullDistance = touchCurrentY - touchStartY;

			// Solo permitir pull hacia abajo
			if (pullDistance > 0 && (window.scrollY === 0 || document.documentElement.scrollTop === 0)) {
				// Prevenir scroll normal mientras hacemos pull
				if (pullDistance > 10) {
					e.preventDefault();
				}
			} else {
				isPulling = false;
			}
		};

		const handleTouchEnd = () => {
			if (!isPulling) return;

			// Si se estiró lo suficiente, hacer refresh
			if (pullDistance >= threshold && (window.scrollY === 0 || document.documentElement.scrollTop === 0)) {
				// Establecer flag para que NavigationLoader muestre el loader
				try {
					sessionStorage.setItem("isRefreshing", "true");
				} catch (e) {
					// sessionStorage no disponible, continuar
				}
				
				// Hacer refresh
				window.location.reload();
			}

			// Reset
			isPulling = false;
			pullDistance = 0;
			touchStartY = 0;
			touchCurrentY = 0;
		};

		// Agregar event listeners
		document.addEventListener("touchstart", handleTouchStart, { passive: true });
		document.addEventListener("touchmove", handleTouchMove, { passive: false });
		document.addEventListener("touchend", handleTouchEnd, { passive: true });

		// Cleanup
		return () => {
			document.removeEventListener("touchstart", handleTouchStart);
			document.removeEventListener("touchmove", handleTouchMove);
			document.removeEventListener("touchend", handleTouchEnd);
		};
	}, []);

	return null; // Este componente no renderiza nada
}
