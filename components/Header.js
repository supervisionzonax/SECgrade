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
		e.stopPropagation();
		
		// Detectar si es móvil (ancho menor a 768px)
		const isMobile = window.innerWidth < 768;
		
		if (isMobile) {
			// En móvil: redirigir a la página de inicio
			// Disparar evento personalizado para que el NavigationLoader lo detecte
			// Usar setTimeout para asegurar que el evento se procese antes de la navegación
			const navEvent = new CustomEvent('navigation-start', { bubbles: true, cancelable: true });
			document.dispatchEvent(navEvent);
			
			// Pequeño delay para asegurar que el evento se procese
			setTimeout(() => {
				router.push("/");
			}, 10);
		} else {
			// En desktop: mantener comportamiento actual (refresh)
			// Establecer flag para que NavigationLoader muestre el loader
			try {
				sessionStorage.setItem("isRefreshing", "true");
			} catch (e) {
				// sessionStorage no disponible, continuar
			}
			window.location.reload();
		}
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
						<a
							href="/rosa-isela"
							className={`nav-link ${pathname === "/rosa-isela" ? "active" : ""}`}
							onClick={() => setMobileMenuOpen(false)}
						>
							<i className="fas fa-chart-pie"></i>
							<span>Rosa Isela</span>
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
