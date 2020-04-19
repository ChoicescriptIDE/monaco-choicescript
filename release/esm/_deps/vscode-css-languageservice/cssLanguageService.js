/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
import { Parser } from './parser/cssParser';
import { CSSCompletion } from './services/cssCompletion';
import { CSSHover } from './services/cssHover';
import { ChoiceScriptNavigation } from './services/choicescriptNavigation';
import { ChoiceScriptValidation } from './services/ChoiceScriptValidation';
import { ChoiceScriptCodeActions } from './services/ChoiceScriptCodeActions';
export * from './cssLanguageTypes';
export * from './_deps/vscode-languageserver-types/main';
function createFacade(parser, completion, navigation, hover, validation, codeActions) {
    return {
        configure: validation.configure.bind(validation),
        doValidation: validation.doValidation.bind(validation),
        parseScene: parser.parseScene.bind(parser),
        doComplete: completion.doComplete.bind(completion),
        findDocumentSymbols: navigation.findDocumentSymbols.bind(navigation),
        setCompletionParticipants: completion.setCompletionParticipants.bind(completion),
        doHover: hover.doHover.bind(hover),
        findDefinition: navigation.findDefinition.bind(navigation),
        doCodeActions: codeActions.doCodeActions.bind(codeActions),
        doCodeActions2: codeActions.doCodeActions2.bind(codeActions),
    };
}
export function getCSSLanguageService() {
    return createFacade(new Parser(), new CSSCompletion(), new ChoiceScriptNavigation(), new CSSHover(), new ChoiceScriptValidation(), new ChoiceScriptCodeActions());
}
//# sourceMappingURL=cssLanguageService.js.map