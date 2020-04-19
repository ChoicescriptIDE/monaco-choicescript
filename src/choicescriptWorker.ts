/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import Thenable = monaco.Thenable;
import IWorkerContext = monaco.worker.IWorkerContext;

import * as choicescriptService from 'vscode-css-languageservice';

export class ChoiceScriptWorker {

	// --- model sync -----------------------

	private _ctx: IWorkerContext;
	private _languageService: choicescriptService.LanguageService;
	private _languageSettings: choicescriptService.LanguageSettings;
	private _languageId: string;

	constructor(ctx: IWorkerContext, createData: ICreateData) {
		this._ctx = ctx;
		this._languageSettings = createData.languageSettings;
		this._languageId = createData.languageId;
		switch (this._languageId) {
			case 'choicescript':
				this._languageService = choicescriptService.getCSSLanguageService();
				break;
			default:
				throw new Error('Invalid language id: ' + this._languageId);
		}
		this._languageService.configure(this._languageSettings);
	}

	// --- language service host ---------------

	doValidation(uri: string): Thenable<choicescriptService.Diagnostic[]> {
		let document = this._getTextDocument(uri);
		if (document) {
			let scene = this._languageService.parseScene(document);
			let check = this._languageService.doValidation(document, scene, this._languageSettings);
			return Promise.resolve(check)
		}
		return Promise.resolve([]);
	}
	doComplete(uri: string, position: choicescriptService.Position): Thenable<choicescriptService.CompletionList> {
		let document = this._getTextDocument(uri);
		let scene = this._languageService.parseScene(document);
		let completions = this._languageService.doComplete(document, position, scene);
		return Promise.resolve(completions);
	}
	doHover(uri: string, position: choicescriptService.Position): Thenable<choicescriptService.Hover> {
		let document = this._getTextDocument(uri);
		let scene = this._languageService.parseScene(document);
		let hover = this._languageService.doHover(document, position, scene);
		return Promise.resolve(hover);
	}
	findDefinition(uri: string, position: choicescriptService.Position): Thenable<choicescriptService.Location> {
		let document = this._getTextDocument(uri);
		let scene = this._languageService.parseScene(document);
		let definition = this._languageService.findDefinition(document, position, scene);
		return Promise.resolve(definition);
	}
	/*findReferences(uri: string, position: choicescriptService.Position): Thenable<choicescriptService.Location[]> {
		let document = this._getTextDocument(uri);
		let stylesheet = this._languageService.parseScene(document);
		let references = this._languageService.findReferences(document, position, stylesheet);
		return Promise.resolve(references);
	}
	findDocumentHighlights(uri: string, position: choicescriptService.Position): Thenable<choicescriptService.DocumentHighlight[]> {
		let document = this._getTextDocument(uri);
		let stylesheet = this._languageService.parseScene(document);
		let highlights = this._languageService.findDocumentHighlights(document, position, stylesheet);
		return Promise.resolve(highlights);
	}*/
	findDocumentSymbols(uri: string): Thenable<choicescriptService.SymbolInformation[]> {
		let document = this._getTextDocument(uri);
		let scene = this._languageService.parseScene(document);
		let symbols = this._languageService.findDocumentSymbols(document, scene);
		return Promise.resolve(symbols);
	}
	doCodeActions(uri: string, range: choicescriptService.Range, context: choicescriptService.CodeActionContext): Thenable<choicescriptService.Command[]> {
		let document = this._getTextDocument(uri);
		let stylesheet = this._languageService.parseScene(document);
		let actions = this._languageService.doCodeActions(document, range, context, stylesheet);
		return Promise.resolve(actions);
	}
	/*findDocumentColors(uri: string): Thenable<choicescriptService.ColorInformation[]> {
		let document = this._getTextDocument(uri);
		let stylesheet = this._languageService.parseScene(document);
		let colorSymbols = this._languageService.findDocumentColors(document, stylesheet);
		return Promise.resolve(colorSymbols);
	}
	getColorPresentations(uri: string, color: choicescriptService.Color, range: choicescriptService.Range): Thenable<choicescriptService.ColorPresentation[]> {
		let document = this._getTextDocument(uri);
		let stylesheet = this._languageService.parseScene(document);
		let colorPresentations = this._languageService.getColorPresentations(document, stylesheet, color, range);
		return Promise.resolve(colorPresentations);
	}
	getFoldingRanges(uri: string, context?: { rangeLimit?: number; }): Thenable<choicescriptService.FoldingRange[]> {
		let document = this._getTextDocument(uri);
		let ranges = this._languageService.getFoldingRanges(document, context);
		return Promise.resolve(ranges);
	}
	getSelectionRanges(uri: string, positions: choicescriptService.Position[]): Thenable<choicescriptService.SelectionRange[]> {
		let document = this._getTextDocument(uri);
		let stylesheet = this._languageService.parseScene(document);
		let ranges = this._languageService.getSelectionRanges(document, positions, stylesheet);
		return Promise.resolve(ranges);
	}
	doRename(uri: string, position: choicescriptService.Position, newName: string): Thenable<choicescriptService.WorkspaceEdit> {
		let document = this._getTextDocument(uri);
		let stylesheet = this._languageService.parseScene(document);
		let renames = this._languageService.doRename(document, position, newName, stylesheet);
		return Promise.resolve(renames);
	}*/
	private _getTextDocument(uri: string): choicescriptService.TextDocument {
		console.log(uri);
		let models = this._ctx.getMirrorModels();
		for (let model of models) {
			if (model.uri.toString() === uri) {
				return choicescriptService.TextDocument.create(uri, this._languageId, model.version, model.getValue());
			}
		}
		return null;
	}
	private _getStartupTextDocument(uri: string): choicescriptService.TextDocument {
		return this._getTextDocument("startup");
	}
}

export interface ICreateData {
	languageId: string;
	languageSettings: choicescriptService.LanguageSettings;
}

export function create(ctx: IWorkerContext, createData: ICreateData): ChoiceScriptWorker {
	return new ChoiceScriptWorker(ctx, createData);
}
