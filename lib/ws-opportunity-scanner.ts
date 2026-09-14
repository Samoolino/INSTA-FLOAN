export type OrderLevel = [price: number, quantity: number]
export type OrderBook = {
  venue: string
  symbol: string
  bids: OrderLevel[]
  asks: OrderLevel[]
  timestamp: number
  sequence?: number
}

export type WebSocketOpportunity = {
  venueBuy: string
  venueSell: string
  symbol: string
  side: 'BUY_SELL'
  quantity: number
  buyVwap: number
  sellVwap: number
  grossUsd: number
  estimatedCostsUsd: number
  netUsd: number
  timestamp: number
  executable: boolean
  reason?: string
}

type BookState = { bids: Map<number, number>; asks: Map<number, number>; sequence?: number; timestamp: number }
const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n)

function applyLevels(target: Map<number, number>, levels: OrderLevel[]) {
  for (const [price, quantity] of levels) {
    if (!finite(price) || !finite(quantity) || price <= 0) continue
    if (quantity <= 0) target.delete(price)
    else target.set(price, quantity)
  }
}

function topLevels(book: BookState, side: 'bids' | 'asks', max = 20): OrderLevel[] {
  return [...book[side].entries()]
    .sort((a, b) => side === 'bids' ? b[0] - a[0] : a[0] - b[0])
    .slice(0, max)
    .map(([price, quantity]) => [price, quantity])
}

export function vwap(levels: OrderLevel[], desiredQuantity: number): { price: number; quantity: number } {
  if (desiredQuantity <= 0) return {price: 0, quantity: 0}
  let remaining = desiredQuantity
  let notional = 0
  let filled = 0
  for (const [price, quantity] of levels) {
    const take = Math.min(remaining, quantity)
    notional += take * price
    filled += take
    remaining -= take
    if (remaining <= 0) break
  }
  return {price: filled > 0 ? notional / filled : 0, quantity: filled}
}

export function findCrossVenueOpportunities(books: OrderBook[], options: {minNetUsd: number; feeBps?: number; maxAgeMs?: number; maxResults?: number; slippageBps?: number} = {minNetUsd: 0}): WebSocketOpportunity[] {
  const feeBps = options.feeBps ?? 10
  const slippageBps = options.slippageBps ?? 5
  const maxAgeMs = options.maxAgeMs ?? 2_000
  const grouped = new Map<string, OrderBook[]>()
  for (const book of books) {
    if (!finite(book.timestamp) || Date.now() - book.timestamp > maxAgeMs) continue
    if (!book.bids.length || !book.asks.length) continue
    const list = grouped.get(book.symbol) ?? []
    list.push(book)
    grouped.set(book.symbol, list)
  }
  const result: WebSocketOpportunity[] = []
  for (const [symbol, venues] of grouped) {
    for (const buy of venues) for (const sell of venues) {
      if (buy.venue === sell.venue) continue
      const buyTop = buy.asks[0], sellTop = sell.bids[0]
      if (!buyTop || !sellTop || sellTop[0] <= buyTop[0]) continue
      const quantity = Math.min(buyTop[1], sellTop[1])
      if (quantity <= 0) continue
      const buyVwap = vwap(buy.asks, quantity), sellVwap = vwap(sell.bids, quantity)
      if (buyVwap.quantity < quantity || sellVwap.quantity < quantity) continue
      const grossUsd = (sellVwap.price - buyVwap.price) * quantity
      const estimatedCostsUsd = (buyVwap.price + sellVwap.price) * quantity * ((feeBps + slippageBps) / 10_000)
      const netUsd = grossUsd - estimatedCostsUsd
      result.push({venueBuy: buy.venue, venueSell: sell.venue, symbol, side: 'BUY_SELL', quantity, buyVwap: buyVwap.price, sellVwap: sellVwap.price, grossUsd, estimatedCostsUsd, netUsd, timestamp: Math.min(buy.timestamp, sell.timestamp), executable: netUsd >= options.minNetUsd, reason: netUsd >= options.minNetUsd ? undefined : 'NET_BELOW_THRESHOLD'})
    }
  }
  return result.sort((a, b) => b.netUsd - a.netUsd).slice(0, options.maxResults ?? 100)
}

export type WsVenueConfig = {
  venue: string
  url: string
  symbols: string[]
  subscribe: (symbols: string[]) => unknown
  parse: (payload: unknown) => {symbol: string; bids?: OrderLevel[]; asks?: OrderLevel[]; sequence?: number; reset?: boolean} | null
}

export type ScannerSnapshot = {books: OrderBook[]; opportunities: WebSocketOpportunity[]; updatedAt: number}

export class WebSocketOpportunityScanner {
  private readonly books = new Map<string, BookState>()
  private readonly sockets: WebSocket[] = []
  private stopped = false
  constructor(private readonly configs: WsVenueConfig[], private readonly options: {minNetUsd: number; feeBps?: number; maxAgeMs?: number; maxResults?: number; slippageBps?: number}) {}
  start(onSnapshot: (snapshot: ScannerSnapshot) => void) { this.stopped = false; for (const config of this.configs) this.connect(config, onSnapshot) }
  stop() { this.stopped = true; for (const socket of this.sockets) socket.close(); this.sockets.length = 0 }
  private connect(config: WsVenueConfig, onSnapshot: (snapshot: ScannerSnapshot) => void) {
    const socket = new WebSocket(config.url)
    this.sockets.push(socket)
    socket.addEventListener('open', () => socket.send(JSON.stringify(config.subscribe(config.symbols))))
    socket.addEventListener('message', event => {
      try {
        const parsed = config.parse(JSON.parse(String(event.data)))
        if (!parsed || !parsed.symbol) return
        const key = `${config.venue}:${parsed.symbol}`
        const current = this.books.get(key) ?? {bids: new Map(), asks: new Map(), timestamp: 0}
        if (parsed.reset) { current.bids.clear(); current.asks.clear() }
        if (parsed.bids) applyLevels(current.bids, parsed.bids)
        if (parsed.asks) applyLevels(current.asks, parsed.asks)
        current.sequence = parsed.sequence ?? current.sequence
        current.timestamp = Date.now()
        this.books.set(key, current)
        const books: OrderBook[] = [...this.books.entries()].map(([bookKey, state]) => { const [venue, ...symbolParts] = bookKey.split(':'); return {venue, symbol: symbolParts.join(':'), bids: topLevels(state, 'bids'), asks: topLevels(state, 'asks'), timestamp: state.timestamp, sequence: state.sequence} })
        onSnapshot({books, opportunities: findCrossVenueOpportunities(books, this.options), updatedAt: Date.now()})
      } catch {}
    })
    socket.addEventListener('close', () => { if (!this.stopped) setTimeout(() => this.connect(config, onSnapshot), 1_000) })
    socket.addEventListener('error', () => socket.close())
  }
}

export const binanceConfig = (symbols: string[]): WsVenueConfig => ({
  venue: 'BINANCE_WS', url: 'wss://stream.binance.com:9443/stream', symbols,
  subscribe: values => ({method: 'SUBSCRIBE', params: values.map(s => `${s.toLowerCase()}@depth20@100ms`), id: Date.now()}),
  parse: payload => { const data = (payload as any)?.data ?? payload; if (!data?.s || !Array.isArray(data?.b) || !Array.isArray(data?.a)) return null; return {symbol: data.s.replace('_', '').toUpperCase(), bids: data.b.map((x: any) => [Number(x[0]), Number(x[1])]), asks: data.a.map((x: any) => [Number(x[0]), Number(x[1])]), sequence: Number(data.lastUpdateId), reset: true} },
})

export const coinbaseConfig = (symbols: string[]): WsVenueConfig => ({
  venue: 'COINBASE_WS', url: 'wss://ws-feed.exchange.coinbase.com', symbols,
  subscribe: values => ({type: 'subscribe', product_ids: values.map(s => s.replace('USDT', '-USD')), channels: ['level2']}),
  parse: payload => {
    const data = payload as any
    if (!data?.product_id) return null
    const symbol = data.product_id.replace('-USD', 'USDT').replace('-', '').toUpperCase()
    if (data.type === 'snapshot' && data.bids && data.asks) return {symbol, bids: data.bids.map((x: any) => [Number(x[0]), Number(x[1])]), asks: data.asks.map((x: any) => [Number(x[0]), Number(x[1])]), reset: true}
    if (!Array.isArray(data?.changes)) return null
    const bids: OrderLevel[] = [], asks: OrderLevel[] = []
    for (const [side, price, quantity] of data.changes) { const level: OrderLevel = [Number(price), Number(quantity)]; if (side === 'buy') bids.push(level); if (side === 'sell') asks.push(level) }
    return {symbol, bids, asks}
  },
})

export const bybitConfig = (symbols: string[]): WsVenueConfig => ({
  venue: 'BYBIT_WS', url: 'wss://stream.bybit.com/v5/public/spot', symbols,
  subscribe: values => ({op: 'subscribe', args: values.map(s => `orderbook.50.${s.toUpperCase()}`)}),
  parse: payload => { const data = payload as any, body = data?.data; if (!body?.s || !body?.b || !body?.a) return null; return {symbol: body.s.replace('-', '').toUpperCase(), bids: body.b.map((x: any) => [Number(x[0]), Number(x[1])]), asks: body.a.map((x: any) => [Number(x[0]), Number(x[1])]), sequence: Number(body.u), reset: body.type === 'snapshot'} },
})
