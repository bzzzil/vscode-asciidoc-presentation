import * as path from 'path';
import * as vscode from 'vscode';
import { ContainerManager } from "../ContainerManager";

export async function exportHtml(containerManager: ContainerManager, args: any) {
    const editor = containerManager.checkActiveEditor();

    if (!editor) {
        return;
    }
    
    const container = containerManager.getOrCreateContainer(editor);

    var exportFileLocation: string = "";

    if (args[0] && args[0].length && args[0][0] && args[0][0].length) {
        exportFileLocation = args[0][0];
    } else {
        const proposedFilename = path.join(path.dirname(editor.document.fileName), container.presentationTitle + ".html");
        const uri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(proposedFilename),
            filters: {'HTML': ['html']}});
        if (uri) {
            exportFileLocation = uri.fsPath;
        }
    }

    if (exportFileLocation.length) {
        return container.exportAsHtml(exportFileLocation);
    }
}
