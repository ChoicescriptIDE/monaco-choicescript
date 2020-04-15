/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import Thenable = monaco.Thenable;
import Promise = monaco.Promise;
import IWorkerContext = monaco.worker.IWorkerContext;

import * as choicescriptService from 'vscode-css-languageservice';
import * as ls from 'vscode-languageserver-types';

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

	doValidation(uri: string): Thenable<ls.Diagnostic[]> {
		let document = this._getTextDocument(uri);
		if (document) {
			let scene = this._languageService.parseScene(document);
			let check = this._languageService.doValidation(document, scene, this._languageSettings);
			return Promise.as(check)
		}
		return Promise.as([]);
	}
	findDefinition(uri: string, position: ls.Position): Thenable<ls.Location> {
		let document = this._getTextDocument(uri);
		let scene = this._languageService.parseScene(document);
		let definition = this._languageService.findDefinition(document, position, scene);
		return Promise.as(definition);
	}
	findDocumentSymbols(uri: string): Thenable<ls.SymbolInformation[]> {
		let document = this._getTextDocument(uri);
		let scene = this._languageService.parseScene(document);
		let symbols = this._languageService.findDocumentSymbols(document, scene);
		return Promise.as(symbols);
	}
	doComplete(uri: string, position: ls.Position): Thenable<ls.CompletionList> {
		let document = this._getTextDocument(uri);
		let scene = this._languageService.parseScene(document);
		let completions = this._languageService.doComplete(document, position, scene);
		return Promise.as(completions);
	}
	doHover(uri: string, position: ls.Position): Thenable<ls.Hover> {
		let document = this._getTextDocument(uri);
		let scene = this._languageService.parseScene(document);
		let hover = this._languageService.doHover(document, position, scene);
		return Promise.as(hover);
	}
	private _getTextDocument(uri: string): ls.TextDocument {
		console.log(uri);
		let models = this._ctx.getMirrorModels();
		for (let model of models) {
			if (model.uri.toString() === uri) {
				return ls.TextDocument.create(uri, this._languageId, model.version, model.getValue());
			}
		}
		return null;
	}
	private _getStartupTextDocument(uri: string): ls.TextDocument {
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