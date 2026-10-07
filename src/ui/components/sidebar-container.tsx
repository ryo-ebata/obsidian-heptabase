import type { SidebarTab } from "@/types/plugin";
import {
	ArticleViewerPanel,
	type ArticleViewerPanelHandle,
} from "@/ui/components/article-viewer-panel";
import { CanvasSearchPanel } from "@/ui/components/canvas-search-panel";
import { HeadingExplorer } from "@/ui/components/heading-explorer";
import { SidebarTabs } from "@/ui/components/sidebar-tabs";
import { SidebarActionsContext } from "@/ui/context";
import { CanvasStateProvider } from "@/ui/hooks/use-canvas-state";
import type React from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";

interface SidebarContainerProps {
	children?: React.ReactNode;
}

export interface SidebarContainerHandle {
	openFile: (filePath: string, options?: { focusTitle?: boolean }) => void;
}

export const SidebarContainer = forwardRef<SidebarContainerHandle, SidebarContainerProps>(
	function SidebarContainerInner({ children }, ref): React.ReactElement {
		const [activeTab, setActiveTab] = useState<SidebarTab>("card-library");
		const panelRef = useRef<ArticleViewerPanelHandle>(null);

		const handleTabChange = useCallback((tab: SidebarTab) => {
			setActiveTab(tab);
		}, []);

		const openInArticle = useCallback((filePath: string, options?: { focusTitle?: boolean }) => {
			setActiveTab("article-viewer");
			panelRef.current?.selectFile(filePath, options);
		}, []);

		useImperativeHandle(ref, () => ({ openFile: openInArticle }), [openInArticle]);

		return (
			<SidebarActionsContext.Provider value={{ openInArticle }}>
				<CanvasStateProvider>
					<div className="heptabase-shell h-full flex flex-col">
						<SidebarTabs activeTab={activeTab} onTabChange={handleTabChange} />
						<div
							id="heptabase-panel-card-library"
							role="tabpanel"
							aria-labelledby="heptabase-tab-card-library"
							aria-hidden={activeTab !== "card-library"}
							tabIndex={0}
							data-tab-panel="card-library"
							className="flex-1 overflow-hidden"
							style={{ display: activeTab === "card-library" ? undefined : "none" }}
						>
							<HeadingExplorer />
						</div>
						<div
							id="heptabase-panel-article-viewer"
							role="tabpanel"
							aria-labelledby="heptabase-tab-article-viewer"
							aria-hidden={activeTab !== "article-viewer"}
							tabIndex={0}
							data-tab-panel="article-viewer"
							className="flex-1 overflow-hidden"
							style={{ display: activeTab === "article-viewer" ? undefined : "none" }}
						>
							<ArticleViewerPanel ref={panelRef} />
						</div>
						<div
							id="heptabase-panel-canvas-search"
							role="tabpanel"
							aria-labelledby="heptabase-tab-canvas-search"
							aria-hidden={activeTab !== "canvas-search"}
							tabIndex={0}
							data-tab-panel="canvas-search"
							className="flex-1 overflow-hidden"
							style={{ display: activeTab === "canvas-search" ? undefined : "none" }}
						>
							<CanvasSearchPanel />
						</div>
						{children}
					</div>
				</CanvasStateProvider>
			</SidebarActionsContext.Provider>
		);
	},
);
