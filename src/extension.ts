import * as vscode from 'vscode';
import { exportHtml } from './commands/exportHtml';
import { exportInlinedHtml } from './commands/exportInlinedHtml';
import { showPreview } from './commands/showPreview';
import { openInBrowser } from './commands/openInBrowser';
import { ContainerManager } from './ContainerManager';

const completionItemsJson = [
	{
		'label' : ':revealjs_theme:',
		'description': 'Presentation theme',
		'detail' : 'Presentation theme (see https://revealjs.com/themes/)',
		'values' : ['beige', 'blood', 'moon', 'simple', 'solarized', 'sky', 'black', 'league', 'night', 'serif', 'white'],
	},
	{
		'label' : ':revealjs_slideNumber:',
		'description': 'Slide number format',
		'detail' : 'Display the page number of the current slide? true/false or format string',
		'values' : ['true', 'false', 'h.v', 'h/v', 'c', 'c/t'],
	},
	{
		'label' : ':revealjs_center:',
		'description': 'Center slides vertically',
		'detail' : 'Center slides vertically? true/false',
		'values' : ['true', 'false'],
	},
	{
		'label' : ':revealjs_customtheme:',
		'description': 'Custom theme CSS file location',
		'detail' : 'Custom theme CSS file location',
	},
	{
		'label' : ':revealjs_controls:',
		'description': 'Show slide controls',
		'detail' : 'Show slide controls? true/false',
		'values' : ['true', 'false'],
	},
	{
		'label' : ':revealjs_controlsLayout:',
		'description': 'Controls layout',
		'detail' : 'Determines where controls appear, "edges" or "bottom-right"',
		'values' : ['edges', 'bottom-right'],
	},
	{
		'label' : ':revealjs_controlsBackArrows:',
		'description': 'Back arrows visibility',
		'detail' : 'Visibility rule for backwards navigation arrows',
		'values' : ['faded', 'hidden', 'visible'],
	},
	{
		'label' : ':revealjs_progress:',
		'description': 'Show presentation progress bar',
		'detail' : 'Display a presentation progress bar',
		'values' : ['true', 'false'],
	},
	{
		'label' : ':revealjs_transition:',
		'description': 'Slides transition type',
		'detail' : 'Default slides transition type',
		'values' : ['none', 'fade', 'slide', 'convex', 'concave', 'zoom'],
	},
	{
		'label' : ':revealjs_transitionSpeed:',
		'description': 'Slides transition speed',
		'detail' : 'Slides transition speed: default/fast/slow',
		'values' : ['default', 'fast', 'slow'],
	},
	{
		'label' : ':revealjs_backgroundTransition:',
		'description': 'Background transition type',
		'detail' : 'Slide background transition: none/fade/slide/convex/concave/zoom',
		'values' : ['none', 'fade', 'slide', 'convex', 'concave', 'zoom'],
	},
	{
		'label' : ':kroki-server-url:',
		'description': 'Kroki server URL',
		'detail' : 'Custom Kroki server URL (instead of default https://kroki.io)',
		'values' : ['https://kroki.io'],
	},
];
var completionItems : vscode.CompletionItem[] = [];

export function activate(context: vscode.ExtensionContext) {

	const outputChannel = vscode.window.createOutputChannel("asciiDocPresentation");
	const appendLine = (value: string) => outputChannel.appendLine(value);
	const containerManager = new ContainerManager(context, appendLine);

	context.subscriptions.push(vscode.commands.registerCommand('asciiDocPresentation.preview', () => showPreview(containerManager)));
	context.subscriptions.push(vscode.commands.registerCommand('asciiDocPresentation.exportHtml', (...args: any[]) => exportHtml(containerManager, args)));
	context.subscriptions.push(vscode.commands.registerCommand('asciiDocPresentation.exportInlinedHtml', () => exportInlinedHtml(containerManager)));
	context.subscriptions.push(vscode.commands.registerCommand('asciiDocPresentation.openInBrowser', () => openInBrowser(containerManager)));

	completionItemsJson.forEach((item) => {
		let ci = new vscode.CompletionItem(
			{
				label:item.label,
				description: item.description
			},
			vscode.CompletionItemKind.Text
		);
		ci.detail = item.detail;
		ci.insertText = new vscode.SnippetString(item.label.substring(1) + ' ');
		completionItems.push(ci);
	} );

	const completionProvider = vscode.languages.registerCompletionItemProvider(
		{ language : 'asciidoc' },
		{
			provideCompletionItems(
				textDocument: vscode.TextDocument,
				position: vscode.Position): vscode.CompletionItem[]|undefined {
				const currentText = textDocument.lineAt(position).text;
				const currentTextNoSpaces = currentText.replace(/\s/g, '');
				if (currentTextNoSpaces === ':') {
					return completionItems;
				}
			}
		},
		':', ' ',
	);
	context.subscriptions.push(completionProvider);

    // Inline suggestions for second-level values
    const inlineProvider = vscode.languages.registerInlineCompletionItemProvider(
        { language: 'asciidoc' },
        {
            provideInlineCompletionItems(document, position) {
                const line = document.lineAt(position).text;
                const uptoCursor = line.slice(0, position.character);
                const noSpaces = uptoCursor.replace(/\s/g, '');

                if (!uptoCursor.endsWith(': ')) {
					return;
				}

                const match = completionItemsJson.find(x => x.label === noSpaces);
                if (!match || !match.values) {
					return;
				}

                const items = match.values.map(v => new vscode.InlineCompletionItem(v, new vscode.Range(position, position)));
                return new vscode.InlineCompletionList(items);
            }
        }
    );
    context.subscriptions.push(inlineProvider);

	return {
		"containerManager" : containerManager
	};
}
