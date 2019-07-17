import * as path from 'path'
import * as vscode from 'vscode';
import { workspace, Disposable, ExtensionContext, window, Uri } from 'vscode';
import SettingsProvider from './SettingsProviders';

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from 'vscode-languageclient'

export function activate(context: ExtensionContext) {
  const serverModule = context.asAbsolutePath(path.join('server', 'out', 'server.js'))
  const debugOptions = { execArgv: ['--nolazy', '--inspect=6006'] }
  const settingsProvider = new SettingsProvider();
  const registration = Disposable.from(
    workspace.registerTextDocumentContentProvider('disassembly', settingsProvider)
  );

  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions
    }
  }

  const clientOptions: LanguageClientOptions = {
    documentSelector: [
      { scheme: 'file', language: 'asm' },
    ],
    synchronize: {
      configurationSection: ['Assembly'],
    }
  }

  const client = new LanguageClient('asm', '65816 SNES Assembly Language Server', serverOptions, clientOptions)

  const disposable = client.start()
  context.subscriptions.push(disposable, registration)


  let settingsUri = 'disassembly://my-extension/fake/path/to/settings';

            
}