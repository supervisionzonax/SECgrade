import "./globals.css";
import PageLoader from "../components/PageLoader";

export const metadata = {
	title: "SEC Sonora - RAF",
	description: "RAF Sec x ZipGrade",
	viewport: {
		width: "device-width",
		initialScale: 1,
		maximumScale: 1,
		userScalable: false,
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
