import * as assert from 'assert';
import * as vscode from 'vscode';
import * as fs from 'fs';

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Open "demo.adoc"', async () => {
        var document = await vscode.workspace.openTextDocument(__dirname + '/../../demo.adoc');
        assert.ok(document);
        var editor = await vscode.window.showTextDocument(document);
        assert.ok(editor);
    });

    test('Export to HTML', async () => {
        const outputFile : string = 'temp.html';
        var document = await vscode.workspace.openTextDocument(__dirname + '/../../demo.adoc');
        assert.ok(document);
        var editor = await vscode.window.showTextDocument(document);
        assert.ok(editor);
        var ext = vscode.extensions.getExtension('bzzzil.vscode-asciidoc-presentation');
        assert.ok(ext);
        await ext.activate();
        assert.equal(ext.isActive, true);
        var result = await vscode.commands.executeCommand('asciiDocPresentation.exportHtml', [outputFile]);
        assert.ok(result);
        assert.ok(fs.existsSync(outputFile));
        fs.unlinkSync(outputFile);
    });
});
