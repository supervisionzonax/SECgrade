"use client";
import NavigationLoader from "./NavigationLoader";
import PullToRefresh from "./PullToRefresh";

export default function LayoutWrapper({ children }) {
	return (
		<>
			<NavigationLoader />
			<PullToRefresh />
			{children}
		</>
	);
}
