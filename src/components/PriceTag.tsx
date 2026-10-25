import { useEffect, useRef, useState } from 'react'
import { useMarketPrice } from '../hooks/useApi'
import { betterForDucats } from '../lib/market'

interface PriceTagProps {
  slug: string | null | undefined
  ducats?: number | null
  compareDucats?: boolean
}

// цена грузится только когда тег попал в экран, иначе market банит за спам
export function PriceTag({ slug, ducats, compareDucats = false }: PriceTagProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || visible) return
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setVisible(true), { rootMargin: '200px' })
    io.observe(el)
    return () => io.disconnect()
  }, [visible])

  const { data, loading, error } = useMarketPrice(visible && slug ? slug : null)
  const sell = data?.sell ?? null

  return (
    <span ref={ref} className="price">
      {!slug ? null : loading && !data ? (
        <span className="faint">…</span>
      ) : error ? (
        <span className="faint" title={error}>нет цены</span>
      ) : (
        <span className="num" title="Минимальная цена продажи среди игроков онлайн на warframe.market">
          {sell === null ? '-' : `${sell} пл`}
        </span>
      )}
      {ducats ? <span className="faint num"> {ducats} дук</span> : null}
      {compareDucats && betterForDucats(sell, ducats ?? null) && <span className="tag tag--gold" title="Платины за неё дают мало - выгоднее сдать Баро за дукаты">Баро</span>}
    </span>
  )
}
