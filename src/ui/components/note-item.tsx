import type { ParsedHeading } from "@/types/plugin";
import { HeadingItem } from "@/ui/components/heading-item";
import type { TFile } from "obsidian";
import type React from "react";
import { useCallback, useState } from "react";

interface NoteItemProps {
	file: TFile;
	headings: ParsedHeading[];
}

export function NoteItem({ file, headings }: NoteItemProps): React.ReactElement {
	const [expanded, setExpanded] = useState(false);

	const toggleExpanded = useCallback(() => {
		setExpanded((prev) => !prev);
	}, []);

	return (
		<div className="heading-explorer-note">
			<div
				className="heading-explorer-note-title"
				onClick={toggleExpanded}
				onKeyDown={(e) => {
					if (e.key === "Enter" || e.key === " ") {
						toggleExpanded();
					}
				}}
			>
				<span className={`collapse-icon${expanded ? "" : " is-collapsed"}`}>{"\u25BC"}</span>
				<span>{file.basename}</span>
			</div>
			{expanded && (
				<ul className="heading-explorer-headings">
					{headings.map((heading) => (
						<li key={`${heading.position.start.line}-${heading.heading}`}>
							<HeadingItem heading={heading} filePath={file.path} />
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
