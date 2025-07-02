---
"do-vscode-lm-explorer": patch
---

Fix GitHub release workflow to properly create releases using gh CLI and support automatic patch releases

- Replace softprops/action-gh-release with GitHub CLI for more reliable release creation
- Add automatic patch release support for commits without changesets
- Improve release decision logic and error handling
- Add support for manual release triggers with version type selection
- Enhance workflow conditions and resource utilization