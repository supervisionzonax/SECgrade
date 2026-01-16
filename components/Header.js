"use client";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Header() {
	const pathname = usePathname();
	const router = useRouter();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	// Prevenir scroll del body cuando el menú móvil está abierto
	useEffect(() => {
		if (mobileMenuOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [mobileMenuOpen]);

	const handleLogoClick = (e) => {
		e.preventDefault();
		// Marcar que estamos refrescando
		sessionStorage.setItem("isRefreshing", "true");
		// Ocultar contenido inmediatamente
		if (document.body) {
			document.body.style.opacity = "0";
			document.body.style.pointerEvents = "none";
			document.body.style.transition = "opacity 0.05s ease";
		}
		// Recargar inmediatamente
		window.location.reload();
	};

	return (
		<>
			<header className="header">
				<div className="header-container">
					<div className="logo-section" onClick={handleLogoClick} style={{ cursor: "pointer" }}>
						<div className="logo-placeholder">
							<img
								src="/logo-sonora.png"
								alt="Gobierno de Sonora"
								onError={(e) => {
									e.target.style.display = "none";
									e.target.nextElementSibling.style.display = "flex";
								}}
							/>
						</div>
						<div className="gov-title">
							<h1>Secretaría de Educación y Cultura</h1>
							<p>Gobierno del Estado de Sonora</p>
						</div>
					</div>

					<button
						className="mobile-menu-toggle"
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						aria-label="Toggle menu"
						aria-expanded={mobileMenuOpen}
					>
						<span className={`hamburger ${mobileMenuOpen ? "active" : ""}`}>
							<span></span>
							<span></span>
							<span></span>
						</span>
					</button>

					<nav className={`nav ${mobileMenuOpen ? "mobile-open" : ""}`}>
						<a
							href="/"
							className={`nav-link ${pathname === "/" ? "active" : ""}`}
							onClick={() => setMobileMenuOpen(false)}
						>
							<i className="fas fa-home"></i>
							<span>Inicio</span>
						</a>
						<a
							href="/preparar-listas"
							className={`nav-link ${pathname === "/preparar-listas" ? "active" : ""}`}
							onClick={() => setMobileMenuOpen(false)}
						>
							<i className="fas fa-file-upload"></i>
							<span>Crear Listas</span>
						</a>
						<a
							href="/resultados"
							className={`nav-link ${pathname === "/resultados" ? "active" : ""}`}
							onClick={() => setMobileMenuOpen(false)}
						>
							<i className="fas fa-chart-bar"></i>
							<span>Preparar Resultados</span>
						</a>
					</nav>
				</div>
			</header>
			{mobileMenuOpen && (
				<div 
					className="mobile-menu-overlay"
					onClick={() => setMobileMenuOpen(false)}
					aria-hidden="true"
				/>
			)}
		</>
	);
}
