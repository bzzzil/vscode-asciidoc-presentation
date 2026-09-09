import * as assert from "assert";
import * as vscode from "vscode";

suite("RevealSlides Tests", function () {
  this.timeout(20000);

  let RevealSlides: typeof import("../RevealSlides").RevealSlides;

  suiteSetup(async function () {
    // Activate the extension first so that the VS Code test host loads all
    // installed extensions (including joaompinto.asciidoctor-vscode).  That
    // extension sets global.Opal to its own older asciidoctor-opal-runtime
    // which DOES support passing arrays to add_stubs() — matching the way
    // @asciidoctor/reveal.js 5.0.1 (compiled with Opal 0.11.99.dev) calls it.
    // Without this, loading out/RevealSlides.js would require @asciidoctor/
    // opal-runtime 3.0.1 directly, whose add_stubs() only accepts strings,
    // causing "TypeError: stubs.split is not a function".
    const ext = vscode.extensions.getExtension(
      "bzzzil.vscode-asciidoc-presentation",
    );
    if (ext && !ext.isActive) {
      await ext.activate();
    }
    RevealSlides = require("../RevealSlides").RevealSlides;
  });

  async function openDoc(
    content: string,
    line = 0,
  ): Promise<vscode.TextEditor> {
    const doc = await vscode.workspace.openTextDocument({
      language: "asciidoc",
      content,
    });
    const editor = await vscode.window.showTextDocument(doc);
    editor.selection = new vscode.Selection(line, 0, line, 0);
    return editor;
  }

  // ── Configuration extraction ──────────────────────────────────────────────

  test("default configuration values are applied when no attributes are set", async () => {
    const editor = await openDoc("= My Title\n\n== Slide\n\nContent\n");
    const slides = new RevealSlides(editor);
    const config = slides.configuration;

    assert.strictEqual(config.title, "My Title");
    assert.strictEqual(config.center, "true");
    assert.strictEqual(config.controls, "true");
    assert.strictEqual(config.controlsLayout, "bottom-right");
    assert.strictEqual(config.controlsBackArrows, "faded");
    assert.strictEqual(config.progress, "false");
    assert.strictEqual(config.slideNumber, "false");
    assert.strictEqual(config.transition, "slide");
    assert.strictEqual(config.transitionSpeed, "default");
    assert.strictEqual(config.backgroundTransition, "fade");
    assert.strictEqual(
      config.highlightJsThemeCss,
      "libs/highlight.js/styles/monokai.css",
    );
    assert.strictEqual(config.themeCss, undefined);
    assert.strictEqual(config.customThemeCss, undefined);
    assert.strictEqual(config.isInlined, false);
    assert.strictEqual(config.hash, "true");
    assert.strictEqual(config.history, "true");
    assert.strictEqual(config.overview, "true");
    assert.strictEqual(config.loop, "false");
    assert.strictEqual(config.rtl, "false");
    assert.strictEqual(config.navigationMode, "default");
    assert.strictEqual(config.touch, "true");
    assert.strictEqual(config.keyboard, "true");
    assert.strictEqual(config.fragments, "true");
    assert.strictEqual(config.shuffle, "false");
    assert.strictEqual(config.autoSlide, "0");
    assert.strictEqual(config.autoSlideStoppable, "true");
    assert.strictEqual(config.mouseWheel, "false");
    assert.strictEqual(config.previewLinks, "false");
    assert.strictEqual(config.viewDistance, "3");
    assert.strictEqual(config.parallaxBackgroundImage, "");
    assert.strictEqual(config.parallaxBackgroundSize, "");
    assert.strictEqual(config.parallaxBackgroundHorizontal, "");
    assert.strictEqual(config.parallaxBackgroundVertical, "");
  });

  test("revealjs_theme attribute sets themeCss path", async () => {
    const editor = await openDoc(
      ":revealjs_theme: moon\n\n= Title\n\n== Slide\n",
    );
    const slides = new RevealSlides(editor);
    assert.strictEqual(
      slides.configuration.themeCss,
      "libs/reveal.js/theme/moon.css",
    );
  });

  test("revealjs_customTheme attribute sets customThemeCss", async () => {
    const editor = await openDoc(
      ":revealjs_customTheme: my/custom.css\n\n= Title\n\n== Slide\n",
    );
    const slides = new RevealSlides(editor);
    assert.strictEqual(slides.configuration.customThemeCss, "my/custom.css");
  });

  test("highlightjs-theme attribute sets highlightJsThemeCss path", async () => {
    const editor = await openDoc(
      ":highlightjs-theme: dracula\n\n= Title\n\n== Slide\n",
    );
    const slides = new RevealSlides(editor);
    assert.strictEqual(
      slides.configuration.highlightJsThemeCss,
      "libs/highlight.js/styles/dracula.css",
    );
  });

  test("revealjs_slideNumber attribute is applied", async () => {
    const editor = await openDoc(
      ":revealjs_slideNumber: true\n\n= Title\n\n== Slide\n",
    );
    const slides = new RevealSlides(editor);
    assert.strictEqual(slides.configuration.slideNumber, "true");
  });

  test("revealjs_transition attribute is applied", async () => {
    const editor = await openDoc(
      ":revealjs_transition: zoom\n\n= Title\n\n== Slide\n",
    );
    const slides = new RevealSlides(editor);
    assert.strictEqual(slides.configuration.transition, "zoom");
  });

  test("revealjs_transitionSpeed attribute is applied", async () => {
    const editor = await openDoc(
      ":revealjs_transitionSpeed: fast\n\n= Title\n\n== Slide\n",
    );
    const slides = new RevealSlides(editor);
    assert.strictEqual(slides.configuration.transitionSpeed, "fast");
  });

  test("revealjs_backgroundTransition attribute is applied", async () => {
    const editor = await openDoc(
      ":revealjs_backgroundTransition: none\n\n= Title\n\n== Slide\n",
    );
    const slides = new RevealSlides(editor);
    assert.strictEqual(slides.configuration.backgroundTransition, "none");
  });

  test("revealjs_center false attribute is applied", async () => {
    const editor = await openDoc(
      ":revealjs_center: false\n\n= Title\n\n== Slide\n",
    );
    const slides = new RevealSlides(editor);
    assert.strictEqual(slides.configuration.center, "false");
  });

  test("revealjs_controls false attribute is applied", async () => {
    const editor = await openDoc(
      ":revealjs_controls: false\n\n= Title\n\n== Slide\n",
    );
    const slides = new RevealSlides(editor);
    assert.strictEqual(slides.configuration.controls, "false");
  });

  test("revealjs_progress true attribute is applied", async () => {
    const editor = await openDoc(
      ":revealjs_progress: true\n\n= Title\n\n== Slide\n",
    );
    const slides = new RevealSlides(editor);
    assert.strictEqual(slides.configuration.progress, "true");
  });

  test("revealjs_controlsLayout edges attribute is applied", async () => {
    const editor = await openDoc(
      ":revealjs_controlsLayout: edges\n\n= Title\n\n== Slide\n",
    );
    const slides = new RevealSlides(editor);
    assert.strictEqual(slides.configuration.controlsLayout, "edges");
  });

  test("revealjs_controlsBackArrows hidden attribute is applied", async () => {
    const editor = await openDoc(
      ":revealjs_controlsBackArrows: hidden\n\n= Title\n\n== Slide\n",
    );
    const slides = new RevealSlides(editor);
    assert.strictEqual(slides.configuration.controlsBackArrows, "hidden");
  });

  test("revealjs_hash false attribute is applied", async () => {
    const editor = await openDoc(
      ":revealjs_hash: false\n\n= Title\n\n== Slide\n",
    );
    const slides = new RevealSlides(editor);
    assert.strictEqual(slides.configuration.hash, "false");
  });

  test("revealjs_history false attribute is applied", async () => {
    const editor = await openDoc(
      ":revealjs_history: false\n\n= Title\n\n== Slide\n",
    );
    const slides = new RevealSlides(editor);
    assert.strictEqual(slides.configuration.history, "false");
  });

  test("revealjs_overview false attribute is applied", async () => {
    const editor = await openDoc(
      ":revealjs_overview: false\n\n= Title\n\n== Slide\n",
    );
    const slides = new RevealSlides(editor);
    assert.strictEqual(slides.configuration.overview, "false");
  });

  test("revealjs_loop true attribute is applied", async () => {
    const editor = await openDoc(
      ":revealjs_loop: true\n\n= Title\n\n== Slide\n",
    );
    const slides = new RevealSlides(editor);
    assert.strictEqual(slides.configuration.loop, "true");
  });

  test("revealjs_rtl true attribute is applied", async () => {
    const editor = await openDoc(
      ":revealjs_rtl: true\n\n= Title\n\n== Slide\n",
    );
    const slides = new RevealSlides(editor);
    assert.strictEqual(slides.configuration.rtl, "true");
  });

  test("revealjs_navigationMode linear attribute is applied", async () => {
    const editor = await openDoc(
      ":revealjs_navigationMode: linear\n\n= Title\n\n== Slide\n",
    );
    const slides = new RevealSlides(editor);
    assert.strictEqual(slides.configuration.navigationMode, "linear");
  });

  test("revealjs_touch false attribute is applied", async () => {
    const editor = await openDoc(
      ":revealjs_touch: false\n\n= Title\n\n== Slide\n",
    );
    const slides = new RevealSlides(editor);
    assert.strictEqual(slides.configuration.touch, "false");
  });

  test("revealjs_keyboard false attribute is applied", async () => {
    const editor = await openDoc(
      ":revealjs_keyboard: false\n\n= Title\n\n== Slide\n",
    );
    const slides = new RevealSlides(editor);
    assert.strictEqual(slides.configuration.keyboard, "false");
  });

  test("revealjs_fragments false attribute is applied", async () => {
    const editor = await openDoc(
      ":revealjs_fragments: false\n\n= Title\n\n== Slide\n",
    );
    const slides = new RevealSlides(editor);
    assert.strictEqual(slides.configuration.fragments, "false");
  });

  test("revealjs_shuffle true attribute is applied", async () => {
    const editor = await openDoc(
      ":revealjs_shuffle: true\n\n= Title\n\n== Slide\n",
    );
    const slides = new RevealSlides(editor);
    assert.strictEqual(slides.configuration.shuffle, "true");
  });

  test("revealjs_autoSlide attribute is applied", async () => {
    const editor = await openDoc(
      ":revealjs_autoSlide: 5000\n\n= Title\n\n== Slide\n",
    );
    const slides = new RevealSlides(editor);
    assert.strictEqual(slides.configuration.autoSlide, "5000");
  });

  test("revealjs_autoSlideStoppable false attribute is applied", async () => {
    const editor = await openDoc(
      ":revealjs_autoSlideStoppable: false\n\n= Title\n\n== Slide\n",
    );
    const slides = new RevealSlides(editor);
    assert.strictEqual(slides.configuration.autoSlideStoppable, "false");
  });

  test("revealjs_mouseWheel true attribute is applied", async () => {
    const editor = await openDoc(
      ":revealjs_mouseWheel: true\n\n= Title\n\n== Slide\n",
    );
    const slides = new RevealSlides(editor);
    assert.strictEqual(slides.configuration.mouseWheel, "true");
  });

  test("revealjs_previewLinks true attribute is applied", async () => {
    const editor = await openDoc(
      ":revealjs_previewLinks: true\n\n= Title\n\n== Slide\n",
    );
    const slides = new RevealSlides(editor);
    assert.strictEqual(slides.configuration.previewLinks, "true");
  });

  test("revealjs_viewDistance attribute is applied", async () => {
    const editor = await openDoc(
      ":revealjs_viewDistance: 5\n\n= Title\n\n== Slide\n",
    );
    const slides = new RevealSlides(editor);
    assert.strictEqual(slides.configuration.viewDistance, "5");
  });

  test("revealjs_parallaxBackgroundImage attribute is applied", async () => {
    const editor = await openDoc(
      ":revealjs_parallaxBackgroundImage: https://example.com/bg.jpg\n\n= Title\n\n== Slide\n",
    );
    const slides = new RevealSlides(editor);
    assert.strictEqual(
      slides.configuration.parallaxBackgroundImage,
      "https://example.com/bg.jpg",
    );
  });

  test("revealjs_parallaxBackgroundSize attribute is applied", async () => {
    const editor = await openDoc(
      ":revealjs_parallaxBackgroundSize: 3000px 2000px\n\n= Title\n\n== Slide\n",
    );
    const slides = new RevealSlides(editor);
    assert.strictEqual(
      slides.configuration.parallaxBackgroundSize,
      "3000px 2000px",
    );
  });

  test("revealjs_parallaxBackgroundHorizontal attribute is applied", async () => {
    const editor = await openDoc(
      ":revealjs_parallaxBackgroundHorizontal: 200\n\n= Title\n\n== Slide\n",
    );
    const slides = new RevealSlides(editor);
    assert.strictEqual(
      slides.configuration.parallaxBackgroundHorizontal,
      "200",
    );
  });

  test("revealjs_parallaxBackgroundVertical attribute is applied", async () => {
    const editor = await openDoc(
      ":revealjs_parallaxBackgroundVertical: 50\n\n= Title\n\n== Slide\n",
    );
    const slides = new RevealSlides(editor);
    assert.strictEqual(slides.configuration.parallaxBackgroundVertical, "50");
  });

  // ── Slide ID under cursor ─────────────────────────────────────────────────

  test("currentSlideId is empty when cursor is at title (line 0)", async () => {
    // line 0 = "= Title", before any == sections
    const content =
      "= Title\n\n== Section One\n\nContent\n\n== Section Two\n\nMore\n";
    const editor = await openDoc(content, 0);
    const slides = new RevealSlides(editor);
    assert.strictEqual(slides.currentSlideId, "");
  });

  test("currentSlideId is empty when cursor is in preamble before first section", async () => {
    // line 2 = "Preamble text", still before first ==
    const content = "= Title\n\nPreamble text\n\n== Section One\n\nContent\n";
    const editor = await openDoc(content, 2);
    const slides = new RevealSlides(editor);
    assert.strictEqual(slides.currentSlideId, "");
  });

  test("currentSlideId identifies the first section", async () => {
    // line 2 = "== Section One"
    const content =
      "= Title\n\n== Section One\n\nContent\n\n== Section Two\n\nMore\n";
    const editor = await openDoc(content, 2);
    const slides = new RevealSlides(editor);
    assert.ok(slides.currentSlideId.length > 0, "Expected non-empty slide ID");
    assert.ok(
      slides.currentSlideId.toLowerCase().includes("section_one") ||
        slides.currentSlideId.toLowerCase().includes("section-one"),
      `Expected slide ID to reference "Section One", got: ${slides.currentSlideId}`,
    );
  });

  test("currentSlideId identifies the last section when cursor is past it", async () => {
    // line 8 = last content line, after "== Section Two" (line 6)
    const content =
      "= Title\n\n== Section One\n\nContent\n\n== Section Two\n\nMore content\n";
    const editor = await openDoc(content, 8);
    const slides = new RevealSlides(editor);
    assert.ok(slides.currentSlideId.length > 0, "Expected non-empty slide ID");
    assert.ok(
      slides.currentSlideId.toLowerCase().includes("section_two") ||
        slides.currentSlideId.toLowerCase().includes("section-two"),
      `Expected slide ID to reference "Section Two", got: ${slides.currentSlideId}`,
    );
  });

  test("currentSlideId identifies a subsection", async () => {
    // line 4 = "=== Sub Section"
    const content =
      "= Title\n\n== Section One\n\n=== Sub Section\n\nSub content\n\n== Section Two\n\nMore\n";
    const editor = await openDoc(content, 4);
    const slides = new RevealSlides(editor);
    assert.ok(
      slides.currentSlideId.length > 0,
      "Expected non-empty slide ID for subsection",
    );
    assert.ok(
      slides.currentSlideId.toLowerCase().includes("sub_section") ||
        slides.currentSlideId.toLowerCase().includes("sub-section"),
      `Expected slide ID to reference "Sub Section", got: ${slides.currentSlideId}`,
    );
  });

  test("currentSlideId identifies parent section when cursor is on its header, before subsection", async () => {
    // line 2 = "== Section One", before the subsection at line 4
    const content =
      "= Title\n\n== Section One\n\n=== Sub Section\n\nSub content\n";
    const editor = await openDoc(content, 2);
    const slides = new RevealSlides(editor);
    assert.ok(
      slides.currentSlideId.toLowerCase().includes("section_one") ||
        slides.currentSlideId.toLowerCase().includes("section-one"),
      `Expected slide ID to reference "Section One", got: ${slides.currentSlideId}`,
    );
  });

  // ── HTML generation ───────────────────────────────────────────────────────

  test("revealJsSlidesHtml returns non-empty HTML containing <section> elements", async () => {
    const editor = await openDoc(
      "= Title\n\n== Slide One\n\nContent\n\n== Slide Two\n\nMore\n",
    );
    const slides = new RevealSlides(editor);
    const html = slides.revealJsSlidesHtml;
    assert.ok(html && html.length > 0, "Expected non-empty HTML");
    assert.ok(
      html.includes("<section"),
      "Expected HTML to contain <section> elements",
    );
  });

  test("revealJsSlidesHtml includes slide titles from the document", async () => {
    const editor = await openDoc(
      "= Presentation Title\n\n== Hello World\n\nBody text\n",
    );
    const slides = new RevealSlides(editor);
    const html = slides.revealJsSlidesHtml;
    assert.ok(
      html.includes("Hello World"),
      "Expected slide title in generated HTML",
    );
  });

  test("getSlidesHtmlForExport(false) returns non-empty HTML", async () => {
    const editor = await openDoc("= Title\n\n== Slide\n\nContent\n");
    const slides = new RevealSlides(editor);
    const html = slides.getSlidesHtmlForExport(false);
    assert.ok(html && html.length > 0, "Expected non-empty HTML for export");
    assert.ok(
      html.includes("<section"),
      "Expected HTML to contain <section> elements",
    );
  });

  test("getSlidesHtmlForExport(true) returns non-empty HTML", async () => {
    const editor = await openDoc("= Title\n\n== Slide\n\nContent\n");
    const slides = new RevealSlides(editor);
    const html = slides.getSlidesHtmlForExport(true);
    assert.ok(
      html && html.length > 0,
      "Expected non-empty HTML for inlined export",
    );
  });

  // ── update() ─────────────────────────────────────────────────────────────

  test("update() reflects changed document content", async () => {
    const editor = await openDoc("= Title\n\n== Original Slide\n\nContent\n");
    const slides = new RevealSlides(editor);

    assert.ok(
      slides.revealJsSlidesHtml.includes("Original Slide"),
      'Expected initial HTML to contain "Original Slide"',
    );

    const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
    const fullRange = new vscode.Range(
      new vscode.Position(0, 0),
      lastLine.range.end,
    );
    const editApplied = await editor.edit((editBuilder) => {
      editBuilder.replace(
        fullRange,
        "= Title\n\n== Updated Slide\n\nContent\n",
      );
    });
    assert.ok(editApplied, "Expected document edit to succeed");

    slides.update();

    assert.ok(
      slides.revealJsSlidesHtml.includes("Updated Slide"),
      'Expected updated HTML to contain "Updated Slide"',
    );
  });

  test("update() reflects changed attribute values", async () => {
    const editor = await openDoc("= Title\n\n== Slide\n\nContent\n");
    const slides = new RevealSlides(editor);
    assert.strictEqual(slides.configuration.transition, "slide");

    const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
    const fullRange = new vscode.Range(
      new vscode.Position(0, 0),
      lastLine.range.end,
    );
    await editor.edit((editBuilder) => {
      editBuilder.replace(
        fullRange,
        ":revealjs_transition: zoom\n\n= Title\n\n== Slide\n\nContent\n",
      );
    });

    slides.update();

    assert.strictEqual(slides.configuration.transition, "zoom");
  });

  // ── editor / path accessors ───────────────────────────────────────────────

  test("editor getter returns the underlying text editor", async () => {
    const editor = await openDoc("= Title\n\n== Slide\n");
    const slides = new RevealSlides(editor);
    assert.strictEqual(slides.editor, editor);
  });
});
