"use client";
import NavigationLoader from "./NavigationLoader";

export default function LayoutWrapper({ children }) {
	return (
		<>
			<NavigationLoader />
			{children}
		</>
	);
}
