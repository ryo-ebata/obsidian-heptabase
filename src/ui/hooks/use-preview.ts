import type { HeadingDragData } from "@/types/plugin";
import { useCallback, useRef, useState } from "react";

export interface PreviewSection {
	item: HeadingDragData;
	content: string;
	included: boolean;
}

export interface UsePreviewReturn {
	isPreviewOpen: boolean;
	previewSections: PreviewSection[];
	openPreview: (
		items: HeadingDragData[],
		contents: string[],
		onConfirm: (selectedIndices: number[]) => void,
		onCancel: () => void,
	) => void;
	closePreview: () => void;
	toggleSection: (index: number) => void;
	confirmAndExecute: () => void;
}

export function usePreview(): UsePreviewReturn {
	const [isPreviewOpen, setIsPreviewOpen] = useState(false);
	const [previewSections, setPreviewSections] = useState<PreviewSection[]>([]);
	const callbacksRef = useRef<{
		onConfirm: (selectedIndices: number[]) => void;
		onCancel: () => void;
	} | null>(null);

	const openPreview = useCallback(
		(
			items: HeadingDragData[],
			contents: string[],
			onConfirm: (selectedIndices: number[]) => void,
			onCancel: () => void,
		) => {
			const sections = items.map((item, i) => ({
				item,
				content: contents[i],
				included: true,
			}));
			setPreviewSections(sections);
			callbacksRef.current = { onConfirm, onCancel };
			setIsPreviewOpen(true);
		},
		[],
	);

	const closePreview = useCallback(() => {
		callbacksRef.current?.onCancel();
		callbacksRef.current = null;
		setIsPreviewOpen(false);
		setPreviewSections([]);
	}, []);

	const toggleSection = useCallback((index: number) => {
		setPreviewSections((prev) =>
			prev.map((section, i) =>
				i === index ? { ...section, included: !section.included } : section,
			),
		);
	}, []);

	const confirmAndExecute = useCallback(() => {
		const selectedIndices = previewSections.reduce<number[]>((acc, section, i) => {
			if (section.included) {
				acc.push(i);
			}
			return acc;
		}, []);
		callbacksRef.current?.onConfirm(selectedIndices);
		callbacksRef.current = null;
		setIsPreviewOpen(false);
		setPreviewSections([]);
	}, [previewSections]);

	return {
		isPreviewOpen,
		previewSections,
		openPreview,
		closePreview,
		toggleSection,
		confirmAndExecute,
	};
}
