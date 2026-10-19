import { useId, useState } from 'react'

const FINISHES = ['Silver', 'Gold', 'Black'] as const

/** An original geometric finish study, explicitly separate from actual product imagery. */
export function FinishPreview() {
  const [finish, setFinish] = useState<(typeof FINISHES)[number]>('Gold')
  const [lit, setLit] = useState(false)
  const id = useId().replace(/:/g, '')
  const colors = finish === 'Gold' ? ['#e4c47a', '#92723e', '#f6e0a3']
    : finish === 'Silver' ? ['#e0e4e5', '#868e90', '#f5f5f1'] : ['#454944', '#121511', '#667062']

  return <div className={`finish-playground${lit ? ' is-lit' : ''}`}>
    <div className="finish-playground__wall">
      <div className="finish-playground__light" aria-hidden />
      <svg className="finish-playground__pattern" viewBox="0 0 400 400" role="img" aria-label={`Illustrative laser-cut pattern in ${finish.toLowerCase()} finish${lit ? ' with backlighting' : ''}`}>
        <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={colors[0]} /><stop offset="0.45" stopColor={colors[1]} /><stop offset="0.7" stopColor={colors[2]} /><stop offset="1" stopColor={colors[0]} /></linearGradient></defs>
        <g fill="none" stroke={`url(#${id})`} strokeWidth="6" strokeLinejoin="round">
          <circle cx="200" cy="200" r="172" /><circle cx="200" cy="200" r="155" />
          {Array.from({ length: 12 }, (_, index) => <g key={index} transform={`rotate(${index * 30} 200 200)`}>
            <path d="M200 42 C144 96 145 151 200 200 C255 151 256 96 200 42Z" />
            <path d="M200 80 L254 148 L200 200 L146 148 Z" />
          </g>)}
          <circle cx="200" cy="200" r="24" />
        </g>
      </svg>
    </div>
    <span className="finish-playground__label">Pattern study / {finish}</span>
    <div className="finish-playground__controls"><div className="finish-options" role="group" aria-label="Preview a metal finish">
      {FINISHES.map((option) => <button key={option} type="button" aria-pressed={finish === option} onClick={() => setFinish(option)}><i className={`finish-swatch finish-swatch--${option.toLowerCase()}`} />{option}</button>)}
    </div><button type="button" className="finish-light-switch" aria-pressed={lit} onClick={() => setLit(!lit)}><span aria-hidden />{lit ? 'Backlight on' : 'Try a backlight'}</button></div>
    <p>Illustrative finish preview. Actual finishes and add-ons vary by product.</p>
  </div>
}
