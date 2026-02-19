import type { SidebarTab } from "@/types/plugin";
import { ArticleViewerPanel } from "@/ui/components/article-viewer-panel";
import { HeadingExplorer } from "@/ui/components/heading-explorer";
import { SidebarTabs } from "@/ui/components/sidebar-tabs";
import { SidebarActionsContext } from "@/ui/context";
import type React from "react";
import { useCallback, useState } from "react";

interface SidebarContainerProps {
	children?: React.ReactNode;
}

export function SidebarContainer({ children }: SidebarContainerProps): React.ReactElement {
	const [activeTab, setActiveTab] = useState<SidebarTab>("card-library");
	const [pendingArticleFilePath, setPendingArticleFilePath] = useState<string | null>(null);

	const handleTabChange = useCallback((tab: SidebarTab) => {
		setActiveTab(tab);
	}, []);

	const openInArticle = useCallback((filePath: string) => {
		setActiveTab("article-viewer");
		setPendingArticleFilePath(filePath);
	}, []);

	const handleFileOpened = useCallback(() => {
		setPendingArticleFilePath(null);
	}, []);

	return (
		<SidebarActionsContext.Provider value={{ openInArticle }}>
			<div className="h-full flex flex-col">
				<SidebarTabs activeTab={activeTab} onTabChange={handleTabChange} />
				<div
					data-tab-panel="card-library"
					className="flex-1 overflow-hidden"
					style={{ display: activeTab === "card-library" ? undefined : "none" }}
				>
					<HeadingExplorer />
				</div>
				<div
					data-tab-panel="article-viewer"
					className="flex-1 overflow-hidden"
					style={{ display: activeTab === "article-viewer" ? undefined : "none" }}
				>
					<ArticleViewerPanel
						requestedFilePath={pendingArticleFilePath}
						onFileOpened={handleFileOpened}
					/>
				</div>
				{children}
			</div>
		</SidebarActionsContext.Provider>
	);
}
