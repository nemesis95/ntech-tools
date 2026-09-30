# Branch Guide

NTech Tools keeps the public catalog, active development, and stable tool versions on separate but related branches.

## Branch model

- `main` contains only the NTech Tools catalog and shared repository documentation.
- `<tool>-dev` contains active work for one tool.
- `<tool>-vX.Y.Z` contains a stable published version of that tool.
- `vX.Y.Z` tags identify fixed release commits.

Every tool branch is created from repository history connected to `main`. Branches are pointers to commits; they are not folders and cannot contain other branches.

## LAN File Transfer branches

- `main` — NTech Tools catalog.
- `lan-file-transfer-dev` — current working branch for future changes.
- `lan-file-transfer-v0.0.1` — stable LAN File Transfer 0.0.1 release branch.
- `v0.0.1` — immutable release tag.

## Recommended workflow

Start new work from the development branch:

```bash
git switch lan-file-transfer-dev
git pull origin lan-file-transfer-dev
```

Commit and push work only to the development branch:

```bash
git add .
git commit -m "Describe the change"
git push origin lan-file-transfer-dev
```

When the next version is ready, create a new stable branch from development:

```bash
git switch lan-file-transfer-dev
git switch -c lan-file-transfer-v0.0.2
git push -u origin lan-file-transfer-v0.0.2
git tag -a v0.0.2 -m "LAN File Transfer v0.0.2"
git push origin v0.0.2
```

Do not merge the complete tool branch into `main`. Update only the catalog entry on `main` when a new stable version is published.

## View a tool on GitHub

1. Open the repository.
2. Select the branch menu near the top-left of the file list.
3. Choose the tool branch and version you want.
4. Read that branch's `README.md` and tutorial before running it.

## Clone a stable branch

```bash
git clone --branch lan-file-transfer-v0.0.1 --single-branch https://github.com/nemesis95/ntech-tools.git
```

## Switch an existing clone

```bash
git fetch --all --tags
git switch lan-file-transfer-v0.0.1
```
