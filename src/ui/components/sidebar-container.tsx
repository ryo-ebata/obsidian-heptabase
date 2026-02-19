import type { SidebarTab } from "@/types/plugin";
import { CanvasInfoPanel } from "@/ui/components/canvas-info-panel";
import { HeadingExplorer } from "@/ui/components/heading-explorer";
import { SidebarTabs } from "@/ui/components/sidebar-tabs";
import { TocPanel } from "@/ui/components/toc-panel";
import { useActiveFile } from "@/ui/hooks/use-active-file";
import type React from "react";
import { useCallback, useState } from "react";

export function SidebarContainer(): React.ReactElement {
	const [activeTab, setActiveTab] = useState<SidebarTab>("card-library");
	const activeFile = useActiveFile();

	const handleTabChange = useCallback((tab: SidebarTab) => {
		setActiveTab(tab);
	}, []);

	return (
		<div className="h-full flex flex-col">
			<SidebarTabs activeTab={activeTab} onTabChange={handleTabChange} />
			{activeTab === "card-library" && <HeadingExplorer />}
			{activeTab === "toc" && <TocPanel activeFile={activeFile} />}
			{activeTab === "canvas-info" && <CanvasInfoPanel />}
		</div>
	);
}
