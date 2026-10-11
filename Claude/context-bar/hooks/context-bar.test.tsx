import { expect, mock, test } from 'claude-code/testing'
import type { ContextCategory, SessionUsage } from 'claude-code'

import { allocate, formatReset, formatTokens, limitColor, limitFill } from './register'

const row = (name: string, tokens: number, color: string, kind: ContextCategory['kind']): ContextCategory => ({
  name,
  tokens,
  color,
  kind,
  isDeferred: kind === 'deferred',
})

const USAGE = {
  startedAt: 0,
  rateLimits: [
    { kind: 'five_hour', percentUsed: 62.5, resetsAt: '2026-10-11T15:00:00Z' },
    { kind: 'seven_day', percentUsed: 7 },
  ],
  context: {
    breakdown: {
      categories: [
        row('System prompt', 4000, 'promptBorder', 'used'),
        row('Messages', 46000, 'claude', 'used'),
        row('MCP tools', 9000, 'ide', 'deferred'),
        row('Free space', 117000, 'inactive', 'free'),
        row('Autocompact buffer', 33000, 'subtle', 'buffer'),
      ],
      totalTokens: 50000,
      rawMaxTokens: 200000,
      percentage: 25,
    },
  },
} as unknown as SessionUsage

const TOGGLE = {
  command: 'context-bar',
  args: '',
  origin: { kind: 'plugin', name: 'test' },
  presentation: { isFullscreen: false, columns: 80 },
} as const

const BAND = {
  component: 'AbovePrompt',
  props: {
    hasSurvey: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 80,
    scroll: { offset: 0, bodyRows: 9 },
    view: {},
  },
} as const

test('le celle seguono i token e riempiono la larghezza', () => {
  const slices = [
    { name: 'a', tokens: 1, color: 'x', kind: 'used' as const },
    { name: 'b', tokens: 99, color: 'y', kind: 'free' as const },
  ]
  const cells = allocate(slices, 100, 20)
  expect(cells[0]).toBe(1)
  expect(cells.reduce((a, b) => a + b, 0)).toBe(20)
  expect(formatTokens(46000)).toBe('46k')
  expect(formatTokens(1250)).toBe('1,3k')
  expect(formatTokens(1_000_000)).toBe('1M')
})

test('casi limite: arrotondamenti e barre dei crediti fuori scala', () => {
  expect(formatTokens(999.6)).toBe('1k')
  expect(formatTokens(99_960)).toBe('100k')
  expect(formatTokens(999_950)).toBe('1M')
  expect(limitFill(-5, 20)).toBe(0)
  expect(limitFill(150, 20)).toBe(20)
  expect(limitFill(50, 20)).toBe(10)
})

test('azzeramento in parole e colore per soglia', () => {
  const now = Date.parse('2026-10-11T12:47:00Z')
  expect(formatReset('2026-10-11T15:00:00Z', now)).toBe('si azzera tra 2 h 13 min')
  expect(formatReset('2026-10-14T16:47:00Z', now)).toBe('si azzera tra 3 g 4 h')
  expect(formatReset(undefined, now)).toBe('')
  expect(limitColor(10)).toBe('success')
  expect(limitColor(60)).toBe('warning')
  expect(limitColor(95)).toBe('error')
})

test('/context-bar spegne e riaccende la barra', async ($, on) => {
  mock.clock(on, { now: Date.parse('2026-10-11T12:47:00Z') })
  on('session.usage', () => ({ value: USAGE }))
  // Al posto del motore: quando la mod lascia passare, il motore non disegna niente.
  on('ui.render', ($, e) => {
    const { Box } = $.ui.resolve(e)

    return <Box key="engine" />
  })

  for (const surface of ['terminal', 'desktop'] as const) {
    const off = await $.command.run(TOGGLE)
    expect(off.text).toBe('Barra del contesto spenta.')
    let ui = await $.ui.mount({ plugin: 'context-bar', surface, ...BAND })
    expect(await ui.find({ type: 'Text', text: /Messaggi/ })).toBeUndefined()
    await ui.unmount()

    const back = await $.command.run(TOGGLE)
    expect(back.text).toBe('Barra del contesto accesa.')
    ui = await $.ui.mount({ plugin: 'context-bar', surface, ...BAND })
    expect(await ui.find({ type: 'Text', text: /Messaggi 46k/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /50k\/200k · 25%/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /MCP/ })).toBeUndefined()
    expect(await ui.find({ type: 'Text', text: /Sessione/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /63%/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /si azzera tra 2 h 13 min/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /Settimana/ })).toBeDefined()
    await ui.unmount()

    // Terminale stretto: il riepilogo scende su una riga sua, niente si rompe.
    const narrow = { ...BAND, props: { ...BAND.props, bodyColumns: 20 } }
    ui = await $.ui.mount({ plugin: 'context-bar', surface, ...narrow })
    expect(await ui.find({ type: 'Text', text: /^50k\/200k · 25%$/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /Sessione/ })).toBeDefined()
    await ui.unmount()
  }
})
