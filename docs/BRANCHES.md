# Branch Guide

NTech Tools keeps independent utilities on versioned branches.

## View a tool on GitHub

1. Open the repository.
2. Select the branch menu near the top-left of the file list.
3. Choose the branch for the tool and version you want.
4. Read that branch's `README.md` and tutorial before running it.

## Clone a specific tool branch

```bash
git clone --branch lan-file-transfer-v0.0.1 --single-branch https://github.com/nemesis95/ntech-tools.git
```

## Switch an existing clone

```bash
git fetch --all --tags
git switch lan-file-transfer-v0.0.1
```

## Version tags

Tags identify fixed release points. For example:

```bash
git checkout v0.0.1
```
