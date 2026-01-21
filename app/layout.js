import "./globals.css";
import PageLoader from "../components/PageLoader";
import LayoutWrapper from "../components/LayoutWrapper";

export const metadata = {
	title: "SEC Sonora - RAF | ZipGrade",
	description: "Sistema de gestión de evaluaciones con ZipGrade - Secretaría de Educación y Cultura del Estado de Sonora",
	viewport: {
		width: "device-width",
		initialScale: 1,
		maximumScale: 1,
		userScalable: false,
	},
	icons: {
		icon: '/faviconsonora.png',
		apple: '/faviconsonora.png',
	},
	other: {
		'Content-Security-Policy': "script-src 'self' 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval'; object-src 'none';",
	},
};

export default function RootLayout({ children }) {
	return (
		<html lang="es" className="loaded" style={{ height: "100%" }}>
			<head>
				<script
					dangerouslySetInnerHTML={{
						__html: `
							(function() {
								if (document.body) {
									document.body.classList.add('loaded');
								}
								if (document.documentElement) {
									document.documentElement.classList.add('loaded');
								}
							})();
						`,
					}}
				/>
			</head>
			<body 
				style={{ minHeight: "100%", display: "flex", flexDirection: "column", margin: 0, padding: 0, transition: "none", opacity: 1 }}
				className="loaded"
			>
				<PageLoader />
				<LayoutWrapper>
					{children}
				</LayoutWrapper>
			</body>
		</html>
	);
}
