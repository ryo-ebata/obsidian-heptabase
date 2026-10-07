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
	{ id: "canvas-search", label: "Canvas" },
];

const TAB_IDS = TABS.map((tab) => tab.id);

export function SidebarTabs({ activeTab, onTabChange }: SidebarTabsProps): React.ReactElement {
	return (
		<div
			role="tablist"
			aria-label="Heading Explorer views"
			aria-orientation="horizontal"
			className="heptabase-tabs flex border-b border-ob-border shrink-0"
		>
			{TABS.map((tab) => (
				<TabButton
					key={tab.id}
					id={tab.id}
					label={tab.label}
					isActive={activeTab === tab.id}
					onClick={onTabChange}
					tabIds={TAB_IDS}
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
	tabIds: SidebarTab[];
}

function TabButton({ id, label, isActive, onClick, tabIds }: TabButtonProps): React.ReactElement {
	const handleClick = useCallback(() => {
		onClick(id);
	}, [id, onClick]);
	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLButtonElement>) => {
			const currentIndex = tabIds.indexOf(id);
			const nextIndex =
				event.key === "ArrowRight"
					? (currentIndex + 1) % tabIds.length
					: event.key === "ArrowLeft"
						? (currentIndex - 1 + tabIds.length) % tabIds.length
						: event.key === "Home"
							? 0
							: event.key === "End"
								? tabIds.length - 1
								: -1;
			if (nextIndex < 0) return;
			const nextTab = tabIds[nextIndex];
			if (!nextTab) return;
			event.preventDefault();
			onClick(nextTab);
			document.getElementById(`heptabase-tab-${nextTab}`)?.focus();
		},
		[id, onClick, tabIds],
	);

	return (
		<button
			type="button"
			role="tab"
			id={`heptabase-tab-${id}`}
			aria-selected={isActive}
			aria-controls={`heptabase-panel-${id}`}
			tabIndex={isActive ? 0 : -1}
			onKeyDown={handleKeyDown}
			className={`heptabase-tab flex-1 px-3 py-1.5 bg-transparent border-none border-b-2 cursor-pointer text-ob-ui-small text-ob-muted ${isActive ? "is-active text-ob-normal border-b-ob-accent" : "border-b-transparent"}`}
			onClick={handleClick}
		>
			{label}
		</button>
	);
}
