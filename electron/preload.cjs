'use strict'

const { contextBridge, ipcRenderer } = require('electron')

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
