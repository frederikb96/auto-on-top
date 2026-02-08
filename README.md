# Auto On Top

GNOME Shell extension that automatically pins windows to always-on-top based on configurable rules — either unconditionally or only when specific windows are focused.

## Installation

### From Source

```bash
make install
# Log out and back in (Wayland), then:
make enable
```

### Manual

```bash
cp -r . ~/.local/share/gnome-shell/extensions/auto-on-top@frederikb.github.com/
glib-compile-schemas ~/.local/share/gnome-shell/extensions/auto-on-top@frederikb.github.com/schemas/
# Log out and back in, then enable via Extensions app
```

## Configuration

Add rules via the extension preferences UI or `gsettings`:

```bash
# Always on top (unconditional)
gsettings set org.gnome.shell.extensions.auto-on-top rules \
  "['title:My Sticky Note']"

# On top only when Chrome is focused (conditional)
gsettings set org.gnome.shell.extensions.auto-on-top rules \
  "['wm_class:chrome-myextid-Default|focus:wm_class:google-chrome']"

# Mix of both
gsettings set org.gnome.shell.extensions.auto-on-top rules \
  "['title:Always Visible', 'wm_class:my-popup|focus:wm_class:my-app']"
```

### Rule Format

**Unconditional** — window is always on top:
- `title:<pattern>` — match window title (substring)
- `wm_class:<pattern>` — match WM_CLASS name or instance (substring)

**Conditional** — window is on top only when a related window is focused:
- `<target>|focus:<condition>` — pin target window only when condition window has focus
- Example: `wm_class:my-popup|focus:wm_class:my-app`

**Regex** — wrap any pattern in `/slashes/`:
- `title:/^Debug.*Window$/`

### Finding Window Properties

Use GNOME Looking Glass (`Alt+F2` → `lg` → Windows tab) to inspect window titles and WM classes.

## Compatibility

GNOME Shell 45–50

## License

MIT
