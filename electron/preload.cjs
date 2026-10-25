'use strict'

const { contextBridge, ipcRenderer } = require('electron')

// подписка на событие из main, возвращает отписку
function listen(channel, cb) {
  const handler = (_e, data) => cb(data)
  ipcRenderer.on(channel, handler)
  return () => ipcRenderer.removeListener(channel, handler)
}

contextBridge.exposeInMainWorld('wf', {
  apiGet: (path, ttlSeconds, force) => ipcRenderer.invoke('api:get', path, ttlSeconds, force),
  detectAccount: () => ipcRenderer.invoke('profile:detect'),
  fetchProfile: (accountId, platform) => ipcRenderer.invoke('profile:fetch', accountId, platform),
  openExternal: (url) => ipcRenderer.invoke('open:external', url),
  catalog: (name, force) => ipcRenderer.invoke('catalog:get', name, force),
  marketItems: (force) => ipcRenderer.invoke('market:items', force),
  marketPrice: (slug) => ipcRenderer.invoke('market:price', slug),
  marketPrices: (force) => ipcRenderer.invoke('market:prices', force),
  marketHistory: (slug) => ipcRenderer.invoke('market:history', slug),
  buildsList: (itemName) => ipcRenderer.invoke('builds:list', itemName),
  buildDetail: (id) => ipcRenderer.invoke('builds:detail', id),
  scanRewards: () => ipcRenderer.invoke('rewards:scan'),
  rivenWeapons: () => ipcRenderer.invoke('market:rivenWeapons'),
  rivenAttributes: () => ipcRenderer.invoke('market:rivenAttributes'),
  rivenAuctions: (query) => ipcRenderer.invoke('market:rivenAuctions', query),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (patch) => ipcRenderer.invoke('settings:set', patch),
  onSettings: (cb) => listen('settings:changed', cb),
  notify: (payload) => ipcRenderer.invoke('notify', payload),
  onNavigate: (cb) => listen('navigate', cb),
  onLookupLines: (cb) => listen('lookup:lines', cb),
  showLookup: (size) => ipcRenderer.invoke('lookup:show', size),
  hideLookup: () => ipcRenderer.invoke('lookup:hide'),
  openLastLookup: () => ipcRenderer.invoke('lookup:lastShot'),
  openLastScan: () => ipcRenderer.invoke('rewards:lastShot'),
  onRewards: (cb) => {
    const onResult = (_e, data) => cb({ type: 'result', data })
    const onStatus = (_e, data) => cb({ type: 'status', data })
    ipcRenderer.on('rewards:result', onResult)
    ipcRenderer.on('rewards:status', onStatus)
    return () => {
      ipcRenderer.removeListener('rewards:result', onResult)
      ipcRenderer.removeListener('rewards:status', onStatus)
    }
  },
  loginWarframe: () => ipcRenderer.invoke('account:login'),
  parseAccountId: (text) => ipcRenderer.invoke('account:parse', text),
  openUserDataPage: () => ipcRenderer.invoke('account:userDataPage'),
  focusWindow: () => ipcRenderer.invoke('window:focus'),
  toggleOverlay: () => ipcRenderer.invoke('overlay:toggle'),
  hideOverlay: () => ipcRenderer.invoke('overlay:hide'),
  setOverlayOpacity: (value) => ipcRenderer.invoke('overlay:opacity', value),
})
