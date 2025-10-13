import * as vscode from 'vscode';
import { exportHtml } from './commands/exportHtml';
import { exportInlinedHtml } from './commands/exportInlinedHtml';
import { showPreview } from './commands/showPreview';
import { openInBrowser } from './commands/openInBrowser';
import { ContainerManager } from './ContainerManager';

const completionItemsJson = [
	{
		'label' : ':revealjs_theme:',
		'detail' : 'Presentation theme (see https://revealjs.com/themes/)',
		'values' : ['beige', 'blood', 'moon', 'simple', 'solarized', 'sky', 'black', 'league', 'night', 'serif', 'white'],
	},
	{
		'label' : ':revealjs_slideNumber:',
		'detail' : 'Display the page number of the current slide? true/false or format string',
		'values' : ['true', 'false', 'h.v', 'h/v', 'c', 'c/t'],
	},
	{
		'label' : ':revealjs_center:',
		'detail' : 'Center slides vertically? true/false',
		'values' : ['true', 'false'],
	},
	{
		'label' : ':revealjs_customtheme:',
		'detail' : 'Custom theme CSS file location',
	},
	{
		'label' : ':revealjs_controls:',
		'detail' : 'Show slide controls? true/false',
		'values' : ['true', 'false'],
	},
	{
		'label' : ':revealjs_controlsLayout:',
		'detail' : 'Determines where controls appear, "edges" or "bottom-right"',
		'values' : ['edges', 'bottom-right'],
	},
	{
		'label' : ':revealjs_controlsBackArrows:',
		'detail' : 'Visibility rule for backwards navigation arrows',
		'values' : ['faded', 'hidden', 'visible'],
	},
	{
		'label' : ':revealjs_progress:',
		'detail' : 'Display a presentation progress bar',
		'values' : ['true', 'false'],
	},
	{
		'label' : ':revealjs_transition:',
		'detail' : 'Slides transition type',
		'values' : ['none', 'fade', 'slide', 'convex', 'concave', 'zoom'],
	},
	{
		'label' : ':revealjs_transitionSpeed:',
		'detail' : 'Slides transition speed: default/fast/slow',
		'values' : ['default', 'fast', 'slow'],
	},
	{
		'label' : ':revealjs_backgroundTransition:',
		'detail' : 'Slide background transition: none/fade/slide/convex/concave/zoom',
		'values' : ['none', 'fade', 'slide', 'convex', 'concave', 'zoom'],
	},
];

var completionItems : vscode.CompletionItem[] = [];

function provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
	const currentText = document.lineAt(position).text;
	const currentTextNoSpaces = currentText.replace(/\s/g, '');
	if (currentTextNoSpaces.length) {
		// Find all completion items fitting current string
		var filtered = completionItems.filter(x => 
			(typeof x.label === "string" && x.label.startsWith(currentTextNoSpaces)) ||
			(typeof x.label === "object" && (x.label as vscode.CompletionItemLabel).label.startsWith(currentTextNoSpaces))
		);
		if (filtered.length === 0) {
			return undefined;
		}
		else if (filtered.length === 1) {
			var lastSymbol = currentText.substring(currentText.length-1);
			if (lastSymbol === ' ' || lastSymbol === ':') {
				// For filtered property try to propose values
				var filteredValues = completionItemsJson.filter(x => x.label.startsWith(currentTextNoSpaces));
				if (filteredValues.length === 1 && filteredValues[0].values) {
					var subCompletionItems : vscode.CompletionItem[] = [];
					filteredValues[0].values.forEach((item) => {
						let ci = new vscode.CompletionItem(item, vscode.CompletionItemKind.Value);
						ci.sortText = "_";
						subCompletionItems.push(ci);
					} );
					return subCompletionItems;
				} else {
					// No separator after value - no suggestions
					return undefined;
				}
			} else {
				if (currentTextNoSpaces === filtered[0].label) {
					// Everything already entered. Nothing to suggest
					return undefined;
				} else {
					// The only option
					return filtered;
				}
			}
		} else {
			return filtered;
		}
	}

	return undefined;
}

export function activate(context: vscode.ExtensionContext) {

	const outputChannel = vscode.window.createOutputChannel("asciiDocPresentation");
	const appendLine = (value: string) => outputChannel.appendLine(value);
	const containerManager = new ContainerManager(context, appendLine);

	context.subscriptions.push(vscode.commands.registerCommand('asciiDocPresentation.preview', () => showPreview(containerManager)));
	context.subscriptions.push(vscode.commands.registerCommand('asciiDocPresentation.exportHtml', (...args: any[]) => exportHtml(containerManager, args)));
	context.subscriptions.push(vscode.commands.registerCommand('asciiDocPresentation.exportInlinedHtml', () => exportInlinedHtml(containerManager)));
	context.subscriptions.push(vscode.commands.registerCommand('asciiDocPresentation.openInBrowser', () => openInBrowser(containerManager)));

	completionItemsJson.forEach((item) => {
		let ci = new vscode.CompletionItem(item.label,vscode.CompletionItemKind.Property);
		ci.detail = item.detail;
		ci.insertText = item.label.substring(1) + ' ';
		if (item.values) {
			ci.command = { command: 'editor.action.triggerSuggest', title: 'Re-trigger completions...' };
		}
		completionItems.push(ci);
	} );

	const completionProvider = vscode.languages.registerCompletionItemProvider('asciidoc', {provideCompletionItems} , ':',' ');

	context.subscriptions.push(completionProvider);
}
