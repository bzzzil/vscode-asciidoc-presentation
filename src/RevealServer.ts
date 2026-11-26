import * as http from "http";
import * as os from "os";

import express = require("express");

import * as ejs from "ejs";
import { NextFunction, Request, Response } from "express";

import favicon = require("serve-favicon");

import * as path from "path";
import slash from "slash";
import { WebSocket, WebSocketServer } from "ws";
import { RevealSlides } from "./RevealSlides";

type SlideChangedMessage = {
  cmd: "slideChanged";
  slide_h: number;
  slide_v: number;
  fragment?: number;
};

export function isAllowedWebSocketOrigin(origin: string | undefined, host: string | undefined) {
  if (!origin || !host) {
    return false;
  }

  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(`http://${host}`);
    return originUrl.protocol === "http:" && originUrl.origin === requestUrl.origin;
  } catch {
    return false;
  }
}

export function parseSlideChangedMessage(message: string): SlideChangedMessage | undefined {
  let value: unknown;
  try {
    value = JSON.parse(message);
  } catch {
    return undefined;
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const data = value as Record<string, unknown>;
  const slideH = data.slide_h;
  const slideV = data.slide_v;
  const fragment = data.fragment;
  if (
    data.cmd !== "slideChanged" ||
    typeof slideH !== "number" ||
    !Number.isSafeInteger(slideH) ||
    slideH < 0 ||
    typeof slideV !== "number" ||
    !Number.isSafeInteger(slideV) ||
    slideV < 0 ||
    (fragment !== undefined && (typeof fragment !== "number" || !Number.isSafeInteger(fragment) || fragment < -1))
  ) {
    return undefined;
  }

  return {
    cmd: "slideChanged",
    slide_h: slideH,
    slide_v: slideV,
    ...(fragment === undefined
      ? {}
      : {
          fragment,
        }),
  };
}

export class RevealServer {
  private readonly app: express.Express;
  private readonly ejs: typeof ejs;
  private readonly extensionPath: string;
  private readonly server: http.Server;
  private readonly websocketServer: WebSocketServer;
  private readonly websocketPath: string = "/refresh";
  private readonly _ready: Promise<void>;
  private readonly remoteControlEnabled: boolean;
  private logger: (line: string) => void;
  private revealSlides: RevealSlides;
  private currentSlide?: SlideChangedMessage;

  constructor(
    extensionPath: string,
    revealSlides: RevealSlides,
    logger: (line: string) => void,
    remoteControlEnabled = false,
  ) {
    this.revealSlides = revealSlides;
    this.extensionPath = extensionPath;
    this.logger = logger;
    this.remoteControlEnabled = remoteControlEnabled;
    this.app = express();
    this.ejs = ejs;

    // Set up EJS view engine
    this.app.set("views", path.resolve(this.extensionPath, "views"));
    this.app.engine("ejs", require("ejs").__express);
    this.app.set("view engine", "ejs");
    this.app.set("view cache", false);

    this.app.use(favicon(path.join(this.extensionPath, "media/favicon.png")));

    // Static files
    this.app.use("/libs", express.static(path.join(this.extensionPath, "libs")));

    // WebSocket server
    this.server = http.createServer(this.app);
    this.websocketServer = new WebSocketServer({
      noServer: true,
      maxPayload: 1024,
    });
    this.server.on("upgrade", (request, socket, head) => {
      let requestUrl: URL;
      try {
        requestUrl = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
      } catch {
        socket.end("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
        return;
      }

      if (
        requestUrl.pathname !== this.websocketPath ||
        requestUrl.search !== "" ||
        !isAllowedWebSocketOrigin(request.headers.origin, request.headers.host)
      ) {
        socket.end("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
        return;
      }

      this.websocketServer.handleUpgrade(request, socket, head, (ws) => {
        this.websocketServer.emit("connection", ws, request);
      });
    });

    this.websocketServer.on("connection", (ws) => {
      logger("WebSocket client connected");
      if (this.currentSlide) {
        ws.send(
          JSON.stringify({
            ...this.currentSlide,
            cmd: "syncSlide",
          }),
        );
      }
      ws.on("close", () => {
        logger("WebSocket client disconnected");
      });

      ws.on("message", (message) => {
        const data = parseSlideChangedMessage(message.toString());
        if (!data) {
          logger("Ignored invalid WebSocket message");
          return;
        }

        this.currentSlide = data;
        this.websocketServer.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(
              JSON.stringify({
                ...data,
                cmd: "syncSlide",
              }),
            );
          }
        });
      });
    });

    // Routes
    this.app.get(this.websocketPath, (req, res) => {
      res.sendStatus(200); // WebSocket handled separately
    });

    this.app.get("/export-inlined", async (req, res) => {
      res.render("reveal", await this.getExportRenderConfig(true));
    });

    this.app.get("/export", async (req, res) => {
      res.render("reveal", await this.getExportRenderConfig(false));
    });

    this.app.get("/", async (req, res) => {
      res.render("reveal", await this.getRenderConfig());
    });

    // Serve other static files from the document directory
    this.app.use(express.static(this.revealSlides.absoluteDocumentDirectory));
    logger(`asciidoc presentation server static from ${this.revealSlides.absoluteDocumentDirectory}`);

    // Error handling
    this.app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      console.error(err);
      res.status(500).send("Internal Server Error");
    });

    this._ready = new Promise((resolve, reject) => {
      this.server.once("error", reject);
      this.server.listen(0, this.remoteControlEnabled ? "0.0.0.0" : "127.0.0.1", () => {
        this.server.off("error", reject);
        logger(`asciidoc presentation server started at ${this.serverUrl}`);
        if (this.remoteControlEnabled) {
          logger("Remote access is enabled. Devices on the local network can view and control this presentation.");
          this.logRemotePreviewUrls();
        }
        resolve();
      });
    });
  }

  public get ready() {
    return this._ready;
  }

  public async getExportRenderConfig(isInlined: boolean) {
    return {
      slides: await this.revealSlides.getSlidesHtmlForExport(isInlined),
      ...this.revealSlides.configuration,
      documentPath: slash(this.revealSlides.absoluteDocumentDirectory) + "/",
      absolutePath: slash(this.extensionPath) + "/",
      isInlined,
      isPreview: false,
    };
  }

  public async getRenderConfig() {
    return {
      slides: await this.revealSlides.revealJsSlidesHtml,
      ...this.revealSlides.configuration,
      websocketPath: this.websocketPath,
      isPreview: true,
    };
  }

  public syncCurrentSlideInBrowser(slideId: string) {
    this.currentSlide = undefined;
    this.websocketServer.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            cmd: "goto",
            slide: slideId,
          }),
        );
      }
    });
  }

  private logRemotePreviewUrls() {
    const address = this.server.address();
    if (!address || typeof address === "string") {
      return;
    }

    const slideId = this.revealSlides.currentSlideId;
    const slideHash = slideId ? `/${encodeURIComponent(slideId)}` : "/";
    const networkInterfaces = os.networkInterfaces();
    let loggedUrl = false;
    for (const interfaceName of Object.keys(networkInterfaces)) {
      const addresses = networkInterfaces[interfaceName] ?? [];
      for (const networkAddress of addresses) {
        if (networkAddress.family === "IPv4" && !networkAddress.internal) {
          this.logger(`Remote presentation URL: http://${networkAddress.address}:${address.port}/#${slideHash}`);
          loggedUrl = true;
        }
      }
    }

    if (!loggedUrl) {
      this.logger("No non-loopback IPv4 addresses found for remote presentation access.");
    }
  }

  public get serverUrl() {
    const addr = this.server.address();
    if (!addr) {
      return null;
    }
    if (typeof addr === "string") {
      return addr;
    }
    if (addr.address === "::" || addr.address === "0.0.0.0") {
      return `http://localhost:${addr.port}`;
    }

    if (addr.family === "IPv6") {
      return `http://[${addr.address}]:${addr.port}`;
    }

    return `http://${addr.address}:${addr.port}`;
  }

  public get previewUrl() {
    return `${this.serverUrl}/#/`;
  }

  public get exportUrl() {
    return `${this.serverUrl}/export`;
  }

  public get exportInlinedUrl() {
    return `${this.serverUrl}/export-inlined`;
  }

  public shutdown() {
    this.logger("asciidoc presentation server shutdown");
    this.websocketServer.clients.forEach((client) => client.close(1001, "Server shutting down"));
    this.websocketServer.close();
    this.server.close();
  }
}
