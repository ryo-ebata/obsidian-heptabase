import { HeadingParser } from "@/services/heading-parser";
import type { ParsedHeading } from "@/types/plugin";
import { useApp } from "@/ui/hooks/use-app";
import type { TFile } from "obsidian";
import { useMemo } from "react";

export function useHeadings(file: TFile): ParsedHeading[] {
	const { app } = useApp();
	const parser = useMemo(() => new HeadingParser(app), [app]);
	return useMemo(() => parser.getHeadings(file), [parser, file]);
}
