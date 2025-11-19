import * as http from 'http';
import * as express from 'express';
import { Request, Response, NextFunction } from 'express';
import * as ejs from 'ejs';
import * as favicon from 'serve-favicon';
import * as path from 'path';
import slash from 'slash';
import { RevealSlides } from './RevealSlides';
import { WebSocket, WebSocketServer } from 'ws';


export class RevealServer {
    private readonly app: express.Express;
    private readonly ejs: typeof ejs;
    private readonly extensionPath: string;
    private readonly server: http.Server;
    private readonly websocketServer: WebSocketServer;
    private logger: (line: string) => void;
    private revealSlides: RevealSlides;

    constructor(extensionPath: string, revealSlides: RevealSlides, logger: (line: string) => void) {
        this.revealSlides = revealSlides;
        this.extensionPath = extensionPath;
        this.logger = logger;
        this.app = express();
        this.ejs = ejs;

        // Set up EJS view engine
        this.app.set('views', path.resolve(this.extensionPath, 'views'));
        this.app.engine('ejs', require('ejs').__express);
        this.app.set('view engine', 'ejs');
        this.app.set('view cache', false);

        this.app.use(favicon(path.join(this.extensionPath, 'media/favicon.png')));

        // Static files
        this.app.use('/libs', express.static(path.join(this.extensionPath, 'libs')));

        // WebSocket server
        this.server = http.createServer(this.app);
        this.webso
        
        
        cketServer = new WebSocketServer({ server: this.server, path: '/refresh' });

        // Routes
        this.app.get('/refresh', (req, res) => {
            res.sendStatus(200); // WebSocket handled separately
        });

        this.app.get('/export-inlined', (req, res) => {
            res.render('reveal', this.getExportRenderConfig(true));
        });

        this.app.get('/export', (req, res) => {
            res.render('reveal', this.getExportRenderConfig(false));
        });

        this.app.get('/', (req, res) => {
            res.render('reveal', this.getRenderConfig());
        });

        // Serve other static files from the document directory
        this.app.use(express.static(this.revealSlides.absoluteDocumentDirectory));

        // Error handling
        this.app.use((err: any, req: Request, res: Response, next: NextFunction) => {
            console.error(err);
            res.status(500).send('Internal Server Error');
        });

        this.server.listen(
            666, "0.0.0.0",
        
        
        
            () => {
            logger(`asciidoc presentation server started at ${this.serverUrl}`);
        });
    }

    publ
    
    
    ic getExportRenderConfig(isInlined: boolean) {
        return {
            slides: this.revealSlides.getSlidesHtmlForExport(isInlined),
            ...this.revealSlides.configuration,
            documentPath: slash(this.revealSlides.absoluteDocumentDirectory) + '/',
            absolutePath: slash(this.extensionPath) + '/',
            isInlined,
            isPreview: false
        };
    }

    public getRenderConfig() {
        return {
            slides: this.revealSlides.revealJsSlidesHtml,
            ...this.revealSlides.configuration,
            websocketUrl: `${this.websocketUrl}/refresh`,
            isPreview: true
    
    
        };
    }

    p
    
    ublic syncCurrentSlideInBrowser(slideId: string) {
        this.websocketServer.clients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ cmd: 'goto', slide: slideId }));
            }
        });
    }

    public get websocketUrl() {
        const addr = this.server.address();
        if (!addr) {
            return null;
        }
        return typeof addr === 'string' ? addr : `ws://localhost:${addr.port}`;
    }

    /kasfd'k;f
    sdsc
    saxadpublic get serverUrl() {
        const addr = this.server.address();
        if (!addr) {
            return null;
        }
        return typeof addr === 'string' ? addr : `http://localhost:${addr.port}`;
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
        this.logger('asciidoc presentation server shutdown');
        this.server.close();
    }
}