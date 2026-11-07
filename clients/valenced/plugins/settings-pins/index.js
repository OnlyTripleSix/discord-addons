(function(exports){"use strict";
const {React,ReactNative}=valenced.react;const {onSettingsModulesLoaded,registerSettingsItem,addSettingsItemToSection,refreshSettings}=valenced.discord.modules.settings;const {ToastActionCreators}=valenced.discord.actions;
const PIN_PREFIX = 'ITS666_VALENCED_PIN_';
const DEFAULT_NAMES = new Set(['Account Switcher', 'Purge Tools']);

function isProtectedShortcut(key) {
  const value = String(key).toLowerCase();
  return value.startsWith('valenced') || value === 'reload' || value.includes('recovery');
}

function pinRowKey(id) { return PIN_PREFIX + encodeURIComponent(String(id)); }

function createPinsModel(env, saved, persist) {
  let state = {
    version: 1,
    pins: { ...(saved?.pins || {}) },
    shortcuts: { ...(saved?.shortcuts || {}) },
  };
  let active = false, ready = false, queued = false, saveError = '';
  let saveQueue = Promise.resolve();
  const subscribers = new Set(), rowCleanups = new Map(), wrapped = new Map(), subscriptions = [];

  function notify() { subscribers.forEach(callback => callback()); }
  function catalog() {
    const plugins = env.listPlugins().filter(plugin => plugin.id && plugin.name);
    // Preserve saved IDs when the optional internal discovery API is unavailable.
    const seen = new Set(plugins.map(plugin => plugin.id));
    for (const id of Object.keys(state.pins)) {
      if (seen.has(id)) continue;
      const plugin = env.describePlugin?.(id);
      if (plugin?.id && plugin.name) { plugins.push(plugin); seen.add(plugin.id); }
    }
    return plugins.sort((a,b) => a.name.localeCompare(b.name));
  }
  function lookup(id) { return catalog().find(plugin => plugin.id === id); }
  function pinned(id) {
    return Object.prototype.hasOwnProperty.call(state.pins, id)
      ? state.pins[id] === true : DEFAULT_NAMES.has(lookup(id)?.name);
  }
  function visible(key) { return isProtectedShortcut(key) || state.shortcuts[key] !== false; }

  function save() {
    const snapshot = {version: 1, pins: {...state.pins}, shortcuts: {...state.shortcuts}};
    const write = saveQueue.catch(() => {}).then(() => persist(snapshot));
    saveQueue = write.then(() => {saveError = '';}, () => {saveError = 'Pin changes could not be saved.';});
    write.then(notify, notify);
    return write;
  }

  function open(id) {
    const plugin = lookup(id);
    if (!plugin) { env.toast('That pinned plugin is no longer installed.'); return false; }
    if (!plugin.started) { env.toast('Enable ' + plugin.name + ' first.'); return false; }
    if (!plugin.hasSettings) { env.toast(plugin.name + ' has no available settings page.'); return false; }
    try { env.openSettings(id); return true; }
    catch { env.toast('Could not open ' + plugin.name + ' settings.'); return false; }
  }

  function existingRows() {
    if (!env.available()) return [];
    return env.shortcutRows().filter(({key,item}) =>
      key && item && item.parent === null && !isProtectedShortcut(key)
      && !String(key).startsWith(PIN_PREFIX) && (item.type === 'route' || item.type === 'pressable'));
  }
  function restoreWrapper(key, record) {
    if (record.item.usePredicate === record.wrapper) {
      if (record.descriptor) Object.defineProperty(record.item, 'usePredicate', record.descriptor);
      else delete record.item.usePredicate;
    }
    wrapped.delete(key);
  }
  function wrapExisting() {
    const rows = existingRows();
    for (const [key, record] of [...wrapped]) {
      if (!rows.some(row => row.key === key && row.item === record.item)) restoreWrapper(key, record);
    }
    for (const {key,item} of rows) {
      if (wrapped.has(key)) continue;
      const descriptor = Object.getOwnPropertyDescriptor(item, 'usePredicate');
      if (descriptor && (!descriptor.configurable || descriptor.get || descriptor.set)) continue;
      const original = typeof item.usePredicate === 'function' ? item.usePredicate : null;
      const wrapper = function() {
        // The original may be a React hook. Always call it, even when hidden.
        const originalResult = original ? original.call(this) : true;
        return Boolean(originalResult) && visible(key);
      };
      try {
        item.usePredicate = wrapper;
        wrapped.set(key, {item, descriptor, wrapper});
      } catch {}
    }
  }

  function rescan() {
    if (!active || !ready) return;
    if (!env.available()) {
      for (const [key,record] of [...wrapped]) restoreWrapper(key,record);
      env.refresh(); notify(); return;
    }
    let changed = false;
    for (const plugin of catalog()) {
      if (!Object.prototype.hasOwnProperty.call(state.pins, plugin.id)) {
        state.pins[plugin.id] = DEFAULT_NAMES.has(plugin.name);
        changed = true;
      }
      if (rowCleanups.has(plugin.id)) continue;
      const id = plugin.id, key = pinRowKey(id);
      const unregister = env.registerItem(key, {
        parent: null, type: 'pressable', withArrow: true,
        useTitle: () => lookup(id)?.name || plugin.name,
        IconComponent: env.iconFor(plugin),
        usePredicate: () => {
          const live = lookup(id);
          return active && env.available() && pinned(id) && !!live?.started && !!live?.hasSettings;
        },
        onPress: () => open(id),
      });
      let remove;
      try { remove = env.addToSection(key); }
      catch(error) { unregister(); throw error; }
      rowCleanups.set(id, () => {remove(); unregister();});
    }
    wrapExisting();
    if (changed) save().catch(() => {});
    env.refresh(); notify();
  }

  function scheduleRescan() {
    if (!active || queued) return;
    queued = true;
    Promise.resolve().then(() => {
      queued = false;
      if (active) rescan();
    }).catch(() => {saveError = 'Some settings shortcuts are unavailable.'; notify();});
  }

  return {
    start() {
      if (active) return;
      active = true;
      subscriptions.push(env.whenSettingsReady(() => {ready = true; rescan();}));
      subscriptions.push(env.subscribeCatalog(scheduleRescan));
    },
    async stop() {
      if (!active) return;
      active = false;
      subscriptions.splice(0).reverse().forEach(unsubscribe => unsubscribe?.());
      for (const [key,record] of [...wrapped]) restoreWrapper(key,record);
      [...rowCleanups.values()].reverse().forEach(cleanup => cleanup());
      rowCleanups.clear();
      if (ready) env.refresh();
      await saveQueue;
      subscribers.clear();
    },
    catalog,
    existing: () => existingRows().filter(({key}) => wrapped.has(key)),
    available: () => env.available(),
    pinned,
    visible,
    open,
    async setPinned(id, value) {
      if (!lookup(id)) throw new Error('Plugin is no longer installed.');
      state.pins[id] = value === true;
      env.refresh(); notify();
      await save();
    },
    async setShortcutVisible(key, value) {
      if (isProtectedShortcut(key) || !existingRows().some(row => row.key === key) || !wrapped.has(key)) {
        throw new Error('Core or unsupported shortcuts cannot be hidden.');
      }
      state.shortcuts[key] = value === true;
      env.refresh(); notify();
      await save();
    },
    refresh: scheduleRescan,
    subscribe(callback) {subscribers.add(callback); return () => subscribers.delete(callback);},
    diagnostics() {
      return {active, ready, available: env.available(), registeredRows: rowCleanups.size,
        pinned: catalog().filter(plugin => pinned(plugin.id)).map(plugin => plugin.id),
        hiddenShortcuts: existingRows().filter(row => !visible(row.key)).map(row => row.key),
        saveError};
    },
  };
}

let model
let activeApi
const SELF_ID = 'dev.itstriplesix.settings-pins'
const C = {bg:'#111214',text:'#f2f3f5',muted:'#b5bac1',border:'#3f4147'}
const toast = text => ToastActionCreators.open('SETTINGS_PINS', {text})
const internal = () => activeApi?.unscoped.hidden?.plugins?.internal
const settingsInternal = () => activeApi?.unscoped.hidden?.discord?.settings

// Public pluginSettings API works with Developer Mode disabled.
// Internal discovery and shortcut-hiding remain optional.
const FALLBACK_PLUGINS = [
  ['dev.itstriplesix.account-switcher', 'Account Switcher', 'UserIcon'],
  ['dev.itstriplesix.purge-tools', 'Purge Tools', 'TrashIcon'],
  ['dev.itstriplesix.settings-pins', 'Settings Pins', 'PuzzlePieceIcon'],
  ['dev.itstriplesix.quick-mock', 'Quick Mock', 'PencilIcon'],
  ['dev.itstriplesix.hidden-channels', 'Hidden Channels', 'LockIcon'],
]
function describePlugin(id) {
  const known = FALLBACK_PLUGINS.find(entry => entry[0] === id)
  let hasSettings = false
  try { hasSettings = Boolean(activeApi?.pluginSettings?.hasPluginSettings(id)) } catch {}
  return {id, name: known?.[1] || id, icon: known?.[2] || 'PuzzlePieceIcon',
    started: true, hasSettings}
}

function Settings() {
  const [, redraw] = React.useReducer(value => value + 1, 0)
  React.useEffect(() => {
    const unsubscribe = model?.subscribe(redraw)
    model?.refresh()
    return unsubscribe
  }, [])
  if (!model) return React.createElement(ReactNative.Text, {style:{color:C.text}}, 'Enable Settings Pins to manage shortcuts.')
  const content = [
    React.createElement(ReactNative.Text,{key:'title',style:{color:C.text,fontSize:20,fontWeight:'700',marginBottom:8}},'Settings Pins'),
    React.createElement(ReactNative.Text,{key:'intro',style:{color:C.muted,fontSize:13,lineHeight:18,marginBottom:14}},'Choose which plugin settings appear in the Valenced section. Core settings stay visible.'),
  ]
  if (!model.available()) content.push(React.createElement(ReactNative.Text,{key:'unavailable',style:{color:C.muted}},'Plugin settings API is unavailable.'))
  else {
    if (!internal()?.pList) content.push(React.createElement(ReactNative.Text,{
      key:'discovery-note',style:{color:C.muted,fontSize:12,marginBottom:10},
    },'Saved pins work without Developer Mode. Discovering additional plugins and hiding unrelated shortcuts still requires Developer Mode.'))
    for (const plugin of model.catalog()) content.push(React.createElement(ReactNative.View,{
      key:plugin.id,style:{flexDirection:'row',alignItems:'center',paddingVertical:14,borderBottomWidth:1,borderBottomColor:C.border},
    },React.createElement(ReactNative.View,{style:{flex:1,paddingRight:16}},
      React.createElement(ReactNative.Text,{style:{color:C.text,fontSize:16,fontWeight:'600',marginBottom:3}},plugin.name),
      React.createElement(ReactNative.Text,{style:{color:C.muted,fontSize:12,lineHeight:17}},
        plugin.id===SELF_ID?'Settings Pins manager':!plugin.started?'Disabled — pin appears when enabled':plugin.hasSettings?'Settings available':'No settings page detected'),
    ),React.createElement(ReactNative.Switch,{
      value:model.pinned(plugin.id),
      onValueChange:value=>model.setPinned(plugin.id,value).catch(()=>toast('Could not save this pin. Please try again.')),
      accessibilityLabel:'Pin '+plugin.name,
    })))
    const existing = model.existing()
    if (existing.length) {
      content.push(React.createElement(ReactNative.Text,{key:'existing-title',style:{color:C.text,fontSize:17,fontWeight:'700',marginTop:22,marginBottom:4}},'Existing shortcuts'))
      for (const row of existing) content.push(React.createElement(ExistingShortcut,{key:row.key,row:row}))
    }
  }
  const error=model.diagnostics().saveError
  if(error) content.push(React.createElement(ReactNative.Text,{key:'error',style:{color:'#f23f43',marginTop:12}},error))
  content.push(React.createElement(ReactNative.Text,{key:'version',style:{color:C.muted,fontSize:12,marginTop:14}},'v0.1.2'))
  return React.createElement(ReactNative.ScrollView,{style:{flex:1,backgroundColor:C.bg},contentContainerStyle:{padding:16,paddingBottom:40}},content)
}

function ExistingShortcut({row}) {
  // Run a shortcut's title hook only inside its own React component.
  const title=row.item.useTitle()
  return React.createElement(ReactNative.View,{style:{flexDirection:'row',alignItems:'center',paddingVertical:14,borderBottomWidth:1,borderBottomColor:C.border}},
    React.createElement(ReactNative.Text,{style:{flex:1,color:C.text,fontSize:16}},String(title)),
    React.createElement(ReactNative.Switch,{value:model.visible(row.key),accessibilityLabel:'Show '+title,
      onValueChange:value=>model.setShortcutVisible(row.key,value).catch(()=>toast('That shortcut could not be changed.'))}))
}

exports.default = plugin({
  jsonStorage:{load:true,default:{version:1,pins:{},shortcuts:{}}},
  async start(api) {
    activeApi=api
    const saved=await api.jsonStorage.get()
    model=createPinsModel({
      available:()=>typeof api.pluginSettings?.openPluginSettings==='function'
        && typeof api.pluginSettings?.hasPluginSettings==='function',
      listPlugins:()=>{
        const discovery=internal()
        if (!discovery?.pList) return FALLBACK_PLUGINS.map(entry=>describePlugin(entry[0]))
          .filter(target=>target.hasSettings)
        return Array.from(discovery.pList.values()).map(target=>({
          id:target.manifest.id,name:target.manifest.name,icon:target.manifest.icon,
          started:discovery.isPluginStarted(target),
          hasSettings:api.pluginSettings.hasPluginSettings(target.manifest.id),
        }))
      },
      describePlugin,
      openSettings:id=>api.pluginSettings.openPluginSettings(id),
      iconFor:target=>()=>React.createElement(api.pluginSettings.components.PluginIcon,{icon:target.icon,size:20}),
      toast:text=>toast(text),
      whenSettingsReady:callback=>onSettingsModulesLoaded(callback),
      registerItem:(key,item)=>registerSettingsItem(key,item),
      addToSection:key=>addSettingsItemToSection('VALENCED',key,-1),
      refresh:()=>refreshSettings(),
      shortcutRows:()=>Array.from(new Set(settingsInternal()?.sSections?.VALENCED?.settings||[])).map(key=>({key,item:settingsInternal()?.sConfig[key]})),
      subscribeCatalog:callback=>{
        const emitter=internal()?.pEmitter
        if(!emitter)return()=>{}
        const events=['register','unregister','stateUpdate','statusUpdate','metadataUpdate']
        for(const event of events)emitter.on(event,callback)
        return()=>{for(const event of events)emitter.off(event,callback)}
      },
    },saved,snapshot=>api.jsonStorage.set(snapshot))
    api.cleanup(()=>model?.stop())
    model.start()
    if(false) this.settingsPins=model
  },
  async stop() {await model?.stop();model=undefined;activeApi=undefined},
  SettingsComponent: Settings,
})

return exports;})({});