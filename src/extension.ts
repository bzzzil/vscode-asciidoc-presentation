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
		'label' : ':revealjs_hash:',
		'description': 'Add slide hash to URL',
		'detail' : 'Add the current slide number to the URL hash so that reloading the page returns you to the same slide',
		'values' : ['true', 'false'],
	},
	{
		'label' : ':revealjs_history:',
		'description': 'Push slide changes to browser history',
		'detail' : 'Push each slide change to the browser history',
		'values' : ['true', 'false'],
	},
	{
		'label' : ':revealjs_overview:',
		'description': 'Enable slide overview mode',
		'detail' : 'Enable the slide overview mode (press Escape to open)',
		'values' : ['true', 'false'],
	},
	{
		'label' : ':revealjs_loop:',
		'description': 'Loop the presentation',
		'detail' : 'Loop the presentation',
		'values' : ['true', 'false'],
	},
	{
		'label' : ':revealjs_rtl:',
		'description': 'Right-to-left presentation direction',
		'detail' : 'Change the presentation direction to be right-to-left',
		'values' : ['true', 'false'],
	},
	{
		'label' : ':revealjs_navigationMode:',
		'description': 'Navigation mode',
		'detail' : 'Changes the behavior of navigation directions',
		'values' : ['default', 'linear', 'grid'],
	},
	{
		'label' : ':revealjs_touch:',
		'description': 'Touch navigation',
		'detail' : 'Enables touch navigation on devices with touch input',
		'values' : ['true', 'false'],
	},
	{
		'label' : ':revealjs_keyboard:',
		'description': 'Keyboard shortcuts',
		'detail' : 'Enable keyboard shortcuts for navigation',
		'values' : ['true', 'false'],
	},
	{
		'label' : ':revealjs_fragments:',
		'description': 'Enable fragments globally',
		'detail' : 'Turns fragments on and off globally',
		'values' : ['true', 'false'],
	},
	{
		'label' : ':revealjs_shuffle:',
		'description': 'Randomize slide order',
		'detail' : 'Randomizes the order of slides each time the presentation loads',
		'values' : ['true', 'false'],
	},
	{
		'label' : ':revealjs_autoSlide:',
		'description': 'Auto-slide interval (ms)',
		'detail' : 'Auto-advance slides at the given interval in milliseconds (0 = disabled)',
	},
	{
		'label' : ':revealjs_autoSlideStoppable:',
		'description': 'Stop auto-slide on user input',
		'detail' : 'Stop auto-sliding after user input',
		'values' : ['true', 'false'],
	},
	{
		'label' : ':revealjs_mouseWheel:',
		'description': 'Mouse wheel navigation',
		'detail' : 'Enable slide navigation via mouse wheel',
		'values' : ['true', 'false'],
	},
	{
		'label' : ':revealjs_previewLinks:',
		'description': 'Preview links in iframe overlay',
		'detail' : 'Opens links in an iframe preview overlay',
		'values' : ['true', 'false'],
	},
	{
		'label' : ':revealjs_viewDistance:',
		'description': 'Slides to preload',
		'detail' : 'Number of slides away from the current that are visible (default: 3)',
	},
	{
		'label' : ':revealjs_parallaxBackgroundImage:',
		'description': 'Parallax background image URL',
		'detail' : 'Parallax background image URL (e.g. "https://example.com/bg.jpg")',
	},
	{
		'label' : ':revealjs_parallaxBackgroundSize:',
		'description': 'Parallax background size',
		'detail' : 'Parallax background size in CSS syntax (e.g. "3000px 2000px")',
	},
	{
		'label' : ':revealjs_parallaxBackgroundHorizontal:',
		'description': 'Parallax horizontal movement (px)',
		'detail' : 'Amount of pixels to move the parallax background per horizontal slide step',
	},
	{
		'label' : ':revealjs_parallaxBackgroundVertical:',
		'description': 'Parallax vertical movement (px)',
		'detail' : 'Amount of pixels to move the parallax background per vertical slide step',
	},
	{
		'label' : ':highlightjs-theme:',
		'description': 'Syntax highlighting theme',
		'detail' : 'Syntax highlighting theme for code blocks (see https://highlightjs.org/demo)',
		'values' : ['monokai', 'github', 'github-dark', 'dracula', 'atom-one-dark', 'atom-one-light', 'vs', 'vs2015', 'xcode', 'solarized-light', 'solarized-dark', 'lightfair', 'default'],
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
