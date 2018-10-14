define('vs/language/choicescript/monaco.contribution',["require", "exports"], function (require, exports) {
    /*---------------------------------------------------------------------------------------------
     *  Copyright (c) Microsoft Corporation. All rights reserved.
     *  Licensed under the MIT License. See License.txt in the project root for license information.
     *--------------------------------------------------------------------------------------------*/
    'use strict';
    Object.defineProperty(exports, "__esModule", { value: true });
    var Emitter = monaco.Emitter;
    // --- CSS configuration and defaults ---------
    var LanguageServiceDefaultsImpl = /** @class */ (function () {
        function LanguageServiceDefaultsImpl(languageId, diagnosticsOptions) {
            this._onDidChange = new Emitter();
            this._languageId = languageId;
            this.setDiagnosticsOptions(diagnosticsOptions);
        }
        Object.defineProperty(LanguageServiceDefaultsImpl.prototype, "onDidChange", {
            get: function () {
                return this._onDidChange.event;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LanguageServiceDefaultsImpl.prototype, "languageId", {
            get: function () {
                return this._languageId;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(LanguageServiceDefaultsImpl.prototype, "diagnosticsOptions", {
            get: function () {
                return this._diagnosticsOptions;
            },
            enumerable: true,
            configurable: true
        });
        LanguageServiceDefaultsImpl.prototype.setDiagnosticsOptions = function (options) {
            this._diagnosticsOptions = options || Object.create(null);
            this._onDidChange.fire(this);
        };
        return LanguageServiceDefaultsImpl;
    }());
    exports.LanguageServiceDefaultsImpl = LanguageServiceDefaultsImpl;
    var diagnosticDefault = {
        validate: true,
        spellCheckSettings: {
            rootPath: (typeof window.cside !== "undefined") ? "lib/typo/dictionaries/" : "https://raw.githubusercontent.com/cfinke/Typo.js/master/typo/dictionaries/",
            enabled: true,
            dictionary: "en_US"
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
    };
    var choicescriptDefaults = new LanguageServiceDefaultsImpl('choicescript', diagnosticDefault);
    // Export API
    function createAPI() {
        return {
            choicescriptDefaults: choicescriptDefaults,
        };
    }
    monaco.languages.choicescript = createAPI();
    // --- Registration to monaco editor ---
    function getMode() {
        return monaco.Promise.wrap(new Promise(function (resolve_1, reject_1) { require(['./choicescriptMode'], resolve_1, reject_1); }));
    }
    monaco.languages.onLanguage('choicescript', function () {
        getMode().then(function (mode) { return mode.setupMode(choicescriptDefaults); });
    });
});

