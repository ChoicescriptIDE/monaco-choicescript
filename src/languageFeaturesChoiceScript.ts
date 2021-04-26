/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { LanguageServiceDefaultsChoiceScript } from './monaco.contribution';
import type { ChoiceScriptWorker } from './choicescriptWorker';
import * as choicescriptService from 'vscode-choicescript-languageservice';
import {
	languages,
	editor,
	IMarkdownString,
	Uri,
	Position,
	IRange,
	Range,
	CancellationToken,
	IDisposable,
	MarkerSeverity
} from './fillers/monaco-editor-core';
import { TextEdit } from 'vscode-css-languageservice';
import { InsertReplaceEdit } from 'vscode-languageserver-types';

export interface WorkerAccessor {
	(first: Uri, ...more: Uri[]): Promise<ChoiceScriptWorker>;
}

// --- diagnostics --- ---

export class DiagnosticsAdapter {
	private _disposables: IDisposable[] = [];
	private _listener: { [uri: string]: IDisposable } = Object.create(null);

	constructor(
		private _languageId: string,
		private _worker: WorkerAccessor,
		defaults: LanguageServiceDefaultsChoiceScript
	) {
		const onModelAdd = (model: editor.IModel): void => {
			let modeId = model.getModeId();
			if (modeId !== this._languageId) {
				return;
			}

			let handle: number;
			this._listener[model.uri.toString()] = model.onDidChangeContent(() => {
				window.clearTimeout(handle);
				handle = window.setTimeout(() => this._doValidate(model.uri, modeId), 500);
			});

			this._doValidate(model.uri, modeId);
		};

		const onModelRemoved = (model: editor.IModel): void => {
			editor.setModelMarkers(model, this._languageId, []);

			let uriStr = model.uri.toString();
			let listener = this._listener[uriStr];
			if (listener) {
				listener.dispose();
				delete this._listener[uriStr];
			}
		};

		this._disposables.push(editor.onDidCreateModel(onModelAdd));
		this._disposables.push(editor.onWillDisposeModel(onModelRemoved));
		this._disposables.push(
			editor.onDidChangeModelLanguage((event) => {
				onModelRemoved(event.model);
				onModelAdd(event.model);
			})
		);

		this._disposables.push(
			defaults.onDidChange((_) => {
				editor.getModels().forEach((model) => {
					if (model.getModeId() === this._languageId) {
						onModelRemoved(model);
						onModelAdd(model);
					}
				});
			})
		);

		this._disposables.push({
			dispose: () => {
				editor.getModels().forEach(onModelRemoved);
				for (let key in this._listener) {
					this._listener[key].dispose();
				}
			}
		});

		editor.getModels().forEach(onModelAdd);
	}

	public dispose(): void {
		this._disposables.forEach((d) => d && d.dispose());
		this._disposables = [];
	}

	private _doValidate(resource: Uri, languageId: string): void {
		this._worker(resource)
			.then((worker) => {
				return worker.doValidation3(resource.toString());
			})
			.then((diagnostics) => {
				const markers = diagnostics.map((d) => toDiagnostics(resource, d));
				let model = editor.getModel(resource);
				if (model.getModeId() === languageId) {
					editor.setModelMarkers(model, languageId, markers);
				}
			})
			.then(undefined, (err) => {
				console.error(err);
			});
	}
}

function toSeverity(lsSeverity: number): MarkerSeverity {
	switch (lsSeverity) {
		case choicescriptService.DiagnosticSeverity.Error:
			return MarkerSeverity.Error;
		case choicescriptService.DiagnosticSeverity.Warning:
			return MarkerSeverity.Warning;
		case choicescriptService.DiagnosticSeverity.Information:
			return MarkerSeverity.Info;
		case choicescriptService.DiagnosticSeverity.Hint:
			return MarkerSeverity.Hint;
		default:
			return MarkerSeverity.Info;
	}
}

function toDiagnostics(resource: Uri, diag: choicescriptService.Diagnostic): editor.IMarkerData {
	let code = typeof diag.code === 'number' ? String(diag.code) : <string>diag.code;

	return {
		severity: toSeverity(diag.severity),
		startLineNumber: diag.range.start.line + 1,
		startColumn: diag.range.start.character + 1,
		endLineNumber: diag.range.end.line + 1,
		endColumn: diag.range.end.character + 1,
		message: diag.message,
		code: code,
		source: diag.source
	};
}

// --- completion ------

function fromPosition(position: Position): choicescriptService.Position {
	if (!position) {
		return void 0;
	}
	return { character: position.column - 1, line: position.lineNumber - 1 };
}

function fromRange(range: IRange): choicescriptService.Range {
	if (!range) {
		return void 0;
	}
	return {
		start: {
			line: range.startLineNumber - 1,
			character: range.startColumn - 1
		},
		end: { line: range.endLineNumber - 1, character: range.endColumn - 1 }
	};
}

function toRange(range: choicescriptService.Range): Range {
	if (!range) {
		return void 0;
	}
	return new Range(
		range.start.line + 1,
		range.start.character + 1,
		range.end.line + 1,
		range.end.character + 1
	);
}

function isInsertReplaceEdit(edit: TextEdit | InsertReplaceEdit): edit is InsertReplaceEdit {
	return (
		typeof (<InsertReplaceEdit>edit).insert !== 'undefined' &&
		typeof (<InsertReplaceEdit>edit).replace !== 'undefined'
	);
}

function toCompletionItemKind(kind: number): languages.CompletionItemKind {
	let mItemKind = languages.CompletionItemKind;

	switch (kind) {
		case choicescriptService.CompletionItemKind.Text:
			return mItemKind.Text;
		case choicescriptService.CompletionItemKind.Method:
			return mItemKind.Method;
		case choicescriptService.CompletionItemKind.Function:
			return mItemKind.Function;
		case choicescriptService.CompletionItemKind.Constructor:
			return mItemKind.Constructor;
		case choicescriptService.CompletionItemKind.Field:
			return mItemKind.Field;
		case choicescriptService.CompletionItemKind.Variable:
			return mItemKind.Variable;
		case choicescriptService.CompletionItemKind.Class:
			return mItemKind.Class;
		case choicescriptService.CompletionItemKind.Interface:
			return mItemKind.Interface;
		case choicescriptService.CompletionItemKind.Module:
			return mItemKind.Module;
		case choicescriptService.CompletionItemKind.Property:
			return mItemKind.Property;
		case choicescriptService.CompletionItemKind.Unit:
			return mItemKind.Unit;
		case choicescriptService.CompletionItemKind.Value:
			return mItemKind.Value;
		case choicescriptService.CompletionItemKind.Enum:
			return mItemKind.Enum;
		case choicescriptService.CompletionItemKind.Keyword:
			return mItemKind.Keyword;
		case choicescriptService.CompletionItemKind.Snippet:
			return mItemKind.Snippet;
		case choicescriptService.CompletionItemKind.Color:
			return mItemKind.Color;
		case choicescriptService.CompletionItemKind.File:
			return mItemKind.File;
		case choicescriptService.CompletionItemKind.Reference:
			return mItemKind.Reference;
	}
	return mItemKind.Property;
}

function toTextEdit(textEdit: choicescriptService.TextEdit): editor.ISingleEditOperation {
	if (!textEdit) {
		return void 0;
	}
	return {
		range: toRange(textEdit.range),
		text: textEdit.newText
	};
}

export class CompletionAdapter implements languages.CompletionItemProvider {
	constructor(private _worker: WorkerAccessor) {}

	public get triggerCharacters(): string[] {
		return [' ', ':'];
	}

	provideCompletionItems(
		model: editor.IReadOnlyModel,
		position: Position,
		context: languages.CompletionContext,
		token: CancellationToken
	): Promise<languages.CompletionList> {
		const resource = model.uri;

		return this._worker(resource)
			.then((worker) => {
				return worker.doComplete3(resource.toString(), fromPosition(position));
			})
			.then((info) => {
				if (!info) {
					return;
				}
				const wordInfo = model.getWordUntilPosition(position);
				const wordRange = new Range(
					position.lineNumber,
					wordInfo.startColumn,
					position.lineNumber,
					wordInfo.endColumn
				);

				let items: languages.CompletionItem[] = info.items.map((entry) => {
					let item: languages.CompletionItem = {
						label: entry.label,
						insertText: entry.insertText || entry.label,
						sortText: entry.sortText,
						filterText: entry.filterText,
						documentation: entry.documentation,
						detail: entry.detail,
						range: wordRange,
						kind: toCompletionItemKind(entry.kind)
					};
					if (entry.textEdit) {
						if (isInsertReplaceEdit(entry.textEdit)) {
							item.range = {
								insert: toRange(entry.textEdit.insert),
								replace: toRange(entry.textEdit.replace)
							};
						} else {
							item.range = toRange(entry.textEdit.range);
						}
						item.insertText = entry.textEdit.newText;
					}
					if (entry.additionalTextEdits) {
						item.additionalTextEdits = entry.additionalTextEdits.map(toTextEdit);
					}
					if (entry.insertTextFormat === choicescriptService.InsertTextFormat.Snippet) {
						item.insertTextRules = languages.CompletionItemInsertTextRule.InsertAsSnippet;
					}
					return item;
				});

				return {
					isIncomplete: info.isIncomplete,
					suggestions: items
				};
			});
	}
}

function isMarkupContent(thing: any): thing is choicescriptService.MarkupContent {
	return (
		thing &&
		typeof thing === 'object' &&
		typeof (<choicescriptService.MarkupContent>thing).kind === 'string'
	);
}

function toMarkdownString(
	entry: choicescriptService.MarkupContent | choicescriptService.MarkedString
): IMarkdownString {
	if (typeof entry === 'string') {
		return {
			value: entry
		};
	}
	if (isMarkupContent(entry)) {
		if (entry.kind === 'plaintext') {
			return {
				value: entry.value.replace(/[\\`*_{}[\]()#+\-.!]/g, '\\$&')
			};
		}
		return {
			value: entry.value
		};
	}

	return { value: '```' + entry.language + '\n' + entry.value + '\n```\n' };
}

function toMarkedStringArray(
	contents:
		| choicescriptService.MarkupContent
		| choicescriptService.MarkedString
		| choicescriptService.MarkedString[]
): IMarkdownString[] {
	if (!contents) {
		return void 0;
	}
	if (Array.isArray(contents)) {
		return contents.map(toMarkdownString);
	}
	return [toMarkdownString(contents)];
}

// --- hover ------

export class HoverAdapter implements languages.HoverProvider {
	constructor(private _worker: WorkerAccessor) {}

	provideHover(
		model: editor.IReadOnlyModel,
		position: Position,
		token: CancellationToken
	): Promise<languages.Hover> {
		let resource = model.uri;

		return this._worker(resource)
			.then((worker) => {
				return worker.doHover(resource.toString(), fromPosition(position));
			})
			.then((info) => {
				if (!info) {
					return;
				}
				return <languages.Hover>{
					range: toRange(info.range),
					contents: toMarkedStringArray(info.contents)
				};
			});
	}
}

// --- CodeActions, Spelling QuickFix ---

export class CodeActionAdapter implements languages.CodeActionProvider {
	constructor(private _worker: WorkerAccessor) {}
	provideCodeActions(
		model: editor.IReadOnlyModel,
		range: Range,
		context: languages.CodeActionContext,
		token: CancellationToken
	): Promise<languages.CodeActionList> {
		let resource = model.uri;
		let words = [];
		return this._worker(resource)
			.then((worker) => {
				let markers = context.markers;
				if (markers.length <= 0)
					return null;
				// Only use is spellings (for now), and we limit
				// the results to the first one, regardless of context,
				// for performance reasons.
				markers = markers.filter((m) => m.code === "badSpelling");
				markers = markers.slice(0,1); //
				for (let m of markers) {
					var wordRange = new Range(m.startLineNumber, m.startColumn, m.endLineNumber, m.endColumn);
					let word = model.getWordAtPosition(new Position(wordRange.startLineNumber, wordRange.startColumn));
					if (!word) continue;
					words.push({word: word.word, range: wordRange});
				}
				if (words.length <= 0)
					return null;
				return worker.suggestSpelling(words.map((w) => w.word));
			})
			.then((results) => {
				if (!results)
					return null;
				let actions = [];
				if (results.length > 0) {
					for (var i = 0; i < results[0].length; i++) {
						actions.push({
							title: "Correct spelling: " + results[0][i], kind: "quickfix",
							edit: {
								edits: [ { edit: { range: words[0].range, text: results[0][i] }, resource: model.uri } ]
							}
						});
					}
				}
				actions.push({ title: "Ignore '" + words[0].word + "' this session", kind: "quickfix",
					command: { id: "addWordToDictionary", title: "Ignore Word", arguments: ["session", words[0].word] }
				}),
				actions.push({ title: "Add '" + words[0].word + "' to the User Dictionary", kind: "quickfix",
					command: { id: "addWordToDictionary", title: "Add Word", arguments: ["persistent", words[0].word] }
				});
				return actions.length > 0 ? <languages.CodeActionList>{
					actions: actions,
					dispose: () => {},
				} : null;
			});
	}
}

// --- document highlights ------

/*function toDocumentHighlightKind(kind: number): languages.DocumentHighlightKind {
	switch (kind) {
		case cssService.DocumentHighlightKind.Read:
			return languages.DocumentHighlightKind.Read;
		case cssService.DocumentHighlightKind.Write:
			return languages.DocumentHighlightKind.Write;
		case cssService.DocumentHighlightKind.Text:
			return languages.DocumentHighlightKind.Text;
	}
	return languages.DocumentHighlightKind.Text;
}

export class DocumentHighlightAdapter implements languages.DocumentHighlightProvider {
	constructor(private _worker: WorkerAccessor) {}

	public provideDocumentHighlights(
		model: editor.IReadOnlyModel,
		position: Position,
		token: CancellationToken
	): Promise<languages.DocumentHighlight[]> {
		const resource = model.uri;

		return this._worker(resource)
			.then((worker) => {
				return worker.findDocumentHighlights(resource.toString(), fromPosition(position));
			})
			.then((entries) => {
				if (!entries) {
					return;
				}
				return entries.map((entry) => {
					return <languages.DocumentHighlight>{
						range: toRange(entry.range),
						kind: toDocumentHighlightKind(entry.kind)
					};
				});
			});
	}
}*/

// --- definition ------

function toLocation(location: choicescriptService.Location): languages.Location {
	return {
		uri: Uri.parse(location.uri),
		range: toRange(location.range)
	};
}

export class DefinitionAdapter {
	constructor(private _worker: WorkerAccessor) {}

	public provideDefinition(
		model: editor.IReadOnlyModel,
		position: Position,
		token: CancellationToken
	): Promise<languages.Definition> {
		const resource = model.uri;

		return this._worker(resource)
			.then((worker) => {
				return worker.findDefinition(resource.toString(), fromPosition(position));
			})
			.then((definition) => {
				if (!definition) {
					return;
				}
				return [toLocation(definition)];
			});
	}
}

// --- references ------

export class ReferenceAdapter implements languages.ReferenceProvider {
	constructor(private _worker: WorkerAccessor) {}

	provideReferences(
		model: editor.IReadOnlyModel,
		position: Position,
		context: languages.ReferenceContext,
		token: CancellationToken
	): Promise<languages.Location[]> {
		const resource = model.uri;

		return this._worker(resource)
			.then((worker) => {
				return worker.findReferences(resource.toString(), fromPosition(position));
			})
			.then((entries) => {
				if (!entries) {
					return;
				}
				return entries.map(toLocation);
			});
	}
}

// --- rename ------

function toWorkspaceEdit(edit: choicescriptService.WorkspaceEdit): languages.WorkspaceEdit {
	if (!edit || !edit.changes) {
		return void 0;
	}
	let resourceEdits: languages.WorkspaceTextEdit[] = [];
	for (let uri in edit.changes) {
		const _uri = Uri.parse(uri);
		// let edits: languages.TextEdit[] = [];
		for (let e of edit.changes[uri]) {
			resourceEdits.push({
				resource: _uri,
				edit: {
					range: toRange(e.range),
					text: e.newText
				}
			});
		}
	}
	return {
		edits: resourceEdits
	};
}

/*export class RenameAdapter implements languages.RenameProvider {
	constructor(private _worker: WorkerAccessor) {}

	provideRenameEdits(
		model: editor.IReadOnlyModel,
		position: Position,
		newName: string,
		token: CancellationToken
	): Promise<languages.WorkspaceEdit> {
		const resource = model.uri;

		return this._worker(resource)
			.then((worker) => {
			return worker.doRename(resource.toString(), fromPosition(position), newName);
		})
		.then((edit) => {
			return toWorkspaceEdit(edit);
		});
	}
}*/

// --- document symbols ------

function toSymbolKind(kind: choicescriptService.SymbolKind): languages.SymbolKind {
	let mKind = languages.SymbolKind;

	switch (kind) {
		case choicescriptService.SymbolKind.File:
			return mKind.Array;
		case choicescriptService.SymbolKind.Module:
			return mKind.Module;
		case choicescriptService.SymbolKind.Namespace:
			return mKind.Namespace;
		case choicescriptService.SymbolKind.Package:
			return mKind.Package;
		case choicescriptService.SymbolKind.Class:
			return mKind.Class;
		case choicescriptService.SymbolKind.Method:
			return mKind.Method;
		case choicescriptService.SymbolKind.Property:
			return mKind.Property;
		case choicescriptService.SymbolKind.Field:
			return mKind.Field;
		case choicescriptService.SymbolKind.Constructor:
			return mKind.Constructor;
		case choicescriptService.SymbolKind.Enum:
			return mKind.Enum;
		case choicescriptService.SymbolKind.Interface:
			return mKind.Interface;
		case choicescriptService.SymbolKind.Function:
			return mKind.Function;
		case choicescriptService.SymbolKind.Variable:
			return mKind.Variable;
		case choicescriptService.SymbolKind.Constant:
			return mKind.Constant;
		case choicescriptService.SymbolKind.String:
			return mKind.String;
		case choicescriptService.SymbolKind.Number:
			return mKind.Number;
		case choicescriptService.SymbolKind.Boolean:
			return mKind.Boolean;
		case choicescriptService.SymbolKind.Array:
			return mKind.Array;
	}
	return mKind.Function;
}

export class DocumentSymbolAdapter implements languages.DocumentSymbolProvider {
	constructor(private _worker: WorkerAccessor) {}

	public provideDocumentSymbols(
		model: editor.IReadOnlyModel,
		token: CancellationToken
	): Promise<languages.DocumentSymbol[]> {
		const resource = model.uri;

		return this._worker(resource)
			.then((worker) => worker.findDocumentSymbols(resource.toString()))
			.then((items) => {
				if (!items) {
					return;
				}
				return items.map((item) => ({
					name: item.name,
					detail: '',
					containerName: item.containerName,
					kind: toSymbolKind(item.kind),
					tags: [],
					range: toRange(item.location.range),
					selectionRange: toRange(item.location.range) // location: item.location?
				}));
			});
	}
}

/*export class DocumentColorAdapter implements languages.DocumentColorProvider {
	constructor(private _worker: WorkerAccessor) {}

	public provideDocumentColors(
		model: editor.IReadOnlyModel,
		token: CancellationToken
	): Promise<languages.IColorInformation[]> {
		const resource = model.uri;

		return this._worker(resource)
			.then((worker) => worker.findDocumentColors(resource.toString()))
			.then((infos) => {
				if (!infos) {
					return;
				}
				return infos.map((item) => ({
					color: item.color,
					range: toRange(item.range)
				}));
			});
	}

	public provideColorPresentations(
		model: editor.IReadOnlyModel,
		info: languages.IColorInformation,
		token: CancellationToken
	): Promise<languages.IColorPresentation[]> {
		const resource = model.uri;

		return this._worker(resource)
			.then((worker) =>
				worker.getColorPresentations(resource.toString(), info.color, fromRange(info.range))
			)
			.then((presentations) => {
				if (!presentations) {
					return;
				}
				return presentations.map((presentation) => {
					let item: languages.IColorPresentation = {
						label: presentation.label
					};
					if (presentation.textEdit) {
						item.textEdit = toTextEdit(presentation.textEdit);
					}
					if (presentation.additionalTextEdits) {
						item.additionalTextEdits = presentation.additionalTextEdits.map(toTextEdit);
					}
					return item;
				});
			});
	}
}*/

/*export class FoldingRangeAdapter implements languages.FoldingRangeProvider {
	constructor(private _worker: WorkerAccessor) {}

	public provideFoldingRanges(
		model: editor.IReadOnlyModel,
		context: languages.FoldingContext,
		token: CancellationToken
	): Promise<languages.FoldingRange[]> {
		const resource = model.uri;

		return this._worker(resource)
		.then((worker) => worker.getFoldingRanges(resource.toString(), context))
		.then((ranges) => {
			if (!ranges) {
				return;
			}
			return ranges.map((range) => {
				let result: languages.FoldingRange = {
					start: range.startLine + 1,
					end: range.endLine + 1
				};
				if (typeof range.kind !== 'undefined') {
					result.kind = toFoldingRangeKind(<choicescriptService.FoldingRangeKind>range.kind);
				}
				return result;
			});
		});
	}
}*/

/*function toFoldingRangeKind(kind: choicescriptService.FoldingRangeKind): languages.FoldingRangeKind {
	switch (kind) {
		case choicescriptService.FoldingRangeKind.Comment:
			return languages.FoldingRangeKind.Comment;
		case choicescriptService.FoldingRangeKind.Imports:
			return languages.FoldingRangeKind.Imports;
		case choicescriptService.FoldingRangeKind.Region:
			return languages.FoldingRangeKind.Region;
	}
}

/*export class SelectionRangeAdapter implements languages.SelectionRangeProvider {
	constructor(private _worker: WorkerAccessor) {}

	public provideSelectionRanges(
		model: editor.IReadOnlyModel,
		positions: Position[],
		token: CancellationToken
	): Promise<languages.SelectionRange[][]> {
		const resource = model.uri;

		return this._worker(resource)
		.then((worker) => worker.getSelectionRanges(resource.toString(), positions.map(fromPosition)))
		.then((selectionRanges) => {
			if (!selectionRanges) {
				return;
			}
			return selectionRanges.map((selectionRange) => {
				const result: languages.SelectionRange[] = [];
				while (selectionRange) {
					result.push({ range: toRange(selectionRange.range) });
					selectionRange = selectionRange.parent;
				}
				return result;
			});
		});
	}

}*/

export class IndexAdapter {
	private _disposables: IDisposable[] = [];
	private _listener: { [uri: string]: IDisposable } = Object.create(null);

	constructor(private _languageId: string, private _worker: WorkerAccessor) {
		const onModelAdd = (model: editor.IModel): void => {
			let modeId = model.getModeId();
			if (modeId !== this._languageId) {
				return;
			}

			let handle: number;
			this._listener[model.uri.toString()] = model.onDidChangeContent(() => {
				window.clearTimeout(handle);
				// we can probably get away with debouncing/delaying this a good while
				// as it's unlikely we'll need an up-to-date index of the scene we're currently editing
				handle = window.setTimeout(() => this._updateIndex(model.uri), 1000);
			});

			this._updateIndex(model.uri);
		};

		const onModelRemoved = (model: editor.IModel): void => {
			this._removeIndex(model.uri);

			let uriStr = model.uri.toString();
			let listener = this._listener[uriStr];
			if (listener) {
				listener.dispose();
				delete this._listener[uriStr];
			}
		};

		this._disposables.push(editor.onDidCreateModel(onModelAdd));
		this._disposables.push(editor.onWillDisposeModel(onModelRemoved));

		this._disposables.push({
			dispose: () => {
				for (let key in this._listener) {
					this._listener[key].dispose();
				}
			}
		});

		editor.getModels().forEach(onModelAdd);
	}

	private _updateIndex(resource: Uri): void {
		this._worker(resource).then((worker) => {
			return worker.updateIndex(resource.toString());
		});
	}

	private _removeIndex(resource: Uri): void {
		this._worker(resource).then((worker) => {
			return worker.removeIndex(resource.toString());
		});
	}

	public dispose(): void {
		this._disposables.forEach((d) => d && d.dispose());
		this._disposables = [];
	}
}
