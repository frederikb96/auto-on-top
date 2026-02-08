UUID = auto-on-top@frederikb.github.com
EXTENSION_DIR = $(HOME)/.local/share/gnome-shell/extensions/$(UUID)
SRC_FILES = extension.js prefs.js metadata.json

.PHONY: install uninstall enable disable schemas

install: schemas
	mkdir -p $(EXTENSION_DIR)/schemas
	cp $(SRC_FILES) $(EXTENSION_DIR)/
	cp schemas/*.xml $(EXTENSION_DIR)/schemas/
	cp schemas/gschemas.compiled $(EXTENSION_DIR)/schemas/

uninstall:
	rm -rf $(EXTENSION_DIR)

enable:
	gnome-extensions enable $(UUID)

disable:
	gnome-extensions disable $(UUID)

schemas:
	glib-compile-schemas schemas/
