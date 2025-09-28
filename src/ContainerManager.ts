import * as vscode from 'vscode';
import { Container } from './Container';
export class ContainerManager {

    private editorContainerMap: Map<vscode.Uri, Container>;
    private context: vscode.ExtensionContext;
    private logger: (line:string) => void;

    constructor(context: vscode.ExtensionContext, logger: (line: string) => void) {
        this.context = context;
        this.logger = logger;
        this.editorContainerMap = new Map();
    }

    public checkActiveEditor(): vscode.TextEditor | undefined  {
        const editor = vscode.window.activeTextEditor;
        if (!editor || !editor.document || editor.document.languageId !== 'asciidoc') {
            vscode.window.showErrorMessage("Call this command based on an asciidoc document.");
            return;
        }
        return editor;
    }

    public getOrCreateContainer(editor: vscode.TextEditor) {
        if(!this.editorContainerMap.has(editor.document.uri)) {
            this.editorContainerMap.set(editor.document.uri, new Container(this.context, editor, this.logger));
        }
        const container = this.editorContainerMap.get(editor.document.uri);
        if(!container) {
            throw Error('could not create container');
        }
        return container;
    }
}