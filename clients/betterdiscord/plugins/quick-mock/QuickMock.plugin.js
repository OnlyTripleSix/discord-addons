/**
 * @name QuickMock
 * @author ItsTripleSix
 * @version 1.0.0
 * @description Mock text from a message menu or /mock command, with composer review by default.
 * @source https://github.com/OnlyTripleSix/discord-addons
 * @website https://github.com/OnlyTripleSix/discord-addons
 */
/* Copyright (c) 2026 ItsTripleSix. MIT License; see included LICENSE. */
"use strict";
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};

// src/common.js
var require_common = __commonJS({
  "src/common.js"(exports2, module2) {
    "use strict";
    function store2(api, name) {
      try {
        return api.Webpack.getStore(name);
      } catch {
        return void 0;
      }
    }
    function find2(api, ...keys) {
      return api.Webpack.getModule((value) => value && keys.every((key) => typeof value[key] === "function"), { searchExports: true });
    }
    function menuHas(value, id) {
      if (Array.isArray(value)) return value.some((child) => menuHas(child, id));
      return !!value && typeof value === "object" && (value.props?.id === id || menuHas(value.props?.children, id));
    }
    function addMenu2(api, tree, id, label, action) {
      if (!tree?.props) return;
      const menu = tree.props.children?.props?.navId ? tree.props.children : tree;
      if (menuHas(menu.props.children, id)) return;
      const item = api.ContextMenu.buildItem({ type: "group", items: [{ id, label, action }] });
      menu.props.children = [...Array.isArray(menu.props.children) ? menu.props.children : [menu.props.children], item].filter(Boolean);
    }
    function patchMenu2(api, name, callback) {
      const unpatch = api.ContextMenu.patch(name, callback);
      return typeof unpatch === "function" ? unpatch : () => api.ContextMenu.unpatch(name, callback);
    }
    function toast2(api, text, type = "info") {
      api.UI.showToast(text, { type });
    }
    function panel2(api, title, children) {
      return api.React.createElement(
        "div",
        { style: { padding: 16, color: "var(--text-normal, #eee)", lineHeight: 1.5 } },
        api.React.createElement("h2", { style: { marginTop: 0 } }, title),
        ...children
      );
    }
    function checkbox2(api, label, value, onChange, description) {
      const h = api.React.createElement;
      return h(
        "label",
        { style: { display: "flex", alignItems: "start", gap: 10, margin: "16px 0", cursor: "pointer" } },
        h("input", { type: "checkbox", checked: value, onChange: (e) => onChange(e.target.checked), style: { marginTop: 5 } }),
        h("span", null, label, description && h("small", { style: { display: "block", color: "var(--text-muted, #aaa)" } }, description))
      );
    }
    module2.exports = { store: store2, find: find2, menuHas, addMenu: addMenu2, patchMenu: patchMenu2, toast: toast2, panel: panel2, checkbox: checkbox2 };
  }
});

// src/quick-mock.js
var { store, find, addMenu, patchMenu, toast, panel, checkbox } = require_common();
var NAME = "QuickMock";
function mockify(value) {
  let upper = false;
  return Array.from(String(value ?? "")).map((char) => {
    if (!/[a-z]/i.test(char)) return char;
    const result = upper ? char.toUpperCase() : char.toLowerCase();
    upper = !upper;
    return result;
  }).join("");
}
module.exports = class QuickMock {
  start() {
    if (this.active) return;
    this.api = BdApi;
    this.active = true;
    this.cleanups = [];
    this.generation = (this.generation || 0) + 1;
    this.settings = { sendImmediately: false, ...this.api.Data.load(NAME, "settings") };
    try {
      this.selected = store(this.api, "SelectedChannelStore");
      this.replies = store(this.api, "PendingReplyStore");
      this.messages = store(this.api, "MessageStore");
      this.users = store(this.api, "UserStore");
      this.actions = find(this.api, "sendMessage", "editMessage");
      this.drafts = find(this.api, "changeDraft", "saveDraft");
      this.dispatch = find(this.api, "dispatchToLastSubscribed", "hasSubscribers");
      if (!this.actions) throw new Error("Quick Mock could not find Discord's message actions.");
      this.cleanups.push(patchMenu(this.api, "message", (tree, props) => {
        const message = props?.message;
        if (!this.active || typeof message?.content !== "string" || !message.content.length) return;
        const current = this.users?.getCurrentUser?.()?.id;
        addMenu(this.api, tree, "quick-mock-message", "Mock", () => {
          if (!this.active || this.users?.getCurrentUser?.()?.id !== current) return;
          void this.handleMessage(message);
        });
      }));
      if (this.api.Commands?.register) {
        const remove = this.api.Commands.register(NAME, {
          id: "mock",
          name: "mock",
          description: "mOcK text, or reply to a message and use /mock",
          options: [{ name: "message", description: "Text to mock (optional when replying)", type: this.api.Commands.Types?.OptionTypes?.STRING ?? 3, required: false }],
          execute: (options, context) => this.execute(options, context)
        });
        if (typeof remove !== "function") throw new Error("Quick Mock could not register /mock.");
        this.cleanups.push(remove);
        this.commandReady = true;
      } else {
        this.commandReady = false;
        toast(this.api, "Quick Mock: right-click \u2192 Mock is ready. Update BetterDiscord to enable /mock.");
      }
    } catch (error) {
      this.stop();
      throw error;
    }
  }
  stop() {
    this.active = false;
    this.generation = (this.generation || 0) + 1;
    for (const cleanup of (this.cleanups || []).reverse()) {
      try {
        cleanup();
      } catch {
      }
    }
    this.cleanups = [];
    this.commandReady = false;
  }
  pendingReply(channelId) {
    try {
      return this.replies?.getPendingReply?.(channelId);
    } catch {
      return void 0;
    }
  }
  replyText(channelId) {
    const pending = this.pendingReply(channelId);
    const message = pending?.message;
    if (typeof message?.content === "string") return message.content;
    try {
      return this.messages?.getMessage?.(channelId, pending?.messageId ?? message?.id)?.content;
    } catch {
      return void 0;
    }
  }
  async execute(options, context) {
    if (!this.active) return;
    const channelId = context?.channel?.id;
    const supplied = Array.isArray(options) ? options.find((o) => o?.name === "message")?.value : void 0;
    const text = supplied == null || String(supplied).length === 0 ? this.replyText(channelId) : String(supplied);
    if (!channelId || !text) {
      toast(this.api, "Reply to a text message or provide message:", "warning");
      return;
    }
    await this.send(channelId, mockify(text), this.pendingReply(channelId));
  }
  async send(channelId, text, pending) {
    if (!this.active || !channelId || !text) return false;
    const generation = this.generation;
    const account = this.users?.getCurrentUser?.()?.id;
    try {
      const options = pending ? this.actions.getSendMessageOptionsForReply?.(pending) ?? {} : {};
      const result = await this.actions.sendMessage(channelId, {
        content: text,
        tts: false,
        invalidEmojis: [],
        validNonShortcutEmojis: []
      }, true, options);
      if (result?.ok === false || Number.isFinite(result?.status) && result.status >= 400) throw Error("Message rejected");
      return true;
    } catch {
      if (this.active && this.generation === generation && this.users?.getCurrentUser?.()?.id === account) {
        this.insert(channelId, text);
        toast(this.api, "Send failed. The mock is ready to review instead.", "error");
      }
      return false;
    }
  }
  async copy(text) {
    try {
      const clipboard = this.api.Webpack.getModule((value) => value && typeof value.copy === "function" && typeof value.SUPPORTS_COPY === "boolean", { searchExports: true });
      if (clipboard?.SUPPORTS_COPY) {
        if (clipboard.copy(text) === false) throw Error("Clipboard unavailable");
      } else await navigator.clipboard.writeText(text);
      toast(this.api, "Mock copied. Paste it where you want to use it.");
      return true;
    } catch {
      toast(this.api, "Could not insert or copy the mock. Open that channel and try again.", "error");
      return false;
    }
  }
  insert(channelId, text) {
    if (!this.active) return false;
    if (this.selected?.getChannelId?.() !== channelId) {
      void this.copy(text);
      return false;
    }
    try {
      if (this.dispatch?.hasSubscribers("INSERT_TEXT")) {
        this.dispatch.dispatchToLastSubscribed("INSERT_TEXT", { plainText: text });
        return true;
      }
      if (this.drafts) {
        const existing = store(this.api, "DraftStore")?.getDraft?.(channelId, 0) ?? "";
        this.drafts.changeDraft(channelId, existing + text, 0);
        return true;
      }
    } catch {
    }
    void this.copy(text);
    return false;
  }
  async handleMessage(message) {
    if (!this.active) return;
    const channelId = message.channel_id ?? message.channelId;
    const text = mockify(message.content);
    if (!text) {
      toast(this.api, "That message has no text to mock.", "warning");
      return;
    }
    if (this.settings.sendImmediately) await this.send(channelId, text);
    else this.insert(channelId, text);
  }
  getSettingsPanel() {
    const api = this.api || BdApi, React = api.React, plugin = this, h = React.createElement;
    this.settings ??= { sendImmediately: false, ...api.Data.load(NAME, "settings") };
    function Settings() {
      const [, refresh] = React.useReducer((n) => n + 1, 0);
      return panel(api, "Quick Mock", [
        h("p", null, "Right-click a text message \u2192 Mock inserts alternating-case text into your composer. Your existing draft is kept."),
        h("p", null, "Use /mock message:Your text, or reply to a text message and send /mock with no argument. Commands send a real message."),
        h("p", null, h("code", null, "/mock message:I know everything \u2192 i KnOw eVeRyThInG")),
        !plugin.commandReady && h("p", { role: "status" }, "Update BetterDiscord for slash commands. The message menu still works."),
        checkbox(api, "Message-menu action sends immediately", !!plugin.settings?.sendImmediately, (value) => {
          plugin.settings.sendImmediately = value;
          api.Data.save(NAME, "settings", plugin.settings);
          refresh();
        }, "Off by default. Turn it on to send as soon as you click Mock.")
      ]);
    }
    return h(Settings);
  }
};
