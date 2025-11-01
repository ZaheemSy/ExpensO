const vscode = require('vscode');

/**
 * Activate extension
 * Creates a status bar item which runs a terminal command from configuration.
 */
function activate(context) {
  const cfg = vscode.workspace.getConfiguration();
  const label = cfg.get('runButton.label') || 'Run Android';
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.text = `$(play) ${label}`;
  statusBarItem.tooltip = 'Run configured command';
  statusBarItem.command = 'runButton.runCommand';
  statusBarItem.show();

  context.subscriptions.push(statusBarItem);

  const disposable = vscode.commands.registerCommand('runButton.runCommand', async () => {
    const cfg2 = vscode.workspace.getConfiguration('runButton');
    const cmd = cfg2.get('command') || 'npm run android';
    const termName = cfg2.get('terminalName') || 'Run Button';

    // Determine workspace folder
    const folder = (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders[0]) ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

    // Reuse existing terminal with the configured name if present
    let terminal = vscode.window.terminals.find(t => t.name === termName);
    if (!terminal) {
      terminal = vscode.window.createTerminal({ name: termName });
    }

    // If we have a workspace folder, cd into it first (works for most shells)
    if (folder) {
      // Use quoted path to handle spaces
      terminal.sendText(`cd "${folder}"`, true);
    }

    // Send the configured command and show terminal
    terminal.sendText(cmd, true);
    terminal.show(true);
  });

  context.subscriptions.push(disposable);
}

function deactivate() {}

module.exports = { activate, deactivate };