# AGENTS.md — CreatureStudio

## Project overview

- This repository is a Node.js app called **CreatureStudio**.
- It uses Node.js and npm for all JavaScript tooling.
- In Codex Cloud environments, Node.js **20** and npm are already preinstalled.
- You should **not** try to install Node yourself (no `apt-get install node` etc.).

## Dev environment expectations

When working on this repo in a Codex environment:

- Assume the working directory is the repository root (for example `/workspace/creaturestudio`).
- Use the **preinstalled Node.js 20** and **npm**:
  - Use `node -v` and `npm -v` if you need to verify versions.
- Use **npm**, not yarn or pnpm, unless I explicitly request otherwise.

## Installing dependencies

Whenever your changes might affect dependencies, or before running scripts that need node modules:

1. From the repo root, run:

   ```bash
   npm install
# AGENTS.md — CreatureStudio

## Project overview

- This repository is a Node.js app called **CreatureStudio**.
- It uses Node.js and npm for all JavaScript tooling.
- In Codex Cloud environments, Node.js **20** and npm are already preinstalled.
- You should **not** try to install Node yourself (no `apt-get install node` etc.).

## Dev environment expectations

When working on this repo in a Codex environment:

- Assume the working directory is the repository root (for example `/workspace/creaturestudio`).
- Use the **preinstalled Node.js 20** and **npm**:
  - Use `node -v` and `npm -v` if you need to verify versions.
- Use **npm**, not yarn or pnpm, unless I explicitly request otherwise.

## Installing dependencies

Whenever your changes might affect dependencies, or before running scripts that need node modules:

1. From the repo root, run:

   ```bash
   npm install
