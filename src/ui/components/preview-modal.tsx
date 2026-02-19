import type { PreviewSection } from "@/ui/hooks/use-preview";
import type React from "react";

interface PreviewModalProps {
	isOpen: boolean;
	sections: PreviewSection[];
	onToggleSection: (index: number) => void;
	onConfirm: () => void;
	onCancel: () => void;
}

export function PreviewModal({
	isOpen,
	sections,
	onToggleSection,
	onConfirm,
	onCancel,
}: PreviewModalProps): React.ReactElement | null {
	if (!isOpen) {
		return null;
	}

	return (
		<div className="fixed inset-0 flex items-center justify-center z-50">
			<div className="bg-ob-hover rounded p-4 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
				<h3 className="font-medium mb-3">Preview Extracted Sections</h3>
				<div className="flex flex-col gap-3">
					{sections.map((section, index) => (
						<div
							key={`${section.item.filePath}:${section.item.headingLine}`}
							className={`border border-ob-border rounded p-3 ${section.included ? "" : "opacity-50"}`}
						>
							<label className="flex items-center gap-2 font-medium mb-1 cursor-pointer">
								<input
									type="checkbox"
									checked={section.included}
									onChange={() => onToggleSection(index)}
								/>
								{section.item.headingText}
							</label>
							<pre className="text-ob-ui-small text-ob-muted whitespace-pre-wrap m-0">
								{section.content.split("\n").slice(2).join("\n").trim()}
							</pre>
						</div>
					))}
				</div>
				<div className="flex justify-end gap-2 mt-4">
					<button type="button" className="px-3 py-1 rounded hover:bg-ob-border" onClick={onCancel}>
						Cancel
					</button>
					<button
						type="button"
						className="px-3 py-1 rounded bg-ob-accent text-white"
						onClick={onConfirm}
					>
						Create
					</button>
				</div>
			</div>
		</div>
	);
}
