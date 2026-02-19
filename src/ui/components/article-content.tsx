import { useApp } from "@/ui/hooks/use-app";
import { Component, MarkdownRenderer } from "obsidian";
import type React from "react";
import { useEffect, useRef } from "react";

interface ArticleContentProps {
	content: string;
	filePath: string;
	contentRef: React.RefObject<HTMLDivElement | null>;
}

export function ArticleContent({
	content,
	filePath,
	contentRef,
}: ArticleContentProps): React.ReactElement {
	const { app } = useApp();
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = containerRef.current;
		if (!el || !content) {
			return;
		}

		el.innerHTML = "";
		const component = new Component();
		MarkdownRenderer.render(app, content, el, filePath, component);

		return () => {
			el.innerHTML = "";
		};
	}, [app, content, filePath]);

	return (
		<div
			ref={(node) => {
				(containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
				(contentRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
			}}
			className="markdown-rendered p-2 flex-1 overflow-y-auto"
		/>
	);
}
