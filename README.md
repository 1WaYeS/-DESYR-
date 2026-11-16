# DESYR team integration baseline

This repository is a modular handoff of an existing AI-assisted implementation.
Feature uploads represent review and integration of that implementation, not proof
of original authorship. Preserve this note and describe actual work in pull requests.

## Run the core

Install a current Node.js LTS version compatible with Vite 6 (Node 22 LTS is suitable).
From the project root: `npm.cmd ci`, then `npm.cmd run dev`.
Use `npm.cmd run build` for a production build. On macOS/Linux use `npm`.

Core includes the three magazine experiences, products, manual sizes, bag and
navigation. The feature entry points are explicitly marked placeholders. Outfit
pages, size-finder buttons and price-alert controls appear after their respective
packages replace those placeholders. No feature automatically deploys itself.

## Integrate a feature

Extract your assigned feature ZIP. Copy its CONTENTS into this project root,
preserving paths such as `src/components/...`. Replace the specified placeholder
files when prompted. Do not create an extra nested project folder or upload a ZIP
as source. No changes to package.json or shared magazine components are needed.

All feature packages can be installed independently and in any order. Each owns
different files. Once merged, main contains the combined website.

Read the matching guide in `docs/`, perform its checklist and record actual results.
For size tests: `npm.cmd run test:size` (after Smart Size is installed).
For alert tests: `npm.cmd run test:alerts` (after Price Drop Alerts is installed).
Those test scripts are deliberately supplied by their feature packages; the core
alone does not have them. Every combination supports `npm.cmd run build`.

## Deployment

Vite uses relative asset paths. Build with `npm.cmd run build`, then deploy the
CONTENTS of dist to GitHub Pages using the team's chosen deployment process.
The new repository has its own Pages settings and URL; these are not configured
by the ZIPs. Do not use gh-pages for source integration.

Price alerts default to a browser preview and do not send email. The separate
Django backend needs its own hosting, official price feed and email setup for
live operation. Read `backend/README.md` after that package is installed.
Size recommendations need product-specific charts; Guzel has no verified charts
in this snapshot and trousers are not supported by the chest-sizing method.
Complete the Look supports Gorur Ghash and Wrongs & Rebels using curated rules.

Never commit .env secrets, node_modules, local databases or virtual environments.
