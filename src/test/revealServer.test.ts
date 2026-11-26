import * as assert from "assert";
import * as vscode from "vscode";
import { WebSocket as ClientWebSocket } from "ws";
import { isAllowedWebSocketOrigin, parseSlideChangedMessage, RevealServer } from "../RevealServer";

suite("RevealServer Tests", () => {
  let RevealSlides: typeof import("../RevealSlides").RevealSlides;

  suiteSetup(async () => {
    const extension = vscode.extensions.getExtension("bzzzil.vscode-asciidoc-presentation");
    assert.ok(extension);
    if (!extension.isActive) {
      await extension.activate();
    }
    RevealSlides = require("../RevealSlides").RevealSlides;
  });

  test("accepts WebSocket origins that match the request host", () => {
    const token = "test-websocket-token";
    assert.strictEqual(isAllowedWebSocketOrigin("http://basilisk.lan:43000", "basilisk.lan:43000", token, token), true);
    assert.strictEqual(isAllowedWebSocketOrigin("http://[::1]:43000", "[::1]:43000", token, token), true);
  });

  test("rejects missing token, invalid origin, or cross-origin WebSocket requests", () => {
    const token = "test-websocket-token";
    assert.strictEqual(isAllowedWebSocketOrigin(undefined, "basilisk.lan:43000", token, token), false);
    assert.strictEqual(isAllowedWebSocketOrigin("http://basilisk.lan:43000", undefined, token, token), false);
    assert.strictEqual(
      isAllowedWebSocketOrigin("http://basilisk.lan:43000", "basilisk.lan:43000", undefined, token),
      false,
    );
    assert.strictEqual(
      isAllowedWebSocketOrigin("http://basilisk.lan:43000", "basilisk.lan:43000", "wrong-token", token),
      false,
    );
    assert.strictEqual(isAllowedWebSocketOrigin("not-an-origin", "basilisk.lan:43000", token, token), false);
    assert.strictEqual(
      isAllowedWebSocketOrigin("https://basilisk.lan:43000", "basilisk.lan:43000", token, token),
      false,
    );
    assert.strictEqual(
      isAllowedWebSocketOrigin("http://attacker.example:43000", "basilisk.lan:43000", token, token),
      false,
    );
  });

  test("parses valid slide changes and rejects malformed or out-of-range data", () => {
    assert.deepStrictEqual(parseSlideChangedMessage('{"cmd":"slideChanged","slide_h":2,"slide_v":1,"fragment":-1}'), {
      cmd: "slideChanged",
      slide_h: 2,
      slide_v: 1,
      fragment: -1,
    });
    assert.deepStrictEqual(parseSlideChangedMessage('{"cmd":"slideChanged","slide_h":2,"slide_v":1}'), {
      cmd: "slideChanged",
      slide_h: 2,
      slide_v: 1,
    });
    assert.deepStrictEqual(parseSlideChangedMessage('{"cmd":"slideChanged","slide_h":2,"slide_v":1,"fragment":3}'), {
      cmd: "slideChanged",
      slide_h: 2,
      slide_v: 1,
      fragment: 3,
    });
    assert.strictEqual(parseSlideChangedMessage("{"), undefined);
    assert.strictEqual(parseSlideChangedMessage('{"cmd":"goto","slide_h":2,"slide_v":1}'), undefined);
    assert.strictEqual(parseSlideChangedMessage('{"cmd":"slideChanged","slide_h":-1,"slide_v":1}'), undefined);
    assert.strictEqual(parseSlideChangedMessage('{"cmd":"slideChanged","slide_h":1.5,"slide_v":1}'), undefined);
    assert.strictEqual(
      parseSlideChangedMessage('{"cmd":"slideChanged","slide_h":1,"slide_v":1,"fragment":-2}'),
      undefined,
    );
  });

  test("synchronizes a browser slide change to other connected browsers", async () => {
    const extension = vscode.extensions.getExtension("bzzzil.vscode-asciidoc-presentation");
    assert.ok(extension);
    const document = await vscode.workspace.openTextDocument({
      language: "asciidoc",
      content: "= Presentation\n\n== Slide\n\nContent\n",
    });
    const editor = await vscode.window.showTextDocument(document);
    const revealSlides = new RevealSlides(editor);
    const server = new RevealServer(extension.extensionPath, revealSlides, () => undefined);
    let sender: ClientWebSocket | undefined;
    let receiver: ClientWebSocket | undefined;

    try {
      await server.ready;
      const serverUrl = server.serverUrl;
      assert.ok(serverUrl);
      const websocketToken = server.getRenderConfig().websocketToken;
      const websocketUrl = `${serverUrl}/refresh?token=${websocketToken}`;
      const connect = (client: ClientWebSocket) =>
        new Promise<void>((resolve, reject) => {
          client.once("open", resolve);
          client.once("error", reject);
        });

      sender = new ClientWebSocket(websocketUrl, {
        origin: serverUrl,
      });
      receiver = new ClientWebSocket(websocketUrl, {
        origin: serverUrl,
      });
      await Promise.all([
        connect(sender),
        connect(receiver),
      ]);

      const synchronizedMessage = new Promise<unknown>((resolve, reject) => {
        receiver?.once("message", (message) => resolve(JSON.parse(message.toString())));
        receiver?.once("error", reject);
      });
      sender.send(
        JSON.stringify({
          cmd: "slideChanged",
          slide_h: 2,
          slide_v: 1,
          fragment: 3,
        }),
      );

      assert.deepStrictEqual(await synchronizedMessage, {
        cmd: "syncSlide",
        slide_h: 2,
        slide_v: 1,
        fragment: 3,
      });

      const hiddenFragmentsMessage = new Promise<unknown>((resolve, reject) => {
        receiver?.once("message", (message) => resolve(JSON.parse(message.toString())));
        receiver?.once("error", reject);
      });
      sender.send(
        JSON.stringify({
          cmd: "slideChanged",
          slide_h: 2,
          slide_v: 1,
          fragment: -1,
        }),
      );

      assert.deepStrictEqual(await hiddenFragmentsMessage, {
        cmd: "syncSlide",
        slide_h: 2,
        slide_v: 1,
        fragment: -1,
      });
    } finally {
      const close = (client: ClientWebSocket | undefined) =>
        client && client.readyState !== ClientWebSocket.CLOSED
          ? new Promise<void>((resolve) => {
              client.once("close", () => resolve());
              client.close();
            })
          : Promise.resolve();
      await Promise.all([
        close(sender),
        close(receiver),
      ]);
      server.shutdown();
    }
  });
});
