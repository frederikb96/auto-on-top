# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Fixed

- Only manage normal toplevel windows. Menus, popups and tooltips take focus
  while open, which made conditional rules unpin and lower their target. On
  Wayland the resulting restack cancels the popup grab, so browser extension
  flyouts and similar overlays closed on their own after a short flicker.

## [1.0.0] - 2026-02-08

### Added

- Auto-pin windows to always-on-top based on configurable rules
- Unconditional mode: window is always on top
- Conditional mode: window is on top only when related windows are focused (`|focus:` syntax)
- Rule types: `title:` (window title) and `wm_class:` (WM class)
- Substring and regex matching (wrap in slashes for regex)
- Handles late title assignment (Chrome standalone apps)
- Preferences UI for managing rules
- Watches for GSettings changes at runtime
- Clean disable: conditional targets are unpinned when extension is disabled
- GitHub Actions workflow to detect new GNOME Shell releases
