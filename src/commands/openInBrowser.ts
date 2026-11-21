import * as vscode from "vscode";
import { ContainerManager } from "../ContainerManager";

export async function openInBrowser(containerManager: ContainerManager) {
  const editor = containerManager.checkActiveEditor();

  if (!editor) {
    return;
  }

  const container = containerManager.getOrCreateContainer(editor);

  try {
    await vscode.env.openExternal(
      vscode.Uri.parse(await container.getBrowserUrl())
    );
  } catch (error) {
    console.error("Failed to open URL in browser:", error);
  }
}
