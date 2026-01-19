import "./globals.css";
import PageLoader from "../components/PageLoader";

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
		'Content-Security-Policy': "script-src 'self' 'unsafe-eval' 'unsafe-inline'; object-src 'none';",
	},
};

export default function RootLayout({ children }) {
	return (
		<html lang="es" style={{ height: "100%", overflow: "hidden" }}>
			<body 
				style={{ height: "100%", display: "flex", flexDirection: "column", margin: 0, padding: 0 }}
				className="loaded"
			>
				<PageLoader />
				{children}
			</body>
		</html>
	);
}
