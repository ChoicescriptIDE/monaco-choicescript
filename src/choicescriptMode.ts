/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { WorkerManager } from './workerManagerChoiceScript';
import type { ChoiceScriptWorker } from './choicescriptWorker';
import { LanguageServiceDefaultsChoiceScript } from './monaco.contribution';
import * as languageFeatures from './languageFeaturesChoiceScript';
import { Uri, IDisposable, languages, Range } from './fillers/monaco-editor-core';

export function setupMode(defaults: LanguageServiceDefaultsChoiceScript): IDisposable {
	const disposables: IDisposable[] = [];
	const providers: IDisposable[] = [];

	const client = new WorkerManager(defaults);
	disposables.push(client);

	const worker: languageFeatures.WorkerAccessor = (...uris: Uri[]): Promise<ChoiceScriptWorker> => {
		return client.getLanguageServiceWorker(...uris);
	};

	function registerProviders(): void {
		const { languageId, modeConfiguration } = defaults;

		disposeAll(providers);

		if (modeConfiguration.completionItems) {
			providers.push(
				languages.registerCompletionItemProvider(
					languageId,
					new languageFeatures.CompletionAdapter(worker)
				)
			);
		}
		if (modeConfiguration.hovers) {
			providers.push(
				languages.registerHoverProvider(languageId, new languageFeatures.HoverAdapter(worker))
			);
		}
		if (false) {
			/*providers.push(
				languages.registerDocumentHighlightProvider(
					languageId,
					new languageFeatures.DocumentHighlightAdapter(worker)
				)
			);*/
		}
		if (modeConfiguration.definitions) {
			providers.push(
				languages.registerDefinitionProvider(
					languageId,
					new languageFeatures.DefinitionAdapter(worker)
				)
			);
		}
		if (modeConfiguration.references) {
			providers.push(
				languages.registerReferenceProvider(
					languageId,
					new languageFeatures.ReferenceAdapter(worker)
				)
			);
		}
		if (modeConfiguration.documentSymbols) {
			providers.push(
				languages.registerDocumentSymbolProvider(
					languageId,
					new languageFeatures.DocumentSymbolAdapter(worker)
				)
			);
		}
		if (false) {
			/*providers.push(
				languages.registerRenameProvider(languageId, new languageFeatures.RenameAdapter(worker))
			);*/
		}
		if (false) {
			/*providers.push(
				languages.registerColorProvider(
					languageId,
					new languageFeatures.DocumentColorAdapter(worker)
				)
			);*/
		}
		if (modeConfiguration.diagnostics) {
			providers.push(
				languages.registerCodeActionProvider(
					languageId,
					new languageFeatures.CodeActionAdapter(worker)
				)
			);
		}
		if (modeConfiguration.foldingRanges) {
			/*providers.push(
				languages.registerFoldingRangeProvider(
					languageId,
					new languageFeatures.FoldingRangeAdapter(worker)
				)
			);*/
		}
		if (modeConfiguration.diagnostics) {
			providers.push(new languageFeatures.DiagnosticsAdapter(languageId, worker, defaults));
		}
		if (false) {
			/*providers.push(
				languages.registerSelectionRangeProvider(
					languageId,
					new languageFeatures.SelectionRangeAdapter(worker)
				)
			);*/
		}
		if (modeConfiguration.autoFormat) {
			var autoFormatMap = {
				'.': { match: '...', result: '…' }, // ellipsis
				'-': { match: '--', result: '—' } // emdash
			};
			providers.push(
				languages.registerOnTypeFormattingEditProvider(languageId, {
					autoFormatTriggerCharacters: Object.keys(autoFormatMap),
					provideOnTypeFormattingEdits: function (model, position, character, options, token) {
						var matchLength = autoFormatMap[character].match.length;
						var range = new Range(
							position.lineNumber,
							position.column >= matchLength ? position.column - matchLength : 0,
							position.lineNumber,
							position.column
						);
						if (model.getValueInRange(range) === autoFormatMap[character].match) {
							return [
								{
									range: range,
									text: autoFormatMap[character].result
								}
							];
						}
					}
				})
			);
		}
		if (true /* Project Indexing */) {
			providers.push(new languageFeatures.IndexAdapter(languageId, worker));
		}
	}

	registerProviders();

	disposables.push(asDisposable(providers));

	return asDisposable(disposables);
}

function asDisposable(disposables: IDisposable[]): IDisposable {
	return { dispose: () => disposeAll(disposables) };
}

function disposeAll(disposables: IDisposable[]) {
	while (disposables.length) {
		disposables.pop().dispose();
	}
}
