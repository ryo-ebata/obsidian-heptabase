import type { SidebarTab } from "@/types/plugin";
import type React from "react";
import { useCallback } from "react";

interface SidebarTabsProps {
	activeTab: SidebarTab;
	onTabChange: (tab: SidebarTab) => void;
}

const TABS: { id: SidebarTab; label: string }[] = [
	{ id: "card-library", label: "Card Library" },
	{ id: "article-viewer", label: "Article" },
	{ id: "canvas-info", label: "Info" },
];

export function SidebarTabs({ activeTab, onTabChange }: SidebarTabsProps): React.ReactElement {
	return (
		<div className="flex border-b border-ob-border shrink-0">
			{TABS.map((tab) => (
				<TabButton
					key={tab.id}
					id={tab.id}
					label={tab.label}
					isActive={activeTab === tab.id}
					onClick={onTabChange}
				/>
			))}
		</div>
	);
}

interface TabButtonProps {
	id: SidebarTab;
	label: string;
	isActive: boolean;
	onClick: (tab: SidebarTab) => void;
}

function TabButton({ id, label, isActive, onClick }: TabButtonProps): React.ReactElement {
	const handleClick = useCallback(() => {
		onClick(id);
	}, [id, onClick]);

	return (
		<button
			type="button"
			className={`flex-1 px-3 py-1.5 bg-transparent border-none border-b-2 cursor-pointer text-ob-ui-small text-ob-muted hover:text-ob-normal ${isActive ? "text-ob-normal border-b-ob-accent" : "border-b-transparent"}`}
			onClick={handleClick}
		>
			{label}
		</button>
	);
}
