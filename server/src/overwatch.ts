import { CompletionItem, MarkupContent, MarkupKind, TextDocument, Position, SymbolInformation, SymbolKind, CompletionItemKind, TextDocumentPositionParams, SignatureHelp, ParameterInformation, Location } from 'vscode-languageserver'
import * as asm from "./asm.json"

import { RAM } from "./Memory/RAM"
import { SRAM } from "./Memory/SRAM"
import { ROM } from "./Memory/ROM"
import { REG } from "./Memory/REG"
import { HIJACK } from "./Memory/HIJACK"
import { disassembly } from "./Memory/Disassembly"

var allMemory = [...RAM, ...ROM, ...SRAM,];
interface looseObj {
	[key: string]: any
}

var functionsRegExp = new RegExp(/\$[\dABCDEF]+|defaultslot|slotsize|slot|id|name|slowrom|lorom|hirom|cartridgetype|romsize|sramsize|country|licenseecode|version|cop|brk|abort|nmi|irq|reset|irqbrk|semifree|header_off|force|DEFAULTSLOT|SLOTSIZE|SLOT|ID|NAME|SLOWROM|LOROM|HIROM|CARTRIDGETYPE|ROMSIZE|SRAMSIZE|COUNTRY|LICENSEECODE|VERSION|ABORT|NMI|IRQ|RESET|IRQBRK|SEMIFREE|HEADER_OFF|FORCE|ADC|AND|ASL|BCC|BCS|BEQ|BIT|BMI|BNE|BPL|BRA|BRK|BRL|BVC|BVS|CLC|CLD|CLI|CLV|CMP|COP|CPX|CPY|DEC|DEX|DEY|EOR|INC|INX|INY|JML|JMP|JSL|JSR|LDA|LDX|LDY|LSR|MVN|MVP|NOP|ORA|PEA|PEI|PER|PHA|PHB|PHD|PHK|PHP|PHX|PHY|PLA|PLB|PLD|PLP|PLX|PLY|REP|ROL|ROR|RTI|RTL|RTS|SBC|SEC|SED|SEI|SEP|STA|STP|STX|STY|STZ|TAX|TAY|TCD|TCS|TDC|TRB|TSB|TSC|TSX|TXA|TXS|TXY|TYA|TYX|WAI|WDM|XBA|XCE/g)
var ramRegExp = new RegExp(/\$[\dABCDEF]+/g)

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

export function resolveDefinitions(pos: Position, doc: TextDocument): Location[] {

	var text = doc.getText({
		start: { line: pos.line, character: 0 },
		end: { line: pos.line, character: 99999 }
	})

	var matches = []
	do {
		var m = ramRegExp.exec(text);
		if(m==null) break;
		matches.push({
			match: m[0],
			index: m.index
		})
	} while (m);
	if(!matches[0]) {return []}

	var searchTerm = new RegExp(matches[0].match.substr(1,6), 'g')
	var locations = []
	do {
		var m = searchTerm.exec(disassembly);
		if(m==null) break;
		locations.push({
			match: m[0],
			index: m.index
		})
	} while (m);
	if(!locations[0]){return []};
	
	var searchable = TextDocument.create(
		'test',
		'asm',
		0,
		disassembly
	)

	/*
var locationsMapped = locations.map((d) => {
		return {
			line: disassembly.substring(0, d.index).split('\n').length - 363,
			character: 0
		}
	})
	//if(!locations[0]) {return []}

	*/
	var lengthOf = disassembly.split('\n').length;
	var dontcrashlol = disassembly.substr(0,10000);
	var locationsMapped = locations.map((d) => searchable.positionAt(d.index))
	//if(!locations[0]) {return []}


	return locationsMapped.map((d) => { return {
			uri: "disassembly://Disassembly.asm",
			range: {
				start: {line: d.line + 363, character:0},
				end: {line: d.line + 363, character:0},
			}
		}
	}
)
}


export function hoverHandler(pos: Position, doc: TextDocument): string | MarkupContent {
	console.log("hoverin")
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


		var ramMatch = allMemory.find((r) => r.beginsAt <= parseInt("0x" + match.substr(1,6)) && r.endsAt >= parseInt("0x" + match.substr(1,6)))


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
		var r = Opcodes.find((d)=>d.label == match);
		if(r == null) {return ""};
		var label = r.label;

		var docKey = Object.keys(asm.docs).filter((d) => d.includes(label))[0];
		//@ts-ignore
		var docs = asm.docs[docKey]

		if(r.detail) {
			let markdown: MarkupContent = {
				kind: MarkupKind.Markdown,
				value: [
					r.detail,
					`\n---`,
					docs
				].join(`\n`)
			};
			return markdown
		}

		return r.detail as string
	}
}

export function resolveSymbols(uri: string, doc: TextDocument): SymbolInformation[] {
	var text = doc.getText({
		start: { line: 0, character: 0 },
		end: { line: 999999, character: 999999 }
	})

	var subRoutineRegExp = new RegExp(/^\w*:/gm)

	var matches = []
	do {
		var m = subRoutineRegExp.exec(text);
		if(m==null) break;

		matches.push({
			match: m[0],
			index: doc.positionAt(m.index)
		})
	} while (m);
	
	var Symbols = []
	var endIndex: Position = {character:999999, line:999999}

	for(var i = 0; i < matches.length; i++) {

		if(matches[i + 2] != undefined) {
			endIndex = matches[i + 1].index
		} else {
			var endIndex: Position = {character:999999, line:999999}
		}
		
		Symbols.push({
			name: matches[i].match,
			kind: SymbolKind.Function,
			location: {
				range: {
					start: matches[i].index,
					end: endIndex
				},
				uri: doc.uri
			}
		})

	}
	
	return Symbols;
}