import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class AutoOnTopPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const page = new Adw.PreferencesPage({
            title: 'Rules',
            icon_name: 'view-pin-symbolic',
        });
        window.add(page);

        const group = new Adw.PreferencesGroup({
            title: 'Auto-Pin Rules',
            description: 'Windows matching these rules are automatically pinned on top.\n'
                + 'Always on top: "title:Text" or "wm_class:ClassName"\n'
                + 'Conditional: "wm_class:Target|focus:wm_class:Parent"\n'
                + 'Use slashes for regex: "title:/pattern/"',
        });
        page.add(group);

        const entryRow = new Adw.EntryRow({
            title: 'Add rule',
        });

        const addRule = () => {
            const text = entryRow.get_text().trim();
            if (!text)
                return;

            const rules = settings.get_strv('rules');
            if (!rules.includes(text)) {
                rules.push(text);
                settings.set_strv('rules', rules);
            }
            entryRow.set_text('');
        };

        const addButton = new Gtk.Button({
            icon_name: 'list-add-symbolic',
            valign: Gtk.Align.CENTER,
            css_classes: ['flat'],
        });
        addButton.connect('clicked', addRule);
        entryRow.add_suffix(addButton);
        entryRow.connect('entry-activated', addRule);

        group.add(entryRow);

        // Rules list group — track rows manually since AdwPreferencesGroup
        // nests children internally and get_first_child() traversal won't find them
        const listGroup = new Adw.PreferencesGroup({
            title: 'Active Rules',
        });
        page.add(listGroup);

        let currentRows = [];

        const rebuildList = () => {
            for (const row of currentRows)
                listGroup.remove(row);
            currentRows = [];

            const rules = settings.get_strv('rules');

            if (rules.length === 0) {
                const emptyRow = new Adw.ActionRow({
                    title: 'No rules configured',
                    subtitle: 'Add a rule above to get started',
                });
                listGroup.add(emptyRow);
                currentRows.push(emptyRow);
                return;
            }

            for (const rule of rules) {
                const row = new Adw.ActionRow({title: rule});

                const removeBtn = new Gtk.Button({
                    icon_name: 'edit-delete-symbolic',
                    valign: Gtk.Align.CENTER,
                    css_classes: ['flat', 'error'],
                });
                removeBtn.connect('clicked', () => {
                    const current = settings.get_strv('rules');
                    const updated = current.filter(r => r !== rule);
                    settings.set_strv('rules', updated);
                });
                row.add_suffix(removeBtn);
                listGroup.add(row);
                currentRows.push(row);
            }
        };

        rebuildList();

        // Single source of truth: settings change drives UI rebuild
        settings.connect('changed::rules', () => rebuildList());
    }
}
