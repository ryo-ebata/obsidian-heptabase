const HEADING_PATTERN = /^(#{1,6}) /;

export interface SectionRange {
	contentStart: number;
	contentEnd: number;
}

export class ContentExtractor {
	extractContent(content: string, headingLine: number, headingLevel: number): string {
		return this.extractRange(content, headingLine + 1, headingLine, headingLevel);
	}

	extractContentWithHeading(content: string, headingLine: number, headingLevel: number): string {
		return this.extractRange(content, headingLine, headingLine, headingLevel);
	}

	getSectionRange(content: string, headingLine: number, headingLevel: number): SectionRange | null {
		const lines = content.split("\n");

		if (headingLine < 0 || headingLine >= lines.length) {
			return null;
		}

		const contentStart = headingLine + 1;
		const contentEnd = this.findNextHeadingLine(lines, contentStart, headingLevel);

		return { contentStart, contentEnd };
	}

	private extractRange(
		content: string,
		sliceStart: number,
		validationLine: number,
		headingLevel: number,
	): string {
		const lines = content.split("\n");

		if (validationLine < 0 || validationLine >= lines.length) {
			return "";
		}

		const endLine = this.findNextHeadingLine(lines, validationLine + 1, headingLevel);
		return lines.slice(sliceStart, endLine).join("\n").trim();
	}

	private findNextHeadingLine(lines: string[], startLine: number, headingLevel: number): number {
		for (let i = startLine; i < lines.length; i++) {
			const match = lines[i].match(HEADING_PATTERN);
			if (match && match[1].length <= headingLevel) {
				return i;
			}
		}
		return lines.length;
	}
}
