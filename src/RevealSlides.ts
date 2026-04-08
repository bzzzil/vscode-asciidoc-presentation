import { Asciidoctor } from 'asciidoctor/types/index';
import * as path from 'path';
import * as vscode from 'vscode';
/**
 * Check if Opal has been loaded already, if not, require through asciidoctor.js
 * workaround to don't bridge opal runtime again because it will throw.
 * This can happen if other extensions like joaompinto.asciidoctor-vscode
 * have already required('opal-runtime') or required('asciidoctor.js') or similar
 * and thereby already bridged opal.
 * So we still tied to asciidoctor/reveal.js 5.0.1
 *  */
const asciidoctor: Asciidoctor = ((<any>global).Opal && (<any>global).Opal.Asciidoctor) || require('@asciidoctor/core')();
const asciidoctorRevealjs = require('@asciidoctor/reveal.js');
const kroki = require("asciidoctor-kroki");
asciidoctorRevealjs.register();
kroki.register(asciidoctor.Extensions);

export type AsciidocAttributes = {
    title: string,
    authors: string,
    revDate: string,
    imageDir: string,
    revealJsTheme: string,
    revealJsCustomTheme: string | undefined,
    revealJsSlideNumber: string,
    revealJsCenter: string,
    revealJsControls: string,
    revealJsControlsLayout: string,
    revealJsControlsBackArrows: string,
    revealJsProgress: string,
    highlightJsTheme: string,
    revealJsTransition: string,
    revealJsTransitionSpeed: string,
    revealJsBackgroundTransition: string,
    revealJsHash: string,
    revealJsHistory: string,
    revealJsOverview: string,
    revealJsLoop: string,
    revealJsRtl: string,
    revealJsNavigationMode: string,
    revealJsTouch: string,
    revealJsKeyboard: string,
    revealJsFragments: string,
    revealJsShuffle: string,
    revealJsAutoSlide: string,
    revealJsAutoSlideStoppable: string,
    revealJsMouseWheel: string,
    revealJsPreviewLinks: string,
    revealJsViewDistance: string,
    revealJsParallaxBackgroundImage: string,
    revealJsParallaxBackgroundSize: string,
    revealJsParallaxBackgroundHorizontal: string,
    revealJsParallaxBackgroundVertical: string,
}

export type RevealConfiguration = {
    absolutePath: string,
    documentPath: string,
    title: string,
    authors: string,
    revDate: string,
    themeCss: string | undefined,
    customThemeCss: string | undefined,
    slideNumber: string,
    center: string,
    controls: string,
    controlsLayout: string,
    controlsBackArrows: string,
    progress: string,
    highlightJsThemeCss: string,
    isInlined: boolean,
    transition: string,
    transitionSpeed: string,
    backgroundTransition: string,
    hash: string,
    history: string,
    overview: string,
    loop: string,
    rtl: string,
    navigationMode: string,
    touch: string,
    keyboard: string,
    fragments: string,
    shuffle: string,
    autoSlide: string,
    autoSlideStoppable: string,
    mouseWheel: string,
    previewLinks: string,
    viewDistance: string,
    parallaxBackgroundImage: string,
    parallaxBackgroundSize: string,
    parallaxBackgroundHorizontal: string,
    parallaxBackgroundVertical: string,
}

function docAccessor(asciidocText: string, docDir: string) {

    const doc = asciidoctor.load(asciidocText, {safe: 'safe', header_footer: true, attributes: {docDir}});
    return {
        getAttributeOrDefault: <T>(key: string, defaultValue?: T): T|string => {
            return doc.getAttribute(key.toLowerCase(), defaultValue);
        },
        getTitle: () => {
            return doc.getTitle();
        },
        getFullAttributes() {
            return doc.getAttributes();
        }
    };
}

export class RevealSlides {

    private baseEditor: vscode.TextEditor;
    private slidesHtml: string;
    private asciidocAttributes: AsciidocAttributes;
    private slideIdUnderCursor: string;
    private revealConfiguration: RevealConfiguration;

    constructor (editor: vscode.TextEditor) {
        this.baseEditor = editor;
        this.asciidocAttributes = this.extractAsciidocAttributes(editor.document.getText());
        this.revealConfiguration = this.extractRevealConfiguration(this.asciidocAttributes);
        this.slidesHtml = this.convertToRevealJsSlides(editor.document.getText());
        this.slideIdUnderCursor = this.getSlideIdUnderCursor(editor.document.getText(), editor.selection.active.line);
    }

    private convertToRevealJsSlides(asciidocText: string) {
        return asciidoctor.convert(asciidocText, { safe: 'safe', backend: 'revealjs', attributes: {docDir: this.absoluteDocumentDirectory}}) as string;
    }

    private extractAsciidocAttributes(asciidocText: string): AsciidocAttributes {
        const accessor = docAccessor(asciidocText, this.absoluteDocumentDirectory);
        return {
            ...accessor.getFullAttributes(),
            title: accessor.getTitle(),
            imageDir: accessor.getAttributeOrDefault('imagesDir', ''),
            revealJsTheme: accessor.getAttributeOrDefault('revealjs_theme', undefined),
            revealJsCustomTheme: accessor.getAttributeOrDefault('revealjs_customTheme', undefined),
            revealJsCenter: accessor.getAttributeOrDefault('revealjs_center', 'true'),
            revealJsControls: accessor.getAttributeOrDefault('revealjs_controls', 'true'),
            revealJsControlsLayout: accessor.getAttributeOrDefault('revealjs_controlsLayout', 'bottom-right'),
            revealJsControlsBackArrows: accessor.getAttributeOrDefault('revealjs_controlsBackArrows', 'faded'),
            revealJsProgress: accessor.getAttributeOrDefault('revealjs_progress', 'false'),
            revealJsSlideNumber: accessor.getAttributeOrDefault('revealjs_slideNumber', 'false'),
            highlightJsTheme: accessor.getAttributeOrDefault('highlightjs-theme', 'monokai'),
            revealJsTransition: accessor.getAttributeOrDefault('revealjs_transition', 'slide'),
            revealJsTransitionSpeed: accessor.getAttributeOrDefault('revealjs_transitionSpeed', 'default'),
            revealJsBackgroundTransition: accessor.getAttributeOrDefault('revealjs_backgroundTransition', 'fade'),
            revealJsHash: accessor.getAttributeOrDefault('revealjs_hash', 'true'),
            revealJsHistory: accessor.getAttributeOrDefault('revealjs_history', 'true'),
            revealJsOverview: accessor.getAttributeOrDefault('revealjs_overview', 'true'),
            revealJsLoop: accessor.getAttributeOrDefault('revealjs_loop', 'false'),
            revealJsRtl: accessor.getAttributeOrDefault('revealjs_rtl', 'false'),
            revealJsNavigationMode: accessor.getAttributeOrDefault('revealjs_navigationMode', 'default'),
            revealJsTouch: accessor.getAttributeOrDefault('revealjs_touch', 'true'),
            revealJsKeyboard: accessor.getAttributeOrDefault('revealjs_keyboard', 'true'),
            revealJsFragments: accessor.getAttributeOrDefault('revealjs_fragments', 'true'),
            revealJsShuffle: accessor.getAttributeOrDefault('revealjs_shuffle', 'false'),
            revealJsAutoSlide: accessor.getAttributeOrDefault('revealjs_autoSlide', '0'),
            revealJsAutoSlideStoppable: accessor.getAttributeOrDefault('revealjs_autoSlideStoppable', 'true'),
            revealJsMouseWheel: accessor.getAttributeOrDefault('revealjs_mouseWheel', 'false'),
            revealJsPreviewLinks: accessor.getAttributeOrDefault('revealjs_previewLinks', 'false'),
            revealJsViewDistance: accessor.getAttributeOrDefault('revealjs_viewDistance', '3'),
            revealJsParallaxBackgroundImage: accessor.getAttributeOrDefault('revealjs_parallaxBackgroundImage', ''),
            revealJsParallaxBackgroundSize: accessor.getAttributeOrDefault('revealjs_parallaxBackgroundSize', ''),
            revealJsParallaxBackgroundHorizontal: accessor.getAttributeOrDefault('revealjs_parallaxBackgroundHorizontal', ''),
            revealJsParallaxBackgroundVertical: accessor.getAttributeOrDefault('revealjs_parallaxBackgroundVertical', ''),
        };
    }

    private extractRevealConfiguration(asciidocAttributes: AsciidocAttributes) : RevealConfiguration {
        return {
            absolutePath: '',
            documentPath: '',
            title: asciidocAttributes.title,
            authors : asciidocAttributes.authors,
            revDate : asciidocAttributes.revDate,
            slideNumber: asciidocAttributes.revealJsSlideNumber,
            center : asciidocAttributes.revealJsCenter,
            controls: asciidocAttributes.revealJsControls,
            controlsLayout: asciidocAttributes.revealJsControlsLayout,
            controlsBackArrows: asciidocAttributes.revealJsControlsBackArrows,
            progress : asciidocAttributes.revealJsProgress,
            themeCss: asciidocAttributes.revealJsTheme ? `libs/reveal.js/theme/${asciidocAttributes.revealJsTheme}.css`: undefined,
            customThemeCss: asciidocAttributes.revealJsCustomTheme,
            highlightJsThemeCss: `libs/highlight.js/styles/${asciidocAttributes.highlightJsTheme}.css`,
            transition: asciidocAttributes.revealJsTransition,
            transitionSpeed: asciidocAttributes.revealJsTransitionSpeed,
            backgroundTransition: asciidocAttributes.revealJsBackgroundTransition,
            hash: asciidocAttributes.revealJsHash,
            history: asciidocAttributes.revealJsHistory,
            overview: asciidocAttributes.revealJsOverview,
            loop: asciidocAttributes.revealJsLoop,
            rtl: asciidocAttributes.revealJsRtl,
            navigationMode: asciidocAttributes.revealJsNavigationMode,
            touch: asciidocAttributes.revealJsTouch,
            keyboard: asciidocAttributes.revealJsKeyboard,
            fragments: asciidocAttributes.revealJsFragments,
            shuffle: asciidocAttributes.revealJsShuffle,
            autoSlide: asciidocAttributes.revealJsAutoSlide,
            autoSlideStoppable: asciidocAttributes.revealJsAutoSlideStoppable,
            mouseWheel: asciidocAttributes.revealJsMouseWheel,
            previewLinks: asciidocAttributes.revealJsPreviewLinks,
            viewDistance: asciidocAttributes.revealJsViewDistance,
            parallaxBackgroundImage: asciidocAttributes.revealJsParallaxBackgroundImage,
            parallaxBackgroundSize: asciidocAttributes.revealJsParallaxBackgroundSize,
            parallaxBackgroundHorizontal: asciidocAttributes.revealJsParallaxBackgroundHorizontal,
            parallaxBackgroundVertical: asciidocAttributes.revealJsParallaxBackgroundVertical,
            isInlined: false,
        };
    }

    private getSlideIdUnderCursor (asciidocText: string, lineNumber: number) {
        const doc = asciidoctor.load(asciidocText, {safe: 'safe', header_footer: true, sourcemap: true});

        try{
            const sections = doc.getSections();
            if(!sections) {
                return ''; // title slide
            }

            const lineInAsciidoc = lineNumber + 1;
            const indexOfSectionAfterCursor = sections.findIndex(s => s.getLineNumber() > lineInAsciidoc);

            if(indexOfSectionAfterCursor === 0) {
                return ''; // title slide
            } else if (indexOfSectionAfterCursor === -1) {
                const lastSection = sections ? sections[sections.length-1] : undefined;
                return lastSection ? lastSection.getId() : '';
            }

            const currentSection = sections[indexOfSectionAfterCursor - 1];
            const subSections = currentSection.getSections();

            if(!subSections || subSections.length <= 0) {
                return sections[indexOfSectionAfterCursor - 1].getId();
            }

            const indexOfSubSectionAfterCursor = subSections.findIndex(ss => ss.getLineNumber() > lineInAsciidoc);

            if(indexOfSubSectionAfterCursor === 0) {
                return currentSection.getId();
            } else if(indexOfSubSectionAfterCursor === -1) {
                return subSections[subSections.length - 1].getId();
            } else {
                return subSections[indexOfSubSectionAfterCursor - 1].getId();
            }
        } catch (e) {
            console.error(e);
            return '';
        }
    }

    public get editor() {
        return this.baseEditor;
    }

    public get revealJsSlidesHtml() {
        return this.slidesHtml;
    }

    public getSlidesHtmlForExport(forInlined: boolean) {
        const attributes: any = {
            docDir: this.absoluteDocumentDirectory,
            imagesDir: this.absoluteImagesDir
        };
        return asciidoctor.convert(this.editor.document.getText(), {
            safe: 'safe',
            backend: 'revealjs',
            attributes
        }) as string;
    }

    public get configuration() {
        return this.revealConfiguration;
    }

    public get absoluteDocumentDirectory() {
        return path.dirname(this.baseEditor.document.fileName);
    }

    public get absoluteImagesDir() {
        return path.join(this.absoluteDocumentDirectory, this.asciidocAttributes.imageDir);
    }

    public get currentSlideId() {
        return this.slideIdUnderCursor;
    }

    public update() {

        this.refreshReferenceToMyEditor();

        const asciidocText = this.editor.document.getText();
        this.asciidocAttributes = this.extractAsciidocAttributes(asciidocText);
        this.revealConfiguration = this.extractRevealConfiguration(this.asciidocAttributes);
        this.slidesHtml = this.convertToRevealJsSlides(asciidocText);
        this.slideIdUnderCursor = this.getSlideIdUnderCursor(asciidocText, this.baseEditor.selection.start.line);
    }

    // workaround for bug: selection of this.baseEditor stays the same as soon as we save another document ...
    private refreshReferenceToMyEditor() {
        const freshReferenceToBaseEditor = vscode.window.visibleTextEditors.find(e => e.document.uri === this.baseEditor.document.uri);
        if(freshReferenceToBaseEditor) {
            this.baseEditor = freshReferenceToBaseEditor;
        }
    }
}