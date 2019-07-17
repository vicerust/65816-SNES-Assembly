import {
	IPCMessageReader,
	IPCMessageWriter,
	createConnection,
	IConnection,
	TextDocuments,
	InitializeResult,
	TextDocumentPositionParams,
	CompletionItem,
	CompletionItemKind,
	TextDocumentSyncKind,
	Hover,
	CancellationToken,
	CompletionParams,
	CodeLensParams,
} from 'vscode-languageserver'

import {
	TextDocument, Position, CompletionList, Range, SymbolInformation, Diagnostic,
	TextEdit, FormattingOptions, MarkedString, DocumentSymbol, MarkupContent, MarkupKind, DocumentSymbolParams, SymbolKind, SignatureHelp, CodeLens, Location, WorkspaceChange
} from 'vscode-languageserver-types';

import { getCompletionItems, hoverHandler, resolveSymbols, resolveDefinitions} from './overwatch'

const connection: IConnection = createConnection(	
	new IPCMessageReader(process),
	new IPCMessageWriter(process)
  )

var documents: TextDocuments = new TextDocuments();
  
const completionItems = getCompletionItems();

connection.onInitialize((params): InitializeResult => {
	return {
	  capabilities: {
		textDocumentSync: documents.syncKind,
		hoverProvider: true,
		documentSymbolProvider: true,
		completionProvider: {
			resolveProvider: true
		},
        definitionProvider : true
	  }
	}
})
  

documents.onDidChangeContent((change) => {
	console.log(change);
})
connection.onDidChangeWatchedFiles(change => {
	console.log('didChangeWatchedFiles')
})


connection.onCompletion(
	(params: CompletionParams): CompletionItem[] => {
		return completionItems;
	}
)


connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
	return item;
})

connection.onHover(
	(params: TextDocumentPositionParams): Hover => {
		let doc = documents.get(params.textDocument.uri);
		if (doc == null) {return {contents:""}}

		let pos = params.position;
	
		var contents = hoverHandler(pos, doc);
		
		
		return {
			contents: contents
		}
	}
)


connection.onDocumentSymbol((params: DocumentSymbolParams) : SymbolInformation[] => {
	var doc = documents.get(params.textDocument.uri);
	if(doc==null) {return []}

	var symbols = resolveSymbols(params.textDocument.uri, doc)
	return symbols;
})


connection.onDefinition((params: TextDocumentPositionParams): Location[] => {
	var doc = documents.get(params.textDocument.uri);
	if(doc==null) {return []}

	return resolveDefinitions(params.position, doc);
})

documents.listen(connection)

connection.listen()