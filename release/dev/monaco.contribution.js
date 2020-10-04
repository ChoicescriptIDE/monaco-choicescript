/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define('vs/language/choicescript/fillers/monaco-editor-core',[], function () {
    return self.monaco;
});

/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
define('vs/language/choicescript/monaco.contribution',["require", "exports", "./fillers/monaco-editor-core"], function (require, exports, monaco_editor_core_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.choicescriptDefaults = exports.lessDefaults = exports.scssDefaults = exports.cssDefaults = void 0;
    // --- CSS configuration and defaults ---------
    var LanguageServiceDefaultsImpl = /** @class */ (function () {
        function LanguageServiceDefaultsImpl(languageId, diagnosticsOptions, modeConfiguration) {
            this._onDidChange = new monaco_editor_core_1.Emitter();
            this._languageId = languageId;
            this.setDiagnosticsOptions(diagnosticsOptions);
            this.setModeConfiguration(modeConfiguration);
        }
        Object.defineProperty(LanguageServiceDefaultsImpl.prototype, "onDidChange", {
            get: function () {
                return this._onDidChange.event;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(LanguageServiceDefaultsImpl.prototype, "languageId", {
            get: function () {
                return this._languageId;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(LanguageServiceDefaultsImpl.prototype, "modeConfiguration", {
            get: function () {
                return this._modeConfiguration;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(LanguageServiceDefaultsImpl.prototype, "diagnosticsOptions", {
            get: function () {
                return this._diagnosticsOptions;
            },
            enumerable: false,
            configurable: true
        });
        LanguageServiceDefaultsImpl.prototype.setDiagnosticsOptions = function (options) {
            this._diagnosticsOptions = options || Object.create(null);
            this._onDidChange.fire(this);
        };
        LanguageServiceDefaultsImpl.prototype.setModeConfiguration = function (modeConfiguration) {
            this._modeConfiguration = modeConfiguration || Object.create(null);
            this._onDidChange.fire(this);
        };
        return LanguageServiceDefaultsImpl;
    }());
    var diagnosticDefault = {
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
    };
    var modeConfigurationDefault = {
        completionItems: true,
        hovers: true,
        documentSymbols: true,
        definitions: true,
        references: true,
        documentHighlights: true,
        rename: true,
        colors: true,
        foldingRanges: true,
        diagnostics: true,
        selectionRanges: true,
        autoFormat: false,
        documentFormattingEdits: false,
        documentRangeFormattingEdits: false,
        tokens: true
    };
    exports.cssDefaults = new LanguageServiceDefaultsImpl('css', diagnosticDefault, modeConfigurationDefault);
    exports.scssDefaults = new LanguageServiceDefaultsImpl('scss', diagnosticDefault, modeConfigurationDefault);
    exports.lessDefaults = new LanguageServiceDefaultsImpl('less', diagnosticDefault, modeConfigurationDefault);
    // export to the global based API
    monaco_editor_core_1.languages.css = { cssDefaults: exports.cssDefaults, lessDefaults: exports.lessDefaults, scssDefaults: exports.scssDefaults };
    // --- Registration to monaco editor ---
    function getMode() {
        return new Promise(function (resolve_1, reject_1) { require(['./cssMode'], resolve_1, reject_1); });
    }
    monaco_editor_core_1.languages.onLanguage('less', function () {
        getMode().then(function (mode) { return mode.setupMode(exports.lessDefaults); });
    });
    monaco_editor_core_1.languages.onLanguage('scss', function () {
        getMode().then(function (mode) { return mode.setupMode(exports.scssDefaults); });
    });
    monaco_editor_core_1.languages.onLanguage('css', function () {
        getMode().then(function (mode) { return mode.setupMode(exports.cssDefaults); });
    });
    var LanguageServiceDefaultsChoiceScriptImpl = /** @class */ (function () {
        function LanguageServiceDefaultsChoiceScriptImpl(languageId, diagnosticsOptions, modeConfiguration) {
            this._onDidChange = new monaco_editor_core_1.Emitter();
            this._languageId = languageId;
            this.setDiagnosticsOptions(diagnosticsOptions);
            this.setModeConfiguration(modeConfiguration);
        }
        Object.defineProperty(LanguageServiceDefaultsChoiceScriptImpl.prototype, "onDidChange", {
            get: function () {
                return this._onDidChange.event;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(LanguageServiceDefaultsChoiceScriptImpl.prototype, "languageId", {
            get: function () {
                return this._languageId;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(LanguageServiceDefaultsChoiceScriptImpl.prototype, "modeConfiguration", {
            get: function () {
                return this._modeConfiguration;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(LanguageServiceDefaultsChoiceScriptImpl.prototype, "diagnosticsOptions", {
            get: function () {
                return this._diagnosticsOptions;
            },
            enumerable: false,
            configurable: true
        });
        LanguageServiceDefaultsChoiceScriptImpl.prototype.setDiagnosticsOptions = function (options) {
            this._diagnosticsOptions = options || Object.create(null);
            this._onDidChange.fire(this);
        };
        LanguageServiceDefaultsChoiceScriptImpl.prototype.setModeConfiguration = function (modeConfiguration) {
            this._modeConfiguration = modeConfiguration || Object.create(null);
            this._onDidChange.fire(this);
        };
        return LanguageServiceDefaultsChoiceScriptImpl;
    }());
    var diagnosticDefaultChoiceScript = {
        validate: true,
        lint: { enabled: true },
        spellcheck: {
            enabled: true,
            dictionaryPath: 'https://raw.githubusercontent.com/cfinke/Typo.js/master/typo/dictionaries',
            dictionary: 'en_US',
            userDictionaries: null
        }
    };
    var modeConfigurationDefaultChoiceScript = {
        completionItems: true,
        hovers: true,
        documentSymbols: true,
        definitions: true,
        references: true,
        documentHighlights: false,
        rename: false,
        colors: false,
        foldingRanges: false,
        diagnostics: true,
        selectionRanges: false,
        documentFormattingEdits: false,
        documentRangeFormattingEdits: false,
        tokens: true,
        autoFormat: true
    };
    exports.choicescriptDefaults = new LanguageServiceDefaultsChoiceScriptImpl('choicescript', diagnosticDefaultChoiceScript, modeConfigurationDefaultChoiceScript);
    // export to the global based API
    monaco_editor_core_1.languages.choicescript = exports.choicescriptDefaults;
    // --- Registration to monaco editor ---
    function getCSMode() {
        return new Promise(function (resolve_2, reject_2) { require(['./choicescriptMode'], resolve_2, reject_2); });
    }
    monaco_editor_core_1.languages.onLanguage('choicescript', function () {
        //getModeCS('choicescript').then(csmode => csmode.setupMode(choicescriptDefaults));
        getCSMode().then(function (mode) {
            monaco_editor_core_1.languages.choicescriptDispose = mode.setupMode(exports.choicescriptDefaults);
            // handle reset on setModeConfiguration
            exports.choicescriptDefaults.onDidChange(function () {
                var _a;
                (_a = monaco_editor_core_1.languages.choicescriptDispose) === null || _a === void 0 ? void 0 : _a.dispose();
                monaco_editor_core_1.languages.choicescriptDispose = mode.setupMode(exports.choicescriptDefaults);
            });
        });
    });
});

