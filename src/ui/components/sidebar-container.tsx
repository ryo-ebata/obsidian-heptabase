import type { SidebarTab } from "@/types/plugin";
import { ArticleViewerPanel } from "@/ui/components/article-viewer-panel";
import { CanvasInfoPanel } from "@/ui/components/canvas-info-panel";
import { HeadingExplorer } from "@/ui/components/heading-explorer";
import { SidebarTabs } from "@/ui/components/sidebar-tabs";
import type React from "react";
import { useCallback, useState } from "react";

export function SidebarContainer(): React.ReactElement {
	const [activeTab, setActiveTab] = useState<SidebarTab>("card-library");

	const handleTabChange = useCallback((tab: SidebarTab) => {
		setActiveTab(tab);
	}, []);

	return (
		<div className="h-full flex flex-col">
			<SidebarTabs activeTab={activeTab} onTabChange={handleTabChange} />
			{activeTab === "card-library" && <HeadingExplorer />}
			{activeTab === "article-viewer" && <ArticleViewerPanel />}
			{activeTab === "canvas-info" && <CanvasInfoPanel />}
		</div>
	);
}
