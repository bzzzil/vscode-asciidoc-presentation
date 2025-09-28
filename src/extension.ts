import * as vscode from 'vscode';
import { exportHtml } from './commands/exportHtml';
import { exportInlinedHtml } from './commands/exportInlinedHtml';
import { showPreview } from './commands/showPreview';
import { openInBrowser } from './commands/openInBrowser';
import { ContainerManager } from './ContainerManager';

export function activate(context: vscode.ExtensionContext) {

	const outputChannel = vscode.window.createOutputChannel("asciiDocPresentation");
	const appendLine = (value: string) => outputChannel.appendLine(value);
	const containerManager = new ContainerManager(context, appendLine);

	context.subscriptions.push(vscode.commands.registerCommand('asciiDocPresentation.preview', () => showPreview(containerManager)));
	context.subscriptions.push(vscode.commands.registerCommand('asciiDocPresentation.exportHtml', (...args: any[]) => exportHtml(containerManager, args)));
	context.subscriptions.push(vscode.commands.registerCommand('asciiDocPresentation.exportInlinedHtml', () => exportInlinedHtml(containerManager)));
	context.subscriptions.push(vscode.commands.registerCommand('asciiDocPresentation.openInBrowser', () => openInBrowser(containerManager)));
}
