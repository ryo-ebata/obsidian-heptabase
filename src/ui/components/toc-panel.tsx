import type { ParsedHeading } from "@/types/plugin";
import { useHeadings } from "@/ui/hooks/use-headings";
import type { TFile } from "obsidian";
import type React from "react";

interface TocPanelProps {
	activeFile: TFile | null;
}

export function TocPanel({ activeFile }: TocPanelProps): React.ReactElement {
	if (!activeFile) {
		return (
			<div className="p-2 h-full overflow-y-auto">
				<div className="text-ob-muted text-center p-5 text-ob-ui-small">No file open</div>
			</div>
		);
	}

	return (
		<div className="p-2 h-full overflow-y-auto">
			<div className="px-2 py-1 font-semibold mb-1">{activeFile.basename}</div>
			<TocHeadingList file={activeFile} />
		</div>
	);
}

function TocHeadingList({ file }: { file: TFile }): React.ReactElement {
	const headings = useHeadings(file);

	if (headings.length === 0) {
		return <div className="text-ob-muted text-center p-5 text-ob-ui-small">No headings found</div>;
	}

	return (
		<ul className="list-none p-0 m-0">
			{headings.map((heading) => (
				<li key={`${heading.position.start.line}-${heading.heading}`}>
					<TocHeadingItem heading={heading} />
				</li>
			))}
		</ul>
	);
}

function TocHeadingItem({ heading }: { heading: ParsedHeading }): React.ReactElement {
	return (
		<div
			className="px-2 py-0.5 cursor-pointer rounded truncate hover:bg-ob-hover"
			style={{ paddingLeft: `${(heading.level - 1) * 16}px` }}
		>
			{heading.heading}
		</div>
	);
}
