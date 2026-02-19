import type { CachedMetadata, TFile } from "obsidian";
import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "./use-app";

export interface FileMetadata {
	title: string;
	path: string;
	frontmatter: Record<string, unknown>;
}

export interface UseFileMetadataReturn {
	metadata: FileMetadata | null;
	refresh: () => void;
}

function extractFrontmatter(cache: CachedMetadata | null): Record<string, unknown> {
	if (!cache?.frontmatter) {
		return {};
	}
	const { position: _, ...rest } = cache.frontmatter;
	return rest;
}

function buildMetadata(file: TFile | null, cache: CachedMetadata | null): FileMetadata | null {
	if (!file) {
		return null;
	}
	return {
		title: file.basename,
		path: file.path,
		frontmatter: extractFrontmatter(cache),
	};
}

export function useFileMetadata(file: TFile | null): UseFileMetadataReturn {
	const { app } = useApp();
	const fileRef = useRef(file);
	fileRef.current = file;

	const getMetadata = useCallback((): FileMetadata | null => {
		if (!fileRef.current) {
			return null;
		}
		const cache = app.metadataCache.getFileCache(fileRef.current);
		return buildMetadata(fileRef.current, cache);
	}, [app.metadataCache]);

	const [metadata, setMetadata] = useState<FileMetadata | null>(() => getMetadata());

	useEffect(() => {
		setMetadata(getMetadata());

		if (!file) {
			return;
		}

		const ref = app.metadataCache.on("changed", (changedFile: TFile) => {
			if (changedFile === fileRef.current) {
				setMetadata(getMetadata());
			}
		});

		return () => {
			app.metadataCache.offref(ref);
		};
	}, [app.metadataCache, file, getMetadata]);

	const refresh = useCallback(() => {
		setMetadata(getMetadata());
	}, [getMetadata]);

	return { metadata, refresh };
}
