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
} from 'vscode-languageserver'

import {
	TextDocument, Position, CompletionList, Range, SymbolInformation, Diagnostic,
	TextEdit, FormattingOptions, MarkedString, DocumentSymbol, MarkupContent, MarkupKind, DocumentSymbolParams, SymbolKind, SignatureHelp
} from 'vscode-languageserver-types';

import { getCompletionItems, hoverHandler} from './overwatch'

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
		completionProvider: {
			resolveProvider: true
		}
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

documents.listen(connection)

connection.listen()