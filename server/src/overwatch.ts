import { CompletionItem, MarkupContent, MarkupKind, TextDocument, Position, SymbolInformation, SymbolKind, CompletionItemKind, TextDocumentPositionParams, SignatureHelp, ParameterInformation } from 'vscode-languageserver'
import * as asm from "./asm.json"
import { RAM } from "./RAM.js"

interface looseObj {
	[key: string]: any
}

var functionsRegExp = new RegExp(/\$[\dABCDEF]+|defaultslot|slotsize|slot|id|name|slowrom|lorom|hirom|cartridgetype|romsize|sramsize|country|licenseecode|version|cop|brk|abort|nmi|irq|reset|irqbrk|semifree|header_off|force|DEFAULTSLOT|SLOTSIZE|SLOT|ID|NAME|SLOWROM|LOROM|HIROM|CARTRIDGETYPE|ROMSIZE|SRAMSIZE|COUNTRY|LICENSEECODE|VERSION|ABORT|NMI|IRQ|RESET|IRQBRK|SEMIFREE|HEADER_OFF|FORCE|ADC|AND|ASL|BCC|BCS|BEQ|BIT|BMI|BNE|BPL|BRA|BRK|BRL|BVC|BVS|CLC|CLD|CLI|CLV|CMP|COP|CPX|CPY|DEC|DEX|DEY|EOR|INC|INX|INY|JML|JMP|JSL|JSR|LDA|LDX|LDY|LSR|MVN|MVP|NOP|ORA|PEA|PEI|PER|PHA|PHB|PHD|PHK|PHP|PHX|PHY|PLA|PLB|PLD|PLP|PLX|PLY|REP|ROL|ROR|RTI|RTL|RTS|SBC|SEC|SED|SEI|SEP|STA|STP|STX|STY|STZ|TAX|TAY|TCD|TCS|TDC|TRB|TSB|TSC|TSX|TXA|TXS|TXY|TYA|TYX|WAI|WDM|XBA|XCE/g)
var ramRegExp = new RegExp(/\$[\dABCDEF]/)

var Opcodes = asm.opcodes.map((d) => {
	return {
		label: Object.keys(d)[0],
		detail: Object.values(d)[0],
	}
})

var Syntax = asm.syntax.map((d) => {
	return {
		label: Object.keys(d)[0],
	}
})

export function getCompletionItems(): CompletionItem[] {
	return [...Syntax, ...Opcodes];
}


export function hoverHandler(pos: Position, doc: TextDocument): string | MarkupContent {
	var text = doc.getText({
		start: { line: pos.line, character: 0 },
		end: { line: pos.line, character: 99999 }
	})

	var matches = []
	var count = 0;
	do {
		var m = functionsRegExp.exec(text);
		if(m==null) break;
		if(count>5) break;

		matches.push({
			match: m[0],
			index: m.index
		})
		count += 1;
	} while (m);

	matches = matches.filter((d) => {
		return d.index < pos.character && pos.character < (d.index + d.match.length)
	})

	if(matches[0] == null) return "";
	var match = matches[0].match;
	
	if (match.match(ramRegExp) != null) {
		if (match.length == 5) { match = "$7E" + match.substr(1,4); }


		var ramMatch = RAM.find((r) => r.beginsAt <= parseInt("0x" + match.substr(1,6)) && r.endsAt >= parseInt("0x" + match.substr(1,6)))


		if(ramMatch) {
			let markdown: MarkupContent = {
				kind: MarkupKind.Markdown,
				value: [
					"Address: " + ramMatch.address,
					'\n---',
					"Length: " + ramMatch.length,
					'\n---',
					"Type: " + ramMatch.type,
					'\n---',
					ramMatch.descriptio,
				].join('\n')
			};

		return markdown
		} else {
			return "Could Not Parse RAM Address.";
		}
	} else {
		var r = Opcodes.find((d)=>d.label == match)
		if(!r) return "";

		if(r.detail) {
			let markdown: MarkupContent = {
				kind: MarkupKind.Markdown,
				value: r.detail
			};
			return markdown
		}

		return r.detail as string
	}
}