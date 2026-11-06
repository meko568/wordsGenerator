import { useEffect, useMemo, useRef, useState } from 'react'
import { Slot, SlotType, Space, NumPos, fromPreset, patternSpace, shuffled, wordSpace } from './lib/generate'

const BATCH = 200
const PRESETS = ['CVCV', 'CVCVC', 'LLLL', 'LLLD', 'DLLL', 'LLDD', 'CVCC', 'LDLD', 'CVCVCV']
const TYPES: [SlotType, string][] = [
  ['letter', 'Any letter'], ['vowel', 'Vowel'], ['consonant', 'Consonant'],
  ['digit', 'Digit'], ['alnum', 'Letter or digit'], ['custom', 'Pick characters…'],
]

function Results({ space, favs, toggle }: { space: Space; favs: Set<string>; toggle: (w: string) => void }) {
  const [shown, setShown] = useState(BATCH)
  const [copied, setCopied] = useState(-1)
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => setShown(BATCH), [space])
  useEffect(() => {
    const el = end.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setShown((s) => Math.min(s + BATCH, space.total)), { rootMargin: '600px' })
    io.observe(el)
    return () => io.disconnect()
  }, [space, shown])
  const items = useMemo(() => Array.from({ length: Math.min(shown, space.total) }, (_, i) => space.at(i)), [space, shown])
  const chunks = Array.from({ length: Math.ceil(items.length / BATCH) }, (_, c) => items.slice(c * BATCH, (c + 1) * BATCH))
  const copy = (c: number) => {
    navigator.clipboard.writeText(chunks[c].join('\n'))
    setCopied(c); setTimeout(() => setCopied(-1), 1200)
  }
  if (!space.total) return <p className="empty">Nothing to generate yet. Add a slot or loosen the filters.</p>
  return (
    <>
      <p className="count"><b>{space.total.toLocaleString()}</b> possible · showing {items.length.toLocaleString()}</p>
      {chunks.map((ch, c) => (
        <div key={c} className="batch">
          <div className="batch-head">
            <span>{c * BATCH + 1}–{c * BATCH + ch.length}</span>
            <button onClick={() => copy(c)}>{copied === c ? 'Copied' : `Copy ${ch.length}`}</button>
          </div>
          <div className="grid">
            {ch.map((w, i) => (
              <button key={i} className={'tile' + (favs.has(w) ? ' fav' : '')} onClick={() => toggle(w)} title="Click to save">{w}</button>
            ))}
          </div>
        </div>
      ))}
      <div ref={end} className="end" />
    </>
  )
}

export default function App() {
  const [tab, setTab] = useState<'dict' | 'pattern'>('dict')
  const [favs, setFavs] = useState<Set<string>>(new Set())
  const [random, setRandom] = useState(false)
  const [seed, setSeed] = useState(Math.random())
  const toggle = (w: string) => setFavs((f) => { const n = new Set(f); n.has(w) ? n.delete(w) : n.add(w); return n })

  // dictionary section
  const [list, setList] = useState<'common' | 'all'>('common')
  const [words, setWords] = useState<string[]>([])
  const [digits, setDigits] = useState(2)
  const [pos, setPos] = useState<NumPos>('suffix')
  const [minL, setMinL] = useState(3)
  const [maxL, setMaxL] = useState(7)
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    setLoading(true)
    fetch(`${import.meta.env.BASE_URL}words-${list}.txt`).then((r) => r.text())
      .then((t) => setWords(t.split('\n').map((w) => w.trim().toLowerCase()).filter(Boolean))).finally(() => setLoading(false))
  }, [list])
  const dictSpace = useMemo(() => {
    const ws = words.filter((w) => w.length >= minL && w.length <= maxL)
    return wordSpace(ws, digits, pos)
  }, [words, minL, maxL, digits, pos])

  // pattern section
  const [slots, setSlots] = useState<Slot[]>(fromPreset('CVCV'))
  const patSpace = useMemo(() => patternSpace(slots), [slots])
  const setSlot = (i: number, p: Partial<Slot>) => setSlots((s) => s.map((x, j) => (j === i ? { ...x, ...p } : x)))

  const base = tab === 'dict' ? dictSpace : patSpace
  const space = useMemo(() => (random ? shuffled(base, seed) : base), [base, random, seed])

  const copyFavs = () => navigator.clipboard.writeText([...favs].join('\n'))
  const csv = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([[...favs].join('\n')], { type: 'text/csv' }))
    a.download = 'shortlist.csv'; a.click()
  }

  return (
    <main>
      <header>
        <h1>{[...'WORDS'].map((c, i) => <span key={i} className="tile big">{c}</span>)}</h1>
        <p>Find a name worth owning. Build it from real words or from letters you choose.</p>
      </header>
      <nav>
        <button className={tab === 'dict' ? 'on' : ''} onClick={() => setTab('dict')}>Real words + numbers</button>
        <button className={tab === 'pattern' ? 'on' : ''} onClick={() => setTab('pattern')}>Letter patterns</button>
      </nav>
      <div className="layout">
        <section className="panel">
          {tab === 'dict' ? (
            <>
              <label>Word list
                <select value={list} onChange={(e) => setList(e.target.value as 'common' | 'all')}>
                  <option value="common">Common words (~10k, brandable)</option>
                  <option value="all">Full English (~370k)</option>
                </select>
              </label>
              <label>Number goes
                <select value={pos} onChange={(e) => setPos(e.target.value as NumPos)}>
                  <option value="suffix">After the word (apple42)</option><option value="prefix">Before the word (42apple)</option>
                </select>
              </label>
              <label>Digits: {digits}<input type="range" min={0} max={4} value={digits} onChange={(e) => setDigits(+e.target.value)} /></label>
              <label>Word length: {minL}–{maxL}
                <span className="row"><input type="number" min={2} max={maxL} value={minL} onChange={(e) => setMinL(+e.target.value)} />
                <input type="number" min={minL} max={20} value={maxL} onChange={(e) => setMaxL(+e.target.value)} /></span>
              </label>
              {loading && <p className="count">Loading words…</p>}
            </>
          ) : (
            <>
              <div className="chips">{PRESETS.map((p) => <button key={p} onClick={() => setSlots(fromPreset(p))}>{p}</button>)}</div>
              <p className="hint">C consonant · V vowel · L letter · D digit</p>
              {slots.map((s, i) => (
                <div className="slot" key={i}>
                  <span className="tile">{i + 1}</span>
                  <select value={s.type} onChange={(e) => setSlot(i, { type: e.target.value as SlotType })}>
                    {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  {s.type === 'custom' && <input placeholder="e.g. aeo7" value={s.custom} onChange={(e) => setSlot(i, { custom: e.target.value })} />}
                  <button aria-label="Remove slot" onClick={() => setSlots((x) => x.filter((_, j) => j !== i))}>×</button>
                </div>
              ))}
              <button className="add" disabled={slots.length >= 10} onClick={() => setSlots((s) => [...s, { type: 'letter', custom: '' }])}>Add slot</button>
            </>
          )}
          <label className="check"><input type="checkbox" checked={random} onChange={(e) => setRandom(e.target.checked)} /> Random order</label>
          {random && <button onClick={() => setSeed(Math.random())}>Reshuffle</button>}
        </section>
        <section><Results space={space} favs={favs} toggle={toggle} /></section>
      </div>
      {favs.size > 0 && (
        <aside className="short">
          <b>Shortlist ({favs.size})</b>
          <span>{[...favs].slice(-6).join(', ')}</span>
          <button onClick={copyFavs}>Copy</button><button onClick={csv}>Download CSV</button><button onClick={() => setFavs(new Set())}>Clear</button>
        </aside>
      )}
    </main>
  )
}
