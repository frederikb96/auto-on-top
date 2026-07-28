import GLib from 'gi://GLib';
import Meta from 'gi://Meta';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

const RULE_TYPES = ['title', 'wm_class'];

function _isManageable(window) {
    return window.get_window_type() === Meta.WindowType.NORMAL;
}

function _getAllWindows() {
    return global.get_window_actors()
        .map(a => a.meta_window)
        .filter(w => w != null && _isManageable(w));
}

export default class AutoOnTopExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._windowHandlers = new Map();
        this._parsedRules = [];
        this._focusIdleId = null;

        this._parseRules();

        this._windowCreatedId = global.display.connect(
            'window-created',
            (_display, window) => this._onWindowCreated(window),
        );

        this._focusChangedId = global.display.connect(
            'notify::focus-window',
            () => this._scheduleFocusEval(),
        );

        this._restackedId = global.display.connect(
            'restacked',
            () => this._scheduleFocusEval(),
        );

        this._settingsChangedId = this._settings.connect(
            'changed::rules',
            () => this._onRulesChanged(),
        );

        this._scanExistingWindows();
    }

    disable() {
        this._unpinConditionalTargets();

        if (this._windowCreatedId) {
            global.display.disconnect(this._windowCreatedId);
            this._windowCreatedId = null;
        }

        if (this._focusChangedId) {
            global.display.disconnect(this._focusChangedId);
            this._focusChangedId = null;
        }

        if (this._restackedId) {
            global.display.disconnect(this._restackedId);
            this._restackedId = null;
        }

        if (this._focusIdleId) {
            GLib.source_remove(this._focusIdleId);
            this._focusIdleId = null;
        }

        if (this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = null;
        }

        for (const [window, handlerIds] of this._windowHandlers) {
            for (const id of handlerIds) {
                try {
                    window.disconnect(id);
                } catch (_e) {
                    // Window already destroyed
                }
            }
        }
        this._windowHandlers.clear();

        this._parsedRules = [];
        this._settings = null;
    }

    _parseRules() {
        this._parsedRules = [];
        for (const ruleStr of this._settings.get_strv('rules')) {
            const rule = this._parseRuleStr(ruleStr);
            if (rule)
                this._parsedRules.push(rule);
        }
    }

    _parseRuleStr(ruleStr) {
        const parts = ruleStr.split('|focus:');
        const target = this._parsePattern(parts[0]);
        if (!target)
            return null;

        let focus = null;
        if (parts.length > 1)
            focus = this._parsePattern(parts[1]);

        return {target, focus};
    }

    _parsePattern(str) {
        const idx = str.indexOf(':');
        if (idx === -1)
            return null;

        const type = str.substring(0, idx);
        const value = str.substring(idx + 1);

        if (!RULE_TYPES.includes(type))
            return null;

        if (value.startsWith('/') && value.endsWith('/') && value.length > 2)
            return {type, pattern: value.slice(1, -1), regex: true};

        return {type, pattern: value, regex: false};
    }

    _matchesPattern(window, pattern) {
        const values = pattern.type === 'title'
            ? [window.get_title() || '']
            : [window.get_wm_class() || '', window.get_wm_class_instance() || ''];

        for (const val of values) {
            if (pattern.regex) {
                try {
                    if (new RegExp(pattern.pattern).test(val))
                        return true;
                } catch (_e) {
                    // Invalid regex
                }
            } else if (val.indexOf(pattern.pattern) > -1) {
                return true;
            }
        }
        return false;
    }

    _applyRulesToWindow(window) {
        if (!_isManageable(window))
            return;

        for (const rule of this._parsedRules) {
            if (!this._matchesPattern(window, rule.target))
                continue;

            if (rule.focus) {
                const focused = global.display.focus_window;
                if (focused && this._matchesPattern(focused, rule.focus)) {
                    if (!window.is_above())
                        window.make_above();
                }
            } else {
                if (!window.is_above())
                    window.make_above();
            }
        }
    }

    _onWindowCreated(window) {
        if (!_isManageable(window))
            return;

        this._applyRulesToWindow(window);
        this._trackWindow(window);
    }

    _scheduleFocusEval() {
        if (this._focusIdleId)
            return;
        this._focusIdleId = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            this._focusIdleId = null;
            this._onFocusChanged();
            return GLib.SOURCE_REMOVE;
        });
    }

    _onFocusChanged() {
        const focused = global.display.focus_window;
        if (!focused)
            return;

        // Menus, popups and tooltips take focus while they are open. Treating
        // them as a focus change would unpin conditional targets, and the
        // restack that follows dismisses the popup, so leave the state as is.
        if (!_isManageable(focused))
            return;

        const allWindows = _getAllWindows();

        for (const rule of this._parsedRules) {
            if (!rule.focus)
                continue;

            const conditionMet = this._matchesPattern(focused, rule.focus);

            for (const window of allWindows) {
                if (!this._matchesPattern(window, rule.target))
                    continue;
                if (window === focused)
                    continue;

                if (conditionMet) {
                    if (!window.is_above())
                        window.make_above();
                } else {
                    if (window.is_above()) {
                        window.unmake_above();
                        window.lower();
                    }
                }
            }
        }
    }

    _trackWindow(window) {
        if (this._windowHandlers.has(window))
            return;

        const titleId = window.connect('notify::title',
            () => this._applyRulesToWindow(window));
        const wmClassId = window.connect('notify::wm-class',
            () => this._applyRulesToWindow(window));
        const unmanagedId = window.connect('unmanaged',
            () => this._windowHandlers.delete(window));

        this._windowHandlers.set(window, [titleId, wmClassId, unmanagedId]);
    }

    _scanExistingWindows() {
        for (const window of _getAllWindows()) {
            this._applyRulesToWindow(window);
            this._trackWindow(window);
        }
        this._onFocusChanged();
    }

    _onRulesChanged() {
        this._parseRules();
        this._scanExistingWindows();
    }

    _unpinConditionalTargets() {
        const allWindows = _getAllWindows();
        for (const rule of this._parsedRules) {
            if (!rule.focus)
                continue;
            for (const window of allWindows) {
                if (this._matchesPattern(window, rule.target) && window.is_above())
                    window.unmake_above();
            }
        }
    }
}
