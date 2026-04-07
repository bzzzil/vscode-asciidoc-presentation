import * as vscode from 'vscode';
import * as assert from 'assert';

suite('ContainerManager Tests', function () {
    this.timeout(20000);

    let containerManager: any;

    suiteSetup(async () => {
        const ext = vscode.extensions.getExtension('bzzzil.vscode-asciidoc-presentation');
        assert.ok(ext, 'Extension not found');
        const context = await ext!.activate();
        containerManager = context.containerManager;
    });

    test('checkActiveEditor returns editor when an asciidoc document is active', async () => {
        const doc = await vscode.workspace.openTextDocument({ language: 'asciidoc', content: '= Test\n\n== Slide\n' });
        await vscode.window.showTextDocument(doc);

        const editor = containerManager.checkActiveEditor();
        assert.ok(editor, 'Expected editor to be returned for asciidoc document');
        assert.strictEqual(editor.document.languageId, 'asciidoc');
    });

    test('checkActiveEditor returns undefined when a non-asciidoc document is active', async () => {
        const doc = await vscode.workspace.openTextDocument({ language: 'plaintext', content: 'plain text' });
        await vscode.window.showTextDocument(doc);

        const editor = containerManager.checkActiveEditor();
        assert.strictEqual(editor, undefined, 'Expected undefined for non-asciidoc document');
    });

    test('getOrCreateContainer creates and returns a container', async () => {
        const doc = await vscode.workspace.openTextDocument({ language: 'asciidoc', content: '= Test\n\n== Slide\n' });
        const editor = await vscode.window.showTextDocument(doc);

        const container = containerManager.getOrCreateContainer(editor);
        assert.ok(container, 'Expected container to be created');
    });

    test('getOrCreateContainer returns the same container for the same document URI', async () => {
        const doc = await vscode.workspace.openTextDocument({ language: 'asciidoc', content: '= Test\n\n== Slide\n' });
        const editor = await vscode.window.showTextDocument(doc);

        const container1 = containerManager.getOrCreateContainer(editor);
        const container2 = containerManager.getOrCreateContainer(editor);
        assert.strictEqual(container1, container2, 'Expected same container for same editor URI');
    });

    test('container has no webview panel immediately after creation', async () => {
        const doc = await vscode.workspace.openTextDocument({ language: 'asciidoc', content: '= Fresh\n\n== New Slide\n' });
        const editor = await vscode.window.showTextDocument(doc);

        const container = containerManager.getOrCreateContainer(editor);
        assert.strictEqual(container.hasWebviewPanel(), false, 'Expected no webview panel on freshly created container');
    });
});
