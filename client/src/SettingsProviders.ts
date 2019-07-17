'use strict';
import * as vscode from 'vscode';
import { TextDocumentContentProvider, Uri } from 'vscode';
const fs = require('fs');

export default class SettingsProvider implements TextDocumentContentProvider {
      /**
       *
       * @param {vscode.Uri} uri - a fake uri
       * @returns {string} - settings read from the JSON file
       **/
    public provideTextDocumentContent (uri : Uri) : string {
        let settingsFilePath = vscode.extensions.getExtension('vicerust.snes-asm').extensionPath + "/server/src/Memory/Disassembly.asm";
        let returnString : string;


		// read settings file
        if (fs.existsSync (settingsFilePath)) {
            returnString = fs.readFileSync(settingsFilePath).toString()
        }

        // return JSON object as a string
        return returnString
    }
}