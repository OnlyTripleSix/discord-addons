/**
 * @name HiddenChannels
 * @author ItsTripleSix
 * @version 1.0.0
 * @description Show cached locked-channel metadata in the channel list without changing server permissions or message access.
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
    function toast(api, text, type = "info") {
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
    function checkbox(api, label, value, onChange, description) {
      const h = api.React.createElement;
      return h(
        "label",
        { style: { display: "flex", alignItems: "start", gap: 10, margin: "16px 0", cursor: "pointer" } },
        h("input", { type: "checkbox", checked: value, onChange: (e) => onChange(e.target.checked), style: { marginTop: 5 } }),
        h("span", null, label, description && h("small", { style: { display: "block", color: "var(--text-muted, #aaa)" } }, description))
      );
    }
    module2.exports = { store: store2, find: find2, menuHas, addMenu: addMenu2, patchMenu: patchMenu2, toast, panel: panel2, checkbox };
  }
});

// src/hidden-channels.js
var { store, find, addMenu, patchMenu, panel } = require_common();
var NAME = "HiddenChannels";
var VIEW_CHANNEL = 1024n;
var TYPES = { 0: "Text", 2: "Voice", 4: "Category", 5: "Announcement", 13: "Stage", 15: "Forum", 16: "Media" };
var PLACEHOLDER = /^(?:no[\s_-]*access|_+hidden_+)$/i;
var CSS = `
[data-its-hc-locked] { opacity: .75; position: relative; padding-right: 22px; box-sizing: border-box; }
[data-its-hc-locked] [class*="unread"], [data-its-hc-locked] [class*="mentionsBadge"] { display: none !important; }
[data-its-hc-locked]::after { content: "\u{1F512}"; font-size: 12px; position: absolute; right: 5px; top: 50%; transform: translateY(-50%); pointer-events: none; }
.its-hc-details { line-height: 1.5; overflow-wrap: anywhere; }
.its-hc-details dl { display: grid; grid-template-columns: max-content 1fr; gap: 7px 14px; }
.its-hc-details dt { color: var(--text-muted, #aaa); }
.its-hc-details dd { margin: 0; white-space: pre-wrap; }
.its-hc-dialog { width: min(620px, 88vw); max-height: 85vh; border: 1px solid #4f5158; border-radius: 12px; background: var(--background-base-low, #202127); color: var(--text-normal, #eee); padding: 20px; font: inherit; }
.its-hc-dialog::backdrop { background: rgba(0,0,0,.7); }
.its-hc-dialog h2 { margin-top: 0; font-size: 20px; }
.its-hc-dialog button { font: inherit; color: inherit; background: #363944; border: 1px solid #565b69; border-radius: 6px; padding: 7px 12px; cursor: pointer; margin-bottom: 5px; }
.its-hc-dialog button:focus-visible { outline: 2px solid #b4baff; outline-offset: 2px; }
.its-hc-dialog footer { display: flex; justify-content: end; margin-top: 15px; }
.its-hc-dialog footer button { background: #5865f2; color: white; }
`;
module.exports = class HiddenChannels {
  start() {
    if (this.active) return;
    this.api = BdApi;
    this.active = true;
    this.cleanups = [];
    this.patched = /* @__PURE__ */ new WeakMap();
    this.originals = /* @__PURE__ */ new Map();
    this.nativeLevels = /* @__PURE__ */ new WeakMap();
    this.categories = /* @__PURE__ */ new Set();
    this.lists = /* @__PURE__ */ new Set();
    this.decorated = /* @__PURE__ */ new Map();
    this.dialogs = /* @__PURE__ */ new Set();
    try {
      this.channels = store(this.api, "ChannelStore") || find(this.api, "getChannel", "getMutableGuildChannelsForGuild");
      this.permissions = store(this.api, "PermissionStore") || find(this.api, "can", "getChannelPermissions");
      this.guilds = store(this.api, "GuildStore");
      this.channelList = store(this.api, "ChannelListStore");
      if (!this.channels?.getChannel || !this.permissions?.can || !this.channelList?.getGuild) {
        throw new Error("Hidden Channels could not find Discord's channel list and permission stores. Open a server, then enable it again.");
      }
      this.installGuards();
      this.api.DOM.addStyle(NAME, CSS);
      const hook = (_self, _args, result) => {
        if (!this.active) return result;
        const list = result?.guildChannels ?? result;
        this.reveal(list);
        if (result?.guildChannels) result.guildChannelsVersion = list.version;
        return result;
      };
      if (!this.patch("after", this.channelList, "getGuild", hook)) throw new Error("Hidden Channels could not attach to Discord's channel list.");
      this.patch("after", this.channelList, "getGuildWithoutChangingGuildActionRows", hook);
      const cacheClass = this.api.Webpack.getModule((value) => typeof value === "function" && typeof value.prototype?.getGuildChannelRowsOnly === "function" && typeof value.prototype?.getGuild === "function", { searchExports: true });
      if (cacheClass) {
        this.patch("after", cacheClass.prototype, "getGuild", hook);
        this.patch("after", cacheClass.prototype, "getGuildChannelRowsOnly", hook);
      }
      const unread = store(this.api, "ReadStateStore");
      for (const key of ["hasUnread", "hasUnreadPins", "getMentionCount"]) {
        this.patch("after", unread, key, (_self, args, result) => this.isHidden(args[0]) ? key === "getMentionCount" ? 0 : false : result);
      }
      this.cleanups.push(patchMenu(this.api, "channel-context", (tree, props) => {
        if (this.isHidden(props?.channel)) addMenu(this.api, tree, "hidden-channels-info", "View locked channel info", () => this.showInfo(props.channel));
      }));
      this.cleanups.push(patchMenu(this.api, "guild-context", (tree, props) => {
        if (props?.guild?.id) addMenu(this.api, tree, "hidden-channels-list", "Hidden Channels", () => this.showGuild(props.guild.id));
      }));
      this.clickListener = (event) => this.handleEvent(event);
      if (typeof document !== "undefined") {
        for (const event of ["pointerdown", "click", "auxclick", "keydown"]) document.addEventListener(event, this.clickListener, true);
        this.observer = new MutationObserver(() => this.scheduleDecoration());
        this.observer.observe(document.body, { childList: true, subtree: true });
      }
      for (const source of [this.channels, this.permissions, this.guilds, store(this.api, "UserStore")]) {
        if (!source?.addChangeListener || !source.removeChangeListener) continue;
        const listener = () => this.scheduleRefresh();
        source.addChangeListener(listener);
        this.cleanups.push(() => source.removeChangeListener(listener));
      }
      this.refresh();
    } catch (error) {
      this.stop();
      throw error;
    }
  }
  patch(kind, target, key, callback) {
    if (!target || typeof target[key] !== "function") return false;
    let keys = this.patched.get(target);
    if (!keys) {
      keys = /* @__PURE__ */ new Set();
      this.patched.set(target, keys);
    }
    const identity = kind + ":" + key;
    if (keys.has(identity)) return true;
    const unpatch = this.api.Patcher[kind](NAME, target, key, callback);
    if (typeof unpatch !== "function") return false;
    keys.add(identity);
    this.cleanups.push(unpatch);
    return true;
  }
  channel(value) {
    if (typeof value === "string") return this.channels?.getChannel(value);
    const raw = value?.record ?? value?.channel ?? value;
    return raw?.id ? this.channels?.getChannel(raw.id) ?? raw : null;
  }
  isHidden(value) {
    const channel = this.channel(value);
    if (!channel || !(channel.guild_id ?? channel.guildId) || !(channel.type in TYPES)) return false;
    try {
      return this.permissions.can(VIEW_CHANNEL, channel) === false || channel.isObfuscated?.() === true;
    } catch {
      return false;
    }
  }
  name(value) {
    const channel = this.channel(value);
    const name = channel?.name?.trim?.();
    return name && !PLACEHOLDER.test(name) ? name : "Hidden channel (name unavailable)";
  }
  reveal(list) {
    if (!list || typeof list !== "object") return;
    const categories = [list.noParentCategory, ...Object.values(list.categories || {}), list.voiceChannelsCategory].filter(Boolean);
    let changed = false;
    for (const category of categories) {
      let changedCategory = false;
      for (const item of Object.values(category.channels || {})) {
        const record = item?.record ?? item?.channel;
        if (!record || record.type === 4 || !this.isHidden(record)) continue;
        if (!this.originals.has(item)) this.originals.set(item, this.nativeLevels.get(item) ?? item.renderLevel);
        const proto = Object.getPrototypeOf(item);
        this.patch("after", proto, "computeState", (self, _args, result) => {
          if (Number.isFinite(result?.renderLevel)) this.nativeLevels.set(self, result.renderLevel);
          if (!this.active || !this.isHidden(self.record) || self.record?.type === 4) return result;
          return { ...result, renderLevel: self.category?.isCollapsed ? 3 : 4, threadIds: [] };
        });
        const level = category.isCollapsed ? 3 : 4;
        if (item.renderLevel !== level) {
          item.renderLevel = level;
          changedCategory = true;
        }
      }
      if (changedCategory) {
        this.invalidateCategory(category);
        changed = true;
      }
      this.categories.add(category);
    }
    if (changed) this.invalidateList(list);
    this.lists.add(list);
  }
  invalidateCategory(category) {
    if (typeof category.invalidate === "function") category.invalidate();
    else {
      category.shownChannelIds = null;
      if ("hiddenChannelIds" in category) category.hiddenChannelIds = null;
    }
  }
  invalidateList(list) {
    if (typeof list.invalidate === "function") list.invalidate();
    else {
      list.rows = null;
      list.sections = null;
      list.firstVoiceChannel = void 0;
      if (typeof list.version === "number") list.version++;
    }
  }
  installGuards() {
    const actions = find(this.api, "fetchMessages", "sendMessage") || find(this.api, "fetchMessages");
    let guarded = false;
    for (const key of ["fetchMessages", "fetchMessage", "jumpToMessage", "fetchMessagesAround"]) {
      guarded = this.patch("instead", actions, key, (self, args, original) => {
        const channelId = args[0]?.channelId ?? args[0]?.channel_id ?? (typeof args[0] === "string" ? args[0] : null);
        return this.isHidden(channelId) ? Promise.resolve(key === "fetchMessage" ? null : void 0) : original.apply(self, args);
      }) || guarded;
    }
    const client = this.api.Webpack.getModule((value) => value && typeof value === "object" && ["get", "post", "put", "patch", "del"].every((k) => typeof value[k] === "function"), { searchExports: true });
    guarded = this.patch("instead", client, "get", (self, args, original) => {
      const url = typeof args[0] === "string" ? args[0] : args[0]?.url;
      const match = typeof url === "string" && /^\/(?:api\/v\d+\/)?channels\/(\d+)\/(?:messages|pins|threads)(?:\/|\?|$)/.exec(url);
      if (match && this.isHidden(match[1])) {
        return Promise.reject(Object.assign(new Error("This channel is locked. Only its cached metadata is available."), { status: 403, body: { code: 50001, message: "Missing Access" } }));
      }
      return original.apply(self, args);
    }) || guarded;
    if (!guarded) throw new Error("Hidden Channels could not install its locked-channel message guard.");
    const voice = find(this.api, "selectVoiceChannel");
    this.patch("instead", voice, "selectVoiceChannel", (self, args, original) => {
      const id = typeof args[0] === "string" ? args[0] : args[0]?.channelId;
      if (this.isHidden(id)) {
        this.showInfo(id);
        return Promise.resolve();
      }
      return original.apply(self, args);
    });
    const withKey = this.api.Webpack.getWithKey?.((value) => typeof value === "function" && String(value).includes("transitionTo - Transitioning to"), { searchExports: true });
    if (withKey?.[0] && typeof withKey[1] === "string") {
      this.patch("instead", withKey[0], withKey[1], (self, args, original) => {
        const path = typeof args[0] === "string" ? args[0] : args[0]?.pathname;
        const match = typeof path === "string" && /^\/channels\/\d+\/(\d+)(?:\/|\?|$)/.exec(path);
        if (match && this.isHidden(match[1])) {
          this.showInfo(match[1]);
          return;
        }
        return original.apply(self, args);
      });
    }
  }
  scheduleRefresh() {
    if (!this.active || this.refreshTimer) return;
    this.refreshTimer = setTimeout(() => {
      this.refreshTimer = null;
      if (this.active) this.refresh();
    }, 100);
  }
  refresh() {
    for (const id of Object.keys(this.guilds?.getGuilds?.() || {})) {
      try {
        const value = this.channelList.getGuild(id);
        this.reveal(value?.guildChannels ?? value);
      } catch {
      }
    }
    this.channelList.emitChange?.();
    this.scheduleDecoration();
  }
  scheduleDecoration() {
    if (!this.active || this.decorationTimer || typeof document === "undefined") return;
    this.decorationTimer = setTimeout(() => {
      this.decorationTimer = null;
      if (this.active) this.decorate();
    }, 60);
  }
  elementChannel(element) {
    const row = element?.closest?.('[data-list-item-id^="channels___"]') ?? element?.closest?.('a[href^="/channels/"]');
    if (!row) return null;
    const key = row.getAttribute("data-list-item-id");
    const match = key ? /^channels___(\d+)$/.exec(key) : /^\/channels\/\d+\/(\d+)(?:\/|$)/.exec(row.getAttribute("href") || "");
    return match ? { row, id: match[1] } : null;
  }
  restoreRow(row, before) {
    row.removeAttribute("data-its-hc-locked");
    if (before.title == null) row.removeAttribute("title");
    else row.setAttribute("title", before.title);
  }
  decorate() {
    for (const [row, before] of this.decorated) if (!row.isConnected || !this.isHidden(this.elementChannel(row)?.id)) {
      this.restoreRow(row, before);
      this.decorated.delete(row);
    }
    const seen = /* @__PURE__ */ new Set();
    for (const element of document.querySelectorAll('[data-list-item-id^="channels___"], a[href^="/channels/"]')) {
      const candidate = this.elementChannel(element);
      if (!candidate || !this.isHidden(candidate.id)) continue;
      const row = candidate.row;
      if (seen.has(row)) continue;
      seen.add(row);
      if (!this.decorated.has(row)) this.decorated.set(row, { title: row.getAttribute("title") });
      row.setAttribute("data-its-hc-locked", "true");
      row.setAttribute("title", this.name(candidate.id) + " \u2014 locked; click for channel info");
    }
  }
  handleEvent(event) {
    if (!this.active || event.type === "keydown" && !["Enter", " "].includes(event.key)) return;
    const candidate = this.elementChannel(event.target);
    if (!candidate || !this.isHidden(candidate.id)) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    if (["click", "auxclick", "keydown"].includes(event.type)) this.showInfo(candidate.id);
  }
  infoElement(value) {
    const channel = this.channel(value), h = this.api.React.createElement;
    if (!channel) return h("p", null, "This channel is no longer loaded.");
    const created = /^\d+$/.test(channel.id) ? new Date(Number((BigInt(channel.id) >> 22n) + 1420070400000n)).toLocaleString() : "Unavailable";
    const parent = channel.parent_id ? this.channel(channel.parent_id) : null;
    const fields = [["Name", this.name(channel)], ["Type", TYPES[channel.type] ?? "Channel"], ["Category", parent ? this.name(parent) : "None"], ["Topic", channel.topic || "Unavailable"], ["Created", created], ["Channel ID", channel.id], ["Permission rules", String(Object.keys(channel.permissionOverwrites ?? channel.permission_overwrites ?? {}).length)]];
    return h(
      "div",
      { className: "its-hc-details" },
      h("p", null, "You cannot view this channel. This shows metadata already loaded by Discord; messages are unavailable."),
      h("dl", null, ...fields.flatMap(([name, value2]) => [h("dt", { key: name }, name), h("dd", { key: name + "-value" }, value2)]))
    );
  }
  modal(title, content) {
    if (typeof document !== "undefined" && this.api.ReactDOM?.createRoot) {
      const previous = document.activeElement, dialog = document.createElement("dialog");
      dialog.className = "its-hc-dialog";
      dialog.setAttribute("aria-label", title);
      const heading = document.createElement("h2");
      heading.textContent = title;
      const body = document.createElement("div"), footer = document.createElement("footer"), button = document.createElement("button");
      button.type = "button";
      button.textContent = "Close";
      footer.append(button);
      dialog.append(heading, body, footer);
      document.body.append(dialog);
      const root = this.api.ReactDOM.createRoot(body);
      let disposed = false;
      const dispose = () => {
        if (disposed) return;
        disposed = true;
        root.unmount();
        dialog.remove();
        this.dialogs.delete(dispose);
        if (previous?.isConnected) previous.focus?.();
      };
      this.dialogs.add(dispose);
      button.addEventListener("click", () => {
        dialog.close();
        dispose();
      });
      dialog.addEventListener("close", dispose);
      try {
        root.render(content);
        dialog.showModal();
        button.focus();
      } catch (error) {
        dispose();
        throw error;
      }
    } else {
      const key = this.api.UI.showConfirmationModal(title, content, { confirmText: "Close", cancelText: null });
      const modals = find(this.api, "closeModal", "openModal");
      if (typeof key === "function") this.dialogs.add(key);
      else if (key != null && modals) this.dialogs.add(() => modals.closeModal(key));
    }
  }
  showInfo(value) {
    if (this.active) this.modal("Locked channel info", this.infoElement(value));
  }
  loadedHidden(guildId) {
    const channels = this.channels.getMutableGuildChannelsForGuild?.(guildId) || {};
    return (channels instanceof Map ? [...channels.values()] : Object.values(channels)).filter((channel) => this.isHidden(channel));
  }
  showGuild(guildId) {
    if (!this.active) return;
    const h = this.api.React.createElement, channels = this.loadedHidden(guildId).sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    const guildName = this.guilds?.getGuild?.(guildId)?.name || "Server";
    this.modal(guildName + " \u2014 Hidden Channels", h(
      "div",
      { className: "its-hc-details" },
      h("p", null, "Inaccessible channels with metadata loaded in this client."),
      channels.length ? h("ul", null, ...channels.map((channel) => h("li", { key: channel.id }, h("button", { type: "button", onClick: () => this.showInfo(channel) }, "\u{1F512} " + this.name(channel))))) : h("p", null, "No inaccessible channel metadata is currently loaded.")
    ));
  }
  getSettingsPanel() {
    const api = this.api || BdApi, h = api.React.createElement;
    const guilds = Object.values(this.guilds?.getGuilds?.() || {});
    return panel(api, "Hidden Channels", [
      h("p", null, "Locked channels appear in the channel list with a lock marker. Click one to view its cached name, topic, type, category, and creation time."),
      h("p", null, "Right-click a server \u2192 Hidden Channels opens its full cached list. Collapsed categories stay collapsed, and locked channels do not show unread counts."),
      h("p", null, "Discord must supply the metadata. Missing names or channels cannot be reconstructed. Server permissions and access stay unchanged."),
      ...guilds.map((guild) => h("p", { key: guild.id }, h("button", { type: "button", onClick: () => this.showGuild(guild.id) }, guild.name + " \u2014 " + this.loadedHidden(guild.id).length + " locked")))
    ]);
  }
  stop() {
    this.active = false;
    clearTimeout(this.refreshTimer);
    clearTimeout(this.decorationTimer);
    this.refreshTimer = null;
    this.decorationTimer = null;
    this.observer?.disconnect();
    this.observer = null;
    if (typeof document !== "undefined" && this.clickListener) for (const event of ["pointerdown", "click", "auxclick", "keydown"]) document.removeEventListener(event, this.clickListener, true);
    for (const cleanup of (this.cleanups || []).reverse()) {
      try {
        cleanup();
      } catch {
      }
    }
    this.cleanups = [];
    for (const [item, level] of this.originals || []) {
      try {
        item.renderLevel = this.nativeLevels.get(item) ?? level;
        if (item.category?.guild?.initializationData) item.updateChannel?.(item.record, item.category.guild.initializationData);
      } catch {
      }
    }
    for (const category of this.categories || []) {
      try {
        this.invalidateCategory(category);
      } catch {
      }
    }
    for (const list of this.lists || []) {
      try {
        this.invalidateList(list);
      } catch {
      }
    }
    for (const [row, before] of this.decorated || []) this.restoreRow(row, before);
    for (const close of this.dialogs || []) {
      try {
        close();
      } catch {
      }
    }
    this.originals?.clear();
    this.categories?.clear();
    this.lists?.clear();
    this.decorated?.clear();
    this.dialogs?.clear();
    this.api?.DOM.removeStyle(NAME);
    this.channelList?.emitChange?.();
  }
};
