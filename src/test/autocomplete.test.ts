import * as vscode from 'vscode';
import * as assert from 'assert';

suite('Completion providers', function () {
    this.timeout(20000);

    async function openScratch(content: string) {
        const doc = await vscode.workspace.openTextDocument({ language: 'asciidoc', content });
        const editor = await vscode.window.showTextDocument(doc);
        return { doc, editor };
    }

    test('Top-level completion items after ":"', async () => {
        const ext = vscode.extensions.getExtension('bzzzil.vscode-asciidoc-presentation');
        assert.ok(ext);
        await ext!.activate();

        const { doc } = await openScratch(':');
        const pos = new vscode.Position(0, 1);

        const list = await vscode.commands.executeCommand<vscode.CompletionList>(
            'vscode.executeCompletionItemProvider',
            doc.uri,
            pos,
            ':'
        );

        assert.ok(list && list.items && list.items.length > 0, 'No completion items returned');

        const labels = list.items.map(i =>
            typeof i.label === 'string' ? i.label : (i.label as any).label
        );
        assert.ok(
            labels.includes(':revealjs_theme:'),
            'Expected :revealjs_theme: in completion items'
        );
    });
});