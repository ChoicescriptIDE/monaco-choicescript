/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import * as mode from './choicescriptMode';

import Emitter = monaco.Emitter;
import IEvent = monaco.IEvent;

// --- CSS configuration and defaults ---------

export class LanguageServiceDefaultsImpl implements monaco.languages.choicescript.LanguageServiceDefaults {

	private _onDidChange = new Emitter<monaco.languages.choicescript.LanguageServiceDefaults>();
	private _diagnosticsOptions: monaco.languages.choicescript.DiagnosticsOptions;
	private _modeConfiguration: monaco.languages.choicescript.ModeConfiguration;
	private _languageId: string;

	constructor(languageId: string, diagnosticsOptions: monaco.languages.choicescript.DiagnosticsOptions, modeConfiguration: monaco.languages.choicescript.ModeConfiguration) {
		this._languageId = languageId;
		this.setDiagnosticsOptions(diagnosticsOptions);
		this.setModeConfiguration(modeConfiguration);		
	}

	get onDidChange(): IEvent<monaco.languages.choicescript.LanguageServiceDefaults> {
		return this._onDidChange.event;
	}

	get languageId(): string {
		return this._languageId;
	}

	get modeConfiguration(): monaco.languages.choicescript.ModeConfiguration {
		return this._modeConfiguration;
	}

	get diagnosticsOptions(): monaco.languages.choicescript.DiagnosticsOptions {
		return this._diagnosticsOptions;
	}

	setDiagnosticsOptions(options: monaco.languages.choicescript.DiagnosticsOptions): void {
		this._diagnosticsOptions = options || Object.create(null);
		this._onDidChange.fire(this);
	}

	setModeConfiguration(modeConfiguration: monaco.languages.choicescript.ModeConfiguration): void {
		this._modeConfiguration = modeConfiguration || Object.create(null);
		this._onDidChange.fire(this);
	};

}

export interface ModeConfiguration {
	/**
	 * Defines whether the built-in documentFormattingEdit provider is enabled.
	 */
	readonly documentFormattingEdits?: boolean;

	/**
	 * Defines whether the built-in documentRangeFormattingEdit provider is enabled.
	 */
	readonly documentRangeFormattingEdits?: boolean;

	/**
	 * Defines whether the built-in completionItemProvider is enabled.
	 */
	readonly completionItems?: boolean;

	/**
	 * Defines whether the built-in hoverProvider is enabled.
	 */
	readonly hovers?: boolean;

	/**
	 * Defines whether the built-in documentSymbolProvider is enabled.
	 */
	readonly documentSymbols?: boolean;

	/**
	 * Defines whether the built-in tokens provider is enabled.
	 */
	readonly tokens?: boolean;

	/**
	 * Defines whether the built-in color provider is enabled.
	 */
	readonly colors?: boolean;

	/**
	 * Defines whether the built-in foldingRange provider is enabled.
	 */
	readonly foldingRanges?: boolean;

	/**
	 * Defines whether the built-in diagnostic provider is enabled.
	 */
	readonly diagnostics?: boolean;

	/**
	 * Defines whether the built-in selection range provider is enabled.
	 */
	readonly selectionRanges?: boolean;

}

const diagnosticDefault: Required<monaco.languages.choicescript.DiagnosticsOptions> = {
	// Generally try to disable things by default
	// when we're using CSIDE but enable otherwise
	// for ease of testing.
	validate: (typeof (<any>window).cside !== "undefined") ? false : true,
	spellCheckSettings: {
		rootPath: (typeof (<any>window).cside !== "undefined") ? "" : "https://raw.githubusercontent.com/ChoicescriptIDE/main/latest/source/lib/typo/dictionaries/",
		enabled: (typeof (<any>window).cside !== "undefined") ? false : true,
		dictionary: "en_US",
		userDictionaries: {
			persistent: {},
			session: {}
		}
	},
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

const modeConfigurationDefault: Required<monaco.languages.choicescript.ModeConfiguration> = {
	completionItems: true,
	hovers: true,
	documentSymbols: true,
	definitions: false,
	references: false,
	documentHighlights: false,
	rename: false,
	colors: false,
	foldingRanges: false,
	diagnostics: true,
	selectionRanges: false
}

const choicescriptDefaults = new LanguageServiceDefaultsImpl('choicescript', diagnosticDefault, modeConfigurationDefault);

// Export API
function createAPI(): typeof monaco.languages.choicescript {
	return {
		choicescriptDefaults: choicescriptDefaults,
	}
}
monaco.languages.choicescript = createAPI();

// --- Registration to monaco editor ---

function getMode(): Promise<typeof mode> {
	return import('./choicescriptMode');
}

monaco.languages.onLanguage('choicescript', () => {
	getMode().then(mode => mode.setupMode(choicescriptDefaults));
});
