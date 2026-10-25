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
  focusWindow: () => ipcRenderer.invoke('window:focus'),
  toggleOverlay: () => ipcRenderer.invoke('overlay:toggle'),
  hideOverlay: () => ipcRenderer.invoke('overlay:hide'),
  setOverlayOpacity: (value) => ipcRenderer.invoke('overlay:opacity', value),
})
