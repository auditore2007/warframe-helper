import { useCallback, useEffect, useState } from 'react'
import { apiGet } from '../lib/api'
import type { ApiResult, BuildDetail, BuildSummary, CatalogMap, CatalogName, MarketItem, MarketPrice, PriceHistory, PriceMap } from '../lib/types'

type Loader<T> = (force: boolean) => Promise<ApiResult<T>>

const memory = new Map<string, ApiResult<unknown>>()
const inflight = new Map<string, Promise<ApiResult<unknown>>>()

function load<T>(key: string, loader: Loader<T>, force: boolean): Promise<ApiResult<T>> {
  const pending = inflight.get(key)
  if (pending && !force) return pending as Promise<ApiResult<T>>
  const request = loader(force)
    .catch((err: unknown): ApiResult<T> => ({ ok: false, error: err instanceof Error ? err.message : 'Ошибка загрузки' }))
    .then((res) => {
      inflight.delete(key)
      if (res.ok) memory.set(key, res)
      return res
    })
  inflight.set(key, request as Promise<ApiResult<unknown>>)
  return request
}

export interface ApiState<T> {
  data: T | undefined
  loading: boolean
  error: string | undefined
  stale: boolean
  fetchedAt: number | undefined
  refresh: () => void
}

// общий кэш запросов по ключу, key = null - ничего не грузим
export function useResource<T>(key: string | null, loader: Loader<T>, pollSeconds = 0): ApiState<T> {
  const [result, setResult] = useState<ApiResult<T> | undefined>(() => (key ? (memory.get(key) as ApiResult<T>) : undefined))
  const [loading, setLoading] = useState(Boolean(key && !memory.has(key)))

  // loader зависит только от key
  const run = useCallback(
    (force: boolean) => {
      if (!key) return () => undefined
      let alive = true
      setLoading(true)
      load<T>(key, loader, force)
        .then((res) => alive && setResult(res))
        .finally(() => alive && setLoading(false))
      return () => {
        alive = false
      }
    },
    [key],
  )

  useEffect(() => {
    setResult(key ? (memory.get(key) as ApiResult<T> | undefined) : undefined)
    return run(false)
  }, [key, run])

  useEffect(() => {
    if (!pollSeconds || !key) return
    const id = window.setInterval(() => run(false), pollSeconds * 1000)
    return () => window.clearInterval(id)
  }, [key, pollSeconds, run])

  return {
    data: result?.ok ? result.data : undefined,
    loading,
    error: result && !result.ok ? result.error : undefined,
    stale: Boolean(result?.stale),
    fetchedAt: result?.fetchedAt,
    refresh: () => void run(true),
  }
}

const DESKTOP_ONLY: ApiResult<never> = { ok: false, error: 'Раздел работает только в приложении для компьютера' }

export function useApi<T>(path: string | null, ttl: number, pollSeconds = 0): ApiState<T> {
  return useResource<T>(path, (force) => apiGet<T>(path ?? '', ttl, force), pollSeconds)
}

export function useCatalogData<K extends CatalogName>(name: K): ApiState<CatalogMap[K]> {
  return useResource<CatalogMap[K]>(`catalog:${name}`, async (force) => (window.wf ? window.wf.catalog(name, force) : DESKTOP_ONLY))
}

export function useMarketItems(enabled = true): ApiState<MarketItem[]> {
  return useResource<MarketItem[]>(enabled ? 'market:items' : null, async (force) => (window.wf ? window.wf.marketItems(force) : DESKTOP_ONLY))
}

export function useMarketPrice(slug: string | null): ApiState<MarketPrice> {
  return useResource<MarketPrice>(slug ? `market:price:${slug}` : null, async () => (window.wf && slug ? window.wf.marketPrice(slug) : DESKTOP_ONLY))
}

export function useMarketPrices(enabled = true): ApiState<PriceMap> {
  return useResource<PriceMap>(enabled ? 'market:prices' : null, async (force) => (window.wf ? window.wf.marketPrices(force) : DESKTOP_ONLY))
}

export function useMarketHistory(slug: string | null): ApiState<PriceHistory> {
  return useResource<PriceHistory>(slug ? `market:history:${slug}` : null, async () => (window.wf && slug ? window.wf.marketHistory(slug) : DESKTOP_ONLY))
}

export function useBuilds(itemName: string | null): ApiState<BuildSummary[]> {
  return useResource<BuildSummary[]>(itemName ? `builds:${itemName}` : null, async () => (window.wf && itemName ? window.wf.buildsList(itemName) : DESKTOP_ONLY))
}

export function useBuildDetail(id: number | null): ApiState<BuildDetail> {
  return useResource<BuildDetail>(id ? `build:${id}` : null, async () => (window.wf && id ? window.wf.buildDetail(id) : DESKTOP_ONLY))
}
