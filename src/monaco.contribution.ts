/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import * as mode from './choicescriptMode';

import Emitter = monaco.Emitter;
import IEvent = monaco.IEvent;
import IDisposable = monaco.IDisposable;

// --- CSS configuration and defaults ---------

export class LanguageServiceDefaultsImpl implements monaco.languages.choicescript.LanguageServiceDefaults {

	private _onDidChange = new Emitter<monaco.languages.choicescript.LanguageServiceDefaults>();
	private _diagnosticsOptions: monaco.languages.choicescript.DiagnosticsOptions;
	private _languageId: string;

	constructor(languageId: string, diagnosticsOptions: monaco.languages.choicescript.DiagnosticsOptions) {
		this._languageId = languageId;
		this.setDiagnosticsOptions(diagnosticsOptions);
	}

	get onDidChange(): IEvent<monaco.languages.choicescript.LanguageServiceDefaults> {
		return this._onDidChange.event;
	}

	get languageId(): string {
		return this._languageId;
	}

	get diagnosticsOptions(): monaco.languages.choicescript.DiagnosticsOptions {
		return this._diagnosticsOptions;
	}

	setDiagnosticsOptions(options: monaco.languages.choicescript.DiagnosticsOptions): void {
		this._diagnosticsOptions = options || Object.create(null);
		this._onDidChange.fire(this);
	}
}

const diagnosticDefault: monaco.languages.choicescript.DiagnosticsOptions = {
	validate: true,
	lint: {
		compatibleVendorPrefixes: 'ignore',
		vendorPrefix: 'warning',
		duplicateProperties: 'warning',
		emptyRules: 'warning',
		importStatement: 'ignore',
		boxModel: 'ignore',
		universalSelector: 'ignore',
		zeroUnits: 'ignore',
		fontFaceProperties: 'warning',
		hexColorLength: 'error',
		argumentsInColorFunction: 'error',
		unknownProperties: 'warning',
		ieHack: 'ignore',
		unknownVendorSpecificProperties: 'ignore',
		propertyIgnoredDueToDisplay: 'warning',
		important: 'ignore',
		float: 'ignore',
		idSelector: 'ignore'
	}
}

const choicescriptDefaults = new LanguageServiceDefaultsImpl('choicescript', diagnosticDefault);

// Export API
function createAPI(): typeof monaco.languages.choicescript {
	return {
		choicescriptDefaults: choicescriptDefaults,
	}
}
monaco.languages.choicescript = createAPI();

// --- Registration to monaco editor ---

function getMode(): monaco.Promise<typeof mode> {
	return monaco.Promise.wrap(import('./choicescriptMode'))
}

monaco.languages.onLanguage('choicescript', () => {
	getMode().then(mode => mode.setupMode(choicescriptDefaults));
});
