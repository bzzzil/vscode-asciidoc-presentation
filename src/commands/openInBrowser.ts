import * as open from 'open';
import { ContainerManager } from "../ContainerManager";

export function openInBrowser(containerManager: ContainerManager) {
    const editor = containerManager.checkActiveEditor();

    if (!editor) {
        return;
    }

    const container = containerManager.getOrCreateContainer(editor);

    open.default(container.browserUrl);
}