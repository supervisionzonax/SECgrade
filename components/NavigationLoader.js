"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import ProcessingLoader from "./ProcessingLoader";

export default function NavigationLoader() {
	const pathname = usePathname();
	const [isNavigating, setIsNavigating] = useState(false);
	const [prevPathname, setPrevPathname] = useState(pathname);
	const timerRef = useRef(null);
	const safetyTimerRef = useRef(null);
	const isNavigatingRef = useRef(false);
	const isInitialMount = useRef(true);

	// Función para limpiar todos los timers
	const clearAllTimers = useCallback(() => {
		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}
		if (safetyTimerRef.current) {
			clearTimeout(safetyTimerRef.current);
			safetyTimerRef.current = null;
		}
	}, []);

	// Función para ocultar el loader de forma segura
	const hideLoader = useCallback(() => {
		clearAllTimers();
		isNavigatingRef.current = false;
		// Usar requestAnimationFrame para asegurar que se ejecute después del render
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				setIsNavigating(false);
			});
		});
	}, [clearAllTimers]);

	// Detectar refresh al montar el componente
	useEffect(() => {
		// Verificar si hay un refresh en progreso desde sessionStorage
		let isRefreshing = false;
		try {
			isRefreshing = sessionStorage.getItem('isRefreshing') === 'true';
			if (isRefreshing) {
				sessionStorage.removeItem('isRefreshing');
			}
		} catch (e) {
			// sessionStorage no disponible, continuar
		}

		// Detectar si la página se cargó por refresh usando Performance API
		if (typeof window !== 'undefined' && window.performance) {
			try {
				const navigation = performance.getEntriesByType('navigation')[0];
				if (navigation && (navigation.type === 'reload' || isRefreshing)) {
					// Es un refresh, mostrar el loader
					setIsNavigating(true);
					isNavigatingRef.current = true;
					
					// Ocultar después de que la página cargue
					const hideAfterLoad = () => {
						setTimeout(() => {
							if (isNavigatingRef.current) {
								hideLoader();
							}
						}, 500);
					};
					
					if (document.readyState === 'complete') {
						hideAfterLoad();
					} else {
						window.addEventListener('load', hideAfterLoad, { once: true });
					}
				}
			} catch (e) {
				// Performance API no disponible, usar sessionStorage como fallback
				if (isRefreshing) {
					setIsNavigating(true);
					isNavigatingRef.current = true;
					
					const hideAfterLoad = () => {
						setTimeout(() => {
							if (isNavigatingRef.current) {
								hideLoader();
							}
						}, 500);
					};
					
					if (document.readyState === 'complete') {
						hideAfterLoad();
					} else {
						window.addEventListener('load', hideAfterLoad, { once: true });
					}
				}
			}
		} else if (isRefreshing) {
			// Performance API no disponible pero sessionStorage indica refresh
			setIsNavigating(true);
			isNavigatingRef.current = true;
			
			const hideAfterLoad = () => {
				setTimeout(() => {
					if (isNavigatingRef.current) {
						hideLoader();
					}
				}, 500);
			};
			
			if (document.readyState === 'complete') {
				hideAfterLoad();
			} else {
				window.addEventListener('load', hideAfterLoad, { once: true });
			}
		}
		
		isInitialMount.current = false;
	}, [hideLoader]);

	useEffect(() => {
		// Interceptar teclas de refresh (F5, Ctrl+R, Cmd+R)
		const handleKeyDown = (e) => {
			// F5 o Ctrl+R (Windows/Linux) o Cmd+R (Mac)
			if (e.key === 'F5' || (e.key === 'r' && (e.ctrlKey || e.metaKey))) {
				setIsNavigating(true);
				isNavigatingRef.current = true;
			}
		};

		// Detectar cuando se va a hacer refresh (beforeunload)
		const handleBeforeUnload = () => {
			// Guardar en sessionStorage que se está haciendo refresh
			try {
				sessionStorage.setItem('isRefreshing', 'true');
			} catch (e) {
				// sessionStorage no disponible, continuar
			}
			setIsNavigating(true);
			isNavigatingRef.current = true;
		};

		// Interceptar clicks en links de navegación (incluyendo Links de Next.js)
		const handleLinkClick = (e) => {
			// Buscar el link más cercano (puede ser un <a> o un elemento dentro de un Link de Next.js)
			let link = e.target.closest('a[href]');
			
			// Si no encontramos un <a>, buscar si estamos dentro de un Link de Next.js
			if (!link) {
				const linkElement = e.target.closest('[data-navigation]') || e.target.closest('a');
				if (linkElement) {
					const href = linkElement.getAttribute('href') || linkElement.getAttribute('data-href');
					if (href && href.startsWith('/') && !href.startsWith('//')) {
						setIsNavigating(true);
						isNavigatingRef.current = true;
						return;
					}
				}
			}
			
			if (link && link.href) {
				const href = link.getAttribute('href');
				// Solo interceptar links internos (que no sean externos ni anchors)
				if (href && href.startsWith('/') && !href.startsWith('//')) {
					// Verificar que no sea un anchor link
					const url = new URL(link.href, window.location.origin);
					if (url.pathname !== window.location.pathname || url.hash) {
						setIsNavigating(true);
						isNavigatingRef.current = true;
					}
				}
			}
		};

		// Escuchar eventos personalizados de navegación (para router.push)
		const handleNavigationEvent = (e) => {
			setIsNavigating(true);
			isNavigatingRef.current = true;
		};

		// Manejar cuando la página vuelve a estar visible (útil en móvil)
		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible' && isNavigatingRef.current) {
				// Si la página vuelve a estar visible y aún está navegando,
				// esperar un poco más y luego ocultar el loader
				setTimeout(() => {
					if (isNavigatingRef.current) {
						hideLoader();
					}
				}, 300);
			}
		};

		// Agregar listener para clicks en links (usar capture phase para interceptar antes)
		document.addEventListener('click', handleLinkClick, true);
		// Agregar listener para eventos personalizados de navegación
		document.addEventListener('navigation-start', handleNavigationEvent);
		// Agregar listener para cambios de visibilidad (útil en móvil)
		document.addEventListener('visibilitychange', handleVisibilityChange);
		// Agregar listener para teclas de refresh
		window.addEventListener('keydown', handleKeyDown);
		// Agregar listener para beforeunload (refresh)
		window.addEventListener('beforeunload', handleBeforeUnload);

		return () => {
			document.removeEventListener('click', handleLinkClick, true);
			document.removeEventListener('navigation-start', handleNavigationEvent);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			window.removeEventListener('keydown', handleKeyDown);
			window.removeEventListener('beforeunload', handleBeforeUnload);
			clearAllTimers();
		};
	}, [hideLoader, clearAllTimers]);

	useEffect(() => {
		let loadHandler = null;
		let domReadyHandler = null;

		// Si el pathname cambió, asegurar que el loading esté visible
		if (pathname !== prevPathname && prevPathname !== null) {
			// Limpiar timers anteriores antes de iniciar nuevos
			clearAllTimers();
			
			// Solo activar el loader si no está ya activo (evitar duplicados)
			if (!isNavigatingRef.current) {
				setIsNavigating(true);
				isNavigatingRef.current = true;
			}
			
			// Escuchar cuando la página termine de cargar (útil en móvil)
			loadHandler = () => {
				setTimeout(() => {
					if (isNavigatingRef.current) {
						hideLoader();
					}
				}, 200);
			};
			
			// Escuchar cuando el DOM esté listo
			domReadyHandler = () => {
				setTimeout(() => {
					if (isNavigatingRef.current) {
						hideLoader();
					}
				}, 300);
			};
			
			// Solo agregar el listener si la página aún no está completamente cargada
			if (document.readyState === 'loading') {
				document.addEventListener('DOMContentLoaded', domReadyHandler);
				window.addEventListener('load', loadHandler);
			} else if (document.readyState === 'interactive') {
				window.addEventListener('load', loadHandler);
				// Si ya está en interactive, esperar un poco más
				setTimeout(() => {
					if (isNavigatingRef.current) {
						hideLoader();
					}
				}, 300);
			} else {
				// Si ya está completo, ocultar después de un breve delay
				setTimeout(() => {
					if (isNavigatingRef.current) {
						hideLoader();
					}
				}, 300);
			}
			
			// Ocultar el loading después de un delay moderado
			timerRef.current = setTimeout(() => {
				if (isNavigatingRef.current) {
					hideLoader();
				}
			}, 500);

			// Timeout de seguridad máximo: forzar cierre después de 1.5 segundos
			safetyTimerRef.current = setTimeout(() => {
				if (isNavigatingRef.current) {
					console.warn('NavigationLoader: Timeout de seguridad activado, ocultando loader');
					hideLoader();
				}
			}, 1500);
		}
		
		// Actualizar el pathname previo
		setPrevPathname(pathname);

		// Cleanup al desmontar o cambiar dependencias
		return () => {
			if (loadHandler) {
				window.removeEventListener('load', loadHandler);
			}
			if (domReadyHandler) {
				document.removeEventListener('DOMContentLoaded', domReadyHandler);
			}
			clearAllTimers();
		};
	}, [pathname, prevPathname, hideLoader, clearAllTimers]);

	// Limpiar timers cuando el componente se desmonte
	useEffect(() => {
		return () => {
			clearAllTimers();
			setIsNavigating(false);
			isNavigatingRef.current = false;
		};
	}, [clearAllTimers]);

	// Mostrar loader si está navegando o si es un refresh detectado
	return isNavigating ? <ProcessingLoader /> : null;
}
