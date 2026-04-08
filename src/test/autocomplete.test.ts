import * as vscode from 'vscode';
import * as assert from 'assert';

suite('Completion providers', function () {
    this.timeout(20000);

    async function openScratch(content: string) {
        const doc = await vscode.workspace.openTextDocument({ language: 'asciidoc', content });
        const editor = await vscode.window.showTextDocument(doc);
        return { doc, editor };
    }

    async function getCompletionLabels(doc: vscode.TextDocument, pos: vscode.Position): Promise<string[]> {
        const list = await vscode.commands.executeCommand<vscode.CompletionList>(
            'vscode.executeCompletionItemProvider',
            doc.uri,
            pos,
            ':'
        );
        return (list?.items ?? []).map(i =>
            typeof i.label === 'string' ? i.label : (i.label as vscode.CompletionItemLabel).label
        );
    }

    test('Top-level completion items after ":"', async () => {
        const ext = vscode.extensions.getExtension('bzzzil.vscode-asciidoc-presentation');
        assert.ok(ext);
        await ext!.activate();

        const { doc } = await openScratch(':');
        const pos = new vscode.Position(0, 1);

        const labels = await getCompletionLabels(doc, pos);
        assert.ok(labels.length > 0, 'No completion items returned');
        assert.ok(
            labels.includes(':revealjs_theme:'),
            'Expected :revealjs_theme: in completion items'
        );
    });

    test('All expected attribute completion items are present', async () => {
        const ext = vscode.extensions.getExtension('bzzzil.vscode-asciidoc-presentation');
        assert.ok(ext);
        await ext!.activate();

        const { doc } = await openScratch(':');
        const pos = new vscode.Position(0, 1);
        const labels = await getCompletionLabels(doc, pos);

        const expected = [
            ':revealjs_theme:',
            ':revealjs_slideNumber:',
            ':revealjs_center:',
            ':revealjs_customtheme:',
            ':revealjs_controls:',
            ':revealjs_controlsLayout:',
            ':revealjs_controlsBackArrows:',
            ':revealjs_progress:',
            ':revealjs_transition:',
            ':revealjs_transitionSpeed:',
            ':revealjs_backgroundTransition:',
            ':revealjs_hash:',
            ':revealjs_history:',
            ':revealjs_overview:',
            ':revealjs_loop:',
            ':revealjs_rtl:',
            ':revealjs_navigationMode:',
            ':revealjs_touch:',
            ':revealjs_keyboard:',
            ':revealjs_fragments:',
            ':revealjs_shuffle:',
            ':revealjs_autoSlide:',
            ':revealjs_autoSlideStoppable:',
            ':revealjs_mouseWheel:',
            ':revealjs_previewLinks:',
            ':revealjs_viewDistance:',
            ':revealjs_parallaxBackgroundImage:',
            ':revealjs_parallaxBackgroundSize:',
            ':revealjs_parallaxBackgroundHorizontal:',
            ':revealjs_parallaxBackgroundVertical:',
            ':highlightjs-theme:',
            ':kroki-server-url:',
        ];

        for (const label of expected) {
            assert.ok(labels.includes(label), `Expected "${label}" in completion items`);
        }
    });

    test('No extension completion items returned when line has additional text', async () => {
        const ext = vscode.extensions.getExtension('bzzzil.vscode-asciidoc-presentation');
        assert.ok(ext);
        await ext!.activate();

        // The line is ":revealjs_theme: moon" — not a bare ":", so our provider should not fire
        const { doc } = await openScratch(':revealjs_theme: moon');
        const pos = new vscode.Position(0, 5); // cursor in the middle of the attribute name

        const labels = await getCompletionLabels(doc, pos);
        assert.ok(
            !labels.includes(':revealjs_theme:'),
            'Expected no :revealjs_theme: completion when line is not a bare ":"'
        );
    });

    test('Completion insert text omits leading colon', async () => {
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
        assert.ok(list && list.items.length > 0, 'No completion items returned');

        const themeItem = list.items.find(i => {
            const lbl = typeof i.label === 'string' ? i.label : (i.label as vscode.CompletionItemLabel).label;
            return lbl === ':revealjs_theme:';
        });
        assert.ok(themeItem, 'Expected to find :revealjs_theme: completion item');

        // insertText is a SnippetString; it should start with "revealjs_theme:" (no leading colon)
        const insertText = themeItem!.insertText;
        assert.ok(insertText instanceof vscode.SnippetString, 'Expected SnippetString insertText');
        assert.ok(
            (insertText as vscode.SnippetString).value.startsWith('revealjs_theme:'),
            `Expected insertText to start with "revealjs_theme:", got: ${(insertText as vscode.SnippetString).value}`
        );
    });
});