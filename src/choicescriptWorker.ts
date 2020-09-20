/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type { worker } from './fillers/monaco-editor-core';
import * as choicescriptService from 'vscode-choicescript-languageservice';

export class ChoiceScriptWorker {
	// --- model sync -----------------------

	private _ctx: worker.IWorkerContext;
	private _languageService: choicescriptService.LanguageService;
	private _languageSettings: choicescriptService.LanguageSettings;
	private _csLanguageService: choicescriptService.ChoiceScriptLanguageService;
	private _cslanguageSettings: choicescriptService.ChoiceScriptLanguageSettings;
	private _languageId: string;

	constructor(ctx: worker.IWorkerContext, createData: ICreateData) {
		this._ctx = ctx;
		this._languageSettings = createData.languageSettings;
		this._cslanguageSettings = createData.languageSettings;
		this._languageId = createData.languageId;
		switch (this._languageId) {
			case 'css':
				this._languageService = choicescriptService.getCSSLanguageService();
				this._languageService.configure(this._languageSettings);
				break;
			case 'less':
				this._languageService = choicescriptService.getLESSLanguageService();
				this._languageService.configure(this._languageSettings);
				break;
			case 'scss':
				this._languageService = choicescriptService.getSCSSLanguageService();
				this._languageService.configure(this._languageSettings);
				break;
			case 'choicescript':
			case 'xml':
				this._languageService = choicescriptService.getCSSLanguageService();
				this._languageService.configure(this._languageSettings);
				this._csLanguageService = choicescriptService.getChoiceScriptLanguageService();
				this._csLanguageService.configure(this._cslanguageSettings);
				break;
			default:
				throw new Error('Invalid language id: ' + this._languageId);
		}
	}

	doComplete() {
		return Promise.resolve('hello world');
	}

	doValidation() {
		return Promise.resolve('hello validation');
	}

	async doHover(
		uri: string,
		position: choicescriptService.Position
	): Promise<choicescriptService.Hover> {
		let document = this._getTextDocument(uri);
		let stylesheet = this._csLanguageService.parseScene(document);
		let hover = this._csLanguageService.doHover(document, position, stylesheet);
		return Promise.resolve(hover);
	}

	async doValidation3(uri: string): Promise<choicescriptService.Diagnostic[]> {
		let document = this._getTextDocument(uri);
		if (document) {
			let stylesheet = this._csLanguageService.parseScene(document);
			let diagnostics = this._csLanguageService.doValidation(document, stylesheet);
			return Promise.resolve(diagnostics);
		}
		return Promise.resolve([]);
	}

	private _getStartupTextDocument(): choicescriptService.TextDocument {
		let models = this._ctx.getMirrorModels();
		for (let model of models) {
			if (/\/startup\.txt$/.test(model.uri.toString())) {
				return choicescriptService.TextDocument.create(
					model.uri.toString(),
					this._languageId,
					model.version,
					model.getValue()
				);
			}
		}
		return null;
	}

	private _getProjectPath(uri: string) {
		return uri.slice(0, uri.lastIndexOf('/') + 1);
	}

	private _getTextDocument(uri: string): choicescriptService.TextDocument {
		let models = this._ctx.getMirrorModels();
		for (let model of models) {
			if (model.uri.toString() === uri) {
				return choicescriptService.TextDocument.create(
					uri,
					this._languageId,
					model.version,
					model.getValue()
				);
			}
		}
		return null;
	}

	private _getAllProjectTextDocuments(uri: string): choicescriptService.TextDocument[] {
		let docs = [];
		let projectPath = this._getProjectPath(uri);
		let models = this._ctx.getMirrorModels();
		for (let model of models) {
			if (this._getProjectPath(model.uri.toString()) === projectPath) {
				docs.push(
					choicescriptService.TextDocument.create(
						model.uri.toString(),
						this._languageId,
						model.version,
						model.getValue()
					)
				);
			}
		}
		return docs;
	}

	removeIndex(uri: string): void {
		this._csLanguageService.purgeProject(uri, [uri]);
	}

	updateIndex(uri: string): void {
		this._csLanguageService.updateProject(uri, [this._getTextDocument(uri)]);
	}

	async doComplete3(
		uri: string,
		position: choicescriptService.Position
	): Promise<choicescriptService.CompletionList> {
		let document = this._getTextDocument(uri);
		let stylesheet = this._csLanguageService.parseScene(document);
		let completions = this._csLanguageService.doComplete(document, position, stylesheet);
		return Promise.resolve(completions);
	}

	async findDefinition(
		uri: string,
		position: choicescriptService.Position
	): Promise<choicescriptService.Location> {
		let localDocument = this._getTextDocument(uri);
		let localScene = this._csLanguageService.parseScene(localDocument);
		let definition = this._csLanguageService.findDefinition(localDocument, position, localScene);
		return Promise.resolve(definition);
	}

	async findReferences(
		uri: string,
		position: choicescriptService.Position
	): Promise<choicescriptService.Location[]> {
		let document = this._getTextDocument(uri);
		let stylesheet = this._csLanguageService.parseScene(document);
		let references = this._csLanguageService.findReferences(document, position, stylesheet);
		return Promise.resolve(references);
	}

	async findDocumentSymbols(uri: string): Promise<choicescriptService.SymbolInformation[]> {
		let document = this._getTextDocument(uri);
		let scene = this._csLanguageService.parseScene(document);
		let symbols = this._csLanguageService.findDocumentSymbols(
			document,
			scene,
			false /* includeGlobals */
		);
		return Promise.resolve(symbols);
	}

	configure(settings: choicescriptService.ChoiceScriptLanguageSettings): void {
		this._csLanguageService.configure(settings);
	}
}
export interface ICreateData {
	languageId: string;
	languageSettings: choicescriptService.ChoiceScriptLanguageSettings;
}
export function create(ctx: worker.IWorkerContext, createData: ICreateData): ChoiceScriptWorker {
	return new ChoiceScriptWorker(ctx, createData);
}
