Run Button — VS Code extension (local)

What it does
- Adds a status-bar button (play icon) and an editor-title button (top right of editor) to run a shell command in a terminal.

Default behavior
- Default command: `npm run android`
- Status bar label: `Run Android`
- Editor title button: play icon, labeled "Run Android"

How to use
1. Open the folder `vscode-run-button` in VS Code (File → Open Folder...).
2. Press F5 to launch an Extension Development Host. This opens a new VS Code window with the extension loaded.
3. In that new window, open your project workspace (the folder you want the command run from).
4. Click the play button on the left side of the status bar, or the play button in the editor title bar (top right of any editor tab) — both will open a terminal and run the configured command.

Customization
- Open Settings and search for `Run Button` or add to your `settings.json`:

```
"runButton.command": "npm run android",
"runButton.label": "Run Android",
"runButton.terminalName": "Run Button"
```

Debugging and packaging
- Press F5 to debug in Extension Development Host.
- To package as a .vsix for installation, run:

```sh
npm install -g vsce
vsce package
```

Notes / Edge cases
- If no workspace is open, the extension will run the command in a terminal without changing working dir.
- The extension reuses a terminal with the configured name if one already exists.
