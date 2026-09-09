import * as assert from "assert";
import * as fs from "fs";
import * as vscode from "vscode";

suite("Extension Test Suite", function () {
  vscode.window.showInformationMessage("Start all tests.");
  this.timeout(10000); // 10 seconds for all tests

  test('Open "demo.adoc"', async () => {
    var document = await vscode.workspace.openTextDocument(
      __dirname + "/../../demo.adoc",
    );
    assert.ok(document);
    var editor = await vscode.window.showTextDocument(document);
    assert.ok(editor);
  });

  test("Ensure server started", async () => {
    const outputFile: string = "temp.html";
    var document = await vscode.workspace.openTextDocument(
      __dirname + "/../../demo.adoc",
    );
    assert.ok(document);
    var editor = await vscode.window.showTextDocument(document);
    assert.ok(editor);
    var ext = vscode.extensions.getExtension(
      "bzzzil.vscode-asciidoc-presentation",
    );
    assert.ok(ext);

    const context = await ext.activate();
    assert.equal(ext.isActive, true);
    assert.ok(context);

    // Trigger some server activity by exporting to HTML
    var result = await vscode.commands.executeCommand(
      "asciiDocPresentation.exportHtml",
      [outputFile],
    );
    assert.ok(result);
    assert.ok(fs.existsSync(outputFile));
    fs.unlinkSync(outputFile);

    const containerManager = context.containerManager;
    assert.ok(containerManager);
    const container = containerManager.getOrCreateContainer(editor);
    assert.ok(container);
    const browserUrl = await container.getBrowserUrl();
    assert.ok(browserUrl);
    // The URL should be something like http://127.0.0.1:12345/#/
    assert.ok(browserUrl.match(/http:\/\/127\.0\.0\.1:\d+\/#\//));
  });

  test("Export to HTML", async () => {
    const outputFile: string = "temp.html";
    var document = await vscode.workspace.openTextDocument(
      __dirname + "/../../demo.adoc",
    );
    assert.ok(document);
    var editor = await vscode.window.showTextDocument(document);
    assert.ok(editor);
    var ext = vscode.extensions.getExtension(
      "bzzzil.vscode-asciidoc-presentation",
    );
    assert.ok(ext);
    await ext.activate();
    assert.equal(ext.isActive, true);
    var result = await vscode.commands.executeCommand(
      "asciiDocPresentation.exportHtml",
      [outputFile],
    );
    assert.ok(result);
    assert.ok(fs.existsSync(outputFile));
    fs.unlinkSync(outputFile);
  });

  test("Generate new index.html", async () => {
    const outputFile: string = __dirname + "/../../index.html";
    var document = await vscode.workspace.openTextDocument(
      __dirname + "/../../demo.adoc",
    );
    assert.ok(document);
    var editor = await vscode.window.showTextDocument(document);
    assert.ok(editor);
    var ext = vscode.extensions.getExtension(
      "bzzzil.vscode-asciidoc-presentation",
    );
    assert.ok(ext);
    await ext.activate();
    assert.equal(ext.isActive, true);
    var result = await vscode.commands.executeCommand(
      "asciiDocPresentation.exportHtml",
      [outputFile],
    );
    assert.ok(result);
    assert.ok(fs.existsSync(outputFile));

    let content = fs.readFileSync(outputFile, "utf8");
    let path = content.match(
      /<link rel=\"stylesheet\" href=\"(.+)libs\/reveal\.js\/reset\.css">/,
    );
    assert.ok(path);
    const regex = new RegExp(path[1], "g");
    content = content.replace(regex, "");
    fs.writeFileSync(outputFile, content, "utf8");
  });

  test("showPreview command creates a webview panel", async () => {
    var document = await vscode.workspace.openTextDocument(
      __dirname + "/../../demo.adoc",
    );
    assert.ok(document);
    var editor = await vscode.window.showTextDocument(document);
    assert.ok(editor);
    var ext = vscode.extensions.getExtension(
      "bzzzil.vscode-asciidoc-presentation",
    );
    assert.ok(ext);
    const context = await ext.activate();
    assert.equal(ext.isActive, true);

    await vscode.commands.executeCommand("asciiDocPresentation.preview");

    const container = context.containerManager.getOrCreateContainer(editor);
    assert.ok(
      container.hasWebviewPanel(),
      "Expected webview panel to be created by preview command",
    );
  });

  test("onDidSaveTextDocument with non-asciidoc document does not throw", async () => {
    var document = await vscode.workspace.openTextDocument(
      __dirname + "/../../demo.adoc",
    );
    assert.ok(document);
    var editor = await vscode.window.showTextDocument(document);
    assert.ok(editor);
    var ext = vscode.extensions.getExtension(
      "bzzzil.vscode-asciidoc-presentation",
    );
    assert.ok(ext);
    const context = await ext.activate();
    assert.equal(ext.isActive, true);

    const container = context.containerManager.getOrCreateContainer(editor);
    assert.ok(container);

    // Create a non-asciidoc document and simulate a save event
    const plainDoc = await vscode.workspace.openTextDocument({
      language: "plaintext",
      content: "hello",
    });
    // onDidSaveTextDocument checks languageId and returns early for non-asciidoc
    assert.doesNotThrow(() => {
      container.onDidSaveTextDocument(plainDoc);
    }, "onDidSaveTextDocument should not throw for non-asciidoc documents");
  });
});
