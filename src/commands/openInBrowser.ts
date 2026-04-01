import * as open from 'open';
import { ContainerManager } from "../ContainerManager";

export async function openInBrowser(containerManager: ContainerManager) {
    const editor = containerManager.checkActiveEditor();

    if (!editor) {
        return;
    }

    const container = containerManager.getOrCreateContainer(editor);

    try {
        await open.default(await container.getBrowserUrl());
    } catch (error) {
        console.error('Failed to open URL in browser:', error);
    }
}