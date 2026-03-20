# Local Dev Environment

## Required runtime

- Node.js: `22.22.1`
- npm: bundled with Node 22

Version pins used in repo:

- `.nvmrc`
- `.node-version`
- `package.json` (`engines.node`)
- `functions/package.json` (`engines.node`)

## Terminal setup (macOS zsh + nvm)

```bash
export NVM_DIR="$HOME/.nvm"
. "/opt/homebrew/opt/nvm/nvm.sh"
nvm install 22.22.1
nvm alias default 22.22.1
nvm use 22.22.1
node -v
npm -v
```

Expected `node -v`: `v22.22.1`

## VS Code alignment

- VS Code tasks in `.vscode/tasks.json` now run with login `zsh` (`/bin/zsh -l -c`) so the same `nvm` default Node is used.
- Restart VS Code after changing default Node with `nvm alias default`.

## Validation commands

From repo root:

```bash
npm ci
```

From repo root for Cloud Functions checks:

```bash
npm --prefix functions install
npm --prefix functions run lint
npm --prefix functions run build
```
