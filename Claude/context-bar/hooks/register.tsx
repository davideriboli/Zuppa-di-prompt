import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import type { Limit, Slice, Snapshot } from '../types'

const COMMAND = 'context-bar'
const snapshot = atom({ plugin: 'context-bar', key: 'snapshot' } as const, null)
const isOn = atom({ plugin: 'context-bar', key: 'isOn' } as const, true)
// Cambia una volta al minuto: chi lo legge si ridisegna, e il tempo all'azzeramento resta giusto.
const minute = atom({ plugin: 'context-bar', key: 'minute' } as const, 0)

// Le righe di /context arrivano in inglese: qui il nome che compare nella legenda.
const LABELS: Record<string, string> = {
  'System prompt': 'Prompt di sistema',
  'System tools': 'Strumenti di sistema',
  'MCP tools': 'Strumenti MCP',
  'Custom agents': 'Agenti',
  'Memory files': 'Memoria',
  Skills: 'Skill',
  Messages: 'Messaggi',
  'Free space': 'Libero',
  'Autocompact buffer': 'Riserva di compattazione',
}

// Le finestre dei crediti, come le chiama il motore.
const LIMIT_LABELS: Record<string, string> = {
  five_hour: 'Sessione',
  seven_day: 'Settimana',
  spend_limit: 'Spesa',
}
const LIMIT_CELLS = 20
// Sotto questa larghezza la barra del contesto va su una riga sua, senza riepilogo accanto.
const MIN_BAR = 10

const GLYPH: Record<Slice['kind'], string> = { used: '█', free: '░', buffer: '▒', deferred: '' }

// Aggiornare a ogni strumento costerebbe troppo: al massimo una volta ogni 5 secondi.
const THROTTLE_MS = 5000

// Si arrotonda prima di scegliere l'unità: 999,6 è "1k", 999.950 è "1M".
export function formatTokens(n: number): string {
  if (Math.round(n) < 1000) return String(Math.round(n))
  let value = n / 1000
  let unit = 'k'
  if (Math.round(value) >= 1000) {
    value = n / 1_000_000
    unit = 'M'
  }
  const text = value >= 99.95 ? String(Math.round(value)) : value.toFixed(1).replace(/\.0$/, '')

  return text.replace('.', ',') + unit
}

// Divide `width` celle fra le fette, in proporzione ai token (metodo dei resti più grandi).
// Ogni fetta non vuota ha almeno una cella, finché ce ne sono abbastanza.
export function allocate(slices: readonly Slice[], total: number, width: number): number[] {
  if (slices.length === 0 || total <= 0 || width <= 0) return slices.map(() => 0)

  const exact = slices.map(s => (s.tokens / total) * width)
  const cells = exact.map(x => Math.floor(x))
  if (slices.length <= width) {
    cells.forEach((c, i) => {
      if (c === 0 && slices[i]!.tokens > 0) cells[i] = 1
    })
  }

  let left = width - cells.reduce((a, b) => a + b, 0)
  const byRemainder = exact
    .map((x, i) => ({ i, rest: x - Math.floor(x) }))
    .sort((a, b) => b.rest - a.rest)
  for (let k = 0; left > 0 && byRemainder.length > 0; k++, left--) {
    cells[byRemainder[k % byRemainder.length]!.i]! += 1
  }
  // Troppe celle per via dei minimi: le toglie alla fetta più grande.
  while (left < 0) {
    const biggest = cells.indexOf(Math.max(...cells))
    cells[biggest]! -= 1
    left++
  }

  return cells
}

// Quanto manca all'azzeramento, in parole: "tra 2 h 13 min", "tra 3 g 4 h".
export function formatReset(resetsAt: string | undefined, now: number): string {
  const at = resetsAt ? Date.parse(resetsAt) : NaN
  if (Number.isNaN(at)) return ''
  const minutes = Math.max(0, Math.round((at - now) / 60000))
  if (minutes < 60) return `si azzera tra ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `si azzera tra ${hours} h ${minutes % 60} min`

  return `si azzera tra ${Math.floor(hours / 24)} g ${hours % 24} h`
}

export function limitColor(percent: number): string {
  if (percent >= 80) return 'error'
  if (percent >= 50) return 'warning'

  return 'success'
}

// Celle piene di una barra dei crediti, sempre fra 0 e `cells`.
export function limitFill(percent: number, cells: number): number {
  return Math.max(0, Math.min(cells, Math.round((percent / 100) * cells)))
}

// Non lancia mai: una barra non aggiornata non deve fermare un comando o uno strumento.
async function refresh($: EngineInterface): Promise<void> {
  const usage = await $.session.usage({ breakdown: 'summary' }).catch(() => null)
  const breakdown = usage?.context.breakdown
  if (!usage || !breakdown) return

  const slices: Slice[] = breakdown.categories
    .filter(c => c.kind !== 'deferred' && c.tokens > 0)
    .map(c => ({ name: LABELS[c.name] ?? c.name, tokens: c.tokens, color: c.color, kind: c.kind }))
  const limits: Limit[] = usage.rateLimits.map(r => ({
    kind: r.kind,
    percent: r.percentUsed,
    resetsAt: r.resetsAt,
  }))
  const next: Snapshot = {
    slices,
    limits,
    used: breakdown.totalTokens,
    window: breakdown.rawMaxTokens,
    percent: breakdown.percentage,
  }
  await update($, snapshot, () => next).catch(() => {})
}

export const register: Register = on => {
  let lastRefresh = 0
  let ticker: Timer | undefined

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: COMMAND,
      description: 'Mostra o nasconde la barra del contesto sopra il prompt',
    })
    const stored = await $.store.get('isOn')
    if (typeof stored === 'boolean') await update($, isOn, () => stored)
    void refresh($)
    ticker?.cancel()
    ticker = $.clock.every(60_000, () => {
      void $.clock
        .now()
        .then(now => update($, minute, () => now))
        .catch(() => {})
    })

    return next(e)
  })

  on('command.run', { command: COMMAND }, async $ => {
    const now = !(await read($, isOn))
    await update($, isOn, () => now)
    await $.store.set('isOn', now).catch(() => {})
    if (now) await refresh($)

    return { text: now ? 'Barra del contesto accesa.' : 'Barra del contesto spenta.' }
  })

  on('tool.call', async ($, e, next) => {
    const result = await next(e)
    const now = await $.clock.now().catch(() => 0)
    if (now - lastRefresh >= THROTTLE_MS) {
      lastRefresh = now
      void refresh($)
    }

    return result
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    lastRefresh = await $.clock.now().catch(() => lastRefresh)
    await refresh($)

    return result
  })

  on('session.compact', async ($, e, next) => {
    const result = await next(e)
    await refresh($)

    return result
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const shot = await read($, snapshot)
    if (e.props.hasSurvey || shot === null || !(await read($, isOn))) {
      return next(e)
    }

    const { Box, Text } = $.ui.resolve(e)
    await read($, minute)
    const columns = Math.max(1, e.props.bodyColumns)
    const summary = ` ${formatTokens(shot.used)}/${formatTokens(shot.window)} · ${Math.round(shot.percent)}%`
    const isNarrow = columns - summary.length < MIN_BAR
    const width = isNarrow ? columns : columns - summary.length
    const total = Math.max(shot.window, shot.slices.reduce((a, s) => a + s.tokens, 0))
    const cells = allocate(shot.slices, total, width)
    // Spazio per etichetta e percentuale ("Settimana " e " 100%"): la barra dei crediti si accorcia.
    const limitCells = Math.max(1, Math.min(LIMIT_CELLS, columns - 15))
    const now = await $.clock.now().catch(() => Date.now())

    return (
      <Box flexDirection="column">
        <Box key="bar" flexDirection="row">
          {shot.slices.map((s, i) =>
            cells[i] ? (
              <Text key={`cell-${i}`} color={s.color}>
                {GLYPH[s.kind].repeat(cells[i]!)}
              </Text>
            ) : null,
          )}
          {!isNarrow && (
            <Text key="summary" dimColor>
              {summary}
            </Text>
          )}
        </Box>
        {isNarrow && (
          <Text key="summary" dimColor>
            {summary.trim()}
          </Text>
        )}
        <Box key="legend" flexDirection="row" flexWrap="wrap" columnGap={2}>
          {shot.slices.map((s, i) => (
            <Box key={`legend-${i}`} flexDirection="row">
              <Text color={s.color}>{s.kind === 'used' ? '■' : GLYPH[s.kind]} </Text>
              <Text dimColor>
                {s.name} {formatTokens(s.tokens)}
              </Text>
            </Box>
          ))}
        </Box>
        {shot.limits.length > 0 && (
          <Box key="limits" flexDirection="row" flexWrap="wrap" columnGap={3}>
            {shot.limits.map(l => {
              const filled = limitFill(l.percent, limitCells)
              const reset = formatReset(l.resetsAt, now)

              return (
                <Box key={`limit-${l.kind}`} flexDirection="row">
                  <Text>{LIMIT_LABELS[l.kind] ?? l.kind} </Text>
                  <Text color={limitColor(l.percent)}>{'█'.repeat(filled)}</Text>
                  <Text dimColor>{'░'.repeat(limitCells - filled)}</Text>
                  <Text color={limitColor(l.percent)}> {Math.round(l.percent)}%</Text>
                  {reset !== '' && <Text dimColor> · {reset}</Text>}
                </Box>
              )
            })}
          </Box>
        )}
      </Box>
    )
  })
}
