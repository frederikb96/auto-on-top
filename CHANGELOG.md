# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

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
