import { useState, useRef, useEffect } from 'react'
import svgPaths from '../imports/svg-4q7b6u1dzf'
import img1 from './imports/LandingMobWeb/67311103a0a2389572aabcc7813b1ff66a26bae5.png'
import img124 from './imports/LandingMobWeb/d56b7aeca11e1c0224b7b81b9844e4cf04ab43b6.png'
import img125 from './imports/LandingMobWeb/acfe9459958bfb92e16b187307db8bb0d42b8c3d.png'
import imgDoma212 from './imports/LandingMobWeb-3/afa9aac61ee0a763fe9339567e53c6eed5cf4051.png'
import imgDoma213 from './imports/LandingMobWeb-3/e4f0285429201ac18575b2ebc88fa9c0b0bbaa8a.png'
import imgDoma214 from './imports/LandingMobWeb-3/ae87b8736b2b7d3f71d88f53a361de541f45966a.png'
import imgNewHous5 from './imports/LandingMobWeb-3/620d2cefba0849ccaa632e6925fb872d5c319df2.png'
import imgNewHous6 from './imports/LandingMobWeb-3/e3e69bb735c906d0c795a054be64ccf8884e118f.png'
import imgNewHous7 from './imports/LandingMobWeb-3/d875c54a2c07d778fb7212091b73aa80416f2615.png'
import imgNewHous8 from './imports/LandingMobWeb-3/ef2ef8555a403fe76dee024c1405e416b861aecf.png'
import imgNewHous9 from './imports/LandingMobWeb-3/235ed83e0205eaa9f9be01bf153aa12ea43e7d2f.png'
import imgPct2 from './imports/LandingMobWeb-3/9379bac60f20f60c0fa989f2afeed6280352f74a.png'
import imgPct3 from './imports/LandingMobWeb-3/3145f35f9635706102d49296548b7538af52d0f5.png'

// ─── Math ────────────────────────────────────────────────────────────────────

function calcMonthlyPayment(principal: number, annualRate: number, months: number): number {
  if (months <= 0 || principal <= 0) return 0
  if (annualRate === 0) return principal / months
  const r = annualRate / 100 / 12
  return principal * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
}

function calcMaxLoan(payment: number, annualRate: number, months: number): number {
  if (months <= 0 || payment <= 0) return 0
  if (annualRate === 0) return payment * months
  const r = annualRate / 100 / 12
  return payment * (Math.pow(1 + r, months) - 1) / (r * Math.pow(1 + r, months))
}

// Simulate how many months to pay off `principal` at a fixed monthly `payment`.
function calcNewTerm(principal: number, annualRate: number, payment: number): number {
  const r = annualRate / 100 / 12
  let balance = principal
  let n = 0
  while (balance > 0.5 && n < 1200) {
    const interest = balance * r
    const principalPaid = payment - interest
    if (principalPaid <= 0) return 1200
    balance -= principalPaid
    n++
  }
  return n
}

function fmt(n: number): string {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.round(Math.abs(n)))
}

const MONTHS_RU = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const MONTHS_GEN = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']
const MONTHS_PREP = ['январе','феврале','марте','апреле','мае','июне','июле','августе','сентябре','октябре','ноябре','декабре']

interface ScheduleRow { year: number; month: number; payment: number; earlyPayment: number; balance: number }

function buildSchedule(
  principal: number,
  annualRate: number,
  totalMonths: number,
  startDate: string,
  earlyMonthly = 0,
): ScheduleRow[] {
  if (principal <= 0 || totalMonths <= 0) return []
  const pmt = calcMonthlyPayment(principal, annualRate, totalMonths)
  const r = annualRate / 100 / 12
  let balance = principal
  const rows: ScheduleRow[] = []
  const start = startDate ? new Date(startDate) : new Date()
  let year = start.getFullYear()
  let month = start.getMonth()
  for (let i = 0; i < totalMonths * 2 && balance > 0.5; i++) {
    const interest = balance * r
    const principalPaid = Math.min(pmt - interest, balance)
    balance = Math.max(0, balance - principalPaid)
    const extra = earlyMonthly > 0 ? Math.min(earlyMonthly, balance) : 0
    balance = Math.max(0, balance - extra)
    rows.push({ year, month, payment: pmt, earlyPayment: extra, balance })
    month++
    if (month > 11) { month = 0; year++ }
    if (balance <= 0.5) break
  }
  return rows
}

// ─── Payment Schedule Modal ────────────────────────────────────────────────────

function PaymentScheduleModal({ principal, annualRate, totalMonths, startDate, earlyMonthly = 0, onClose }: {
  principal: number; annualRate: number; totalMonths: number; startDate: string; earlyMonthly?: number; onClose: () => void
}) {
  const rows = buildSchedule(principal, annualRate, totalMonths, startDate, earlyMonthly)
  const hasEarly = earlyMonthly > 0
  const years = [...new Set(rows.map(r => r.year))].sort()
  const [activeYear, setActiveYear] = useState(years[0] ?? new Date().getFullYear())
  const scrollRef = useRef<HTMLDivElement>(null)
  const yearRefs = useRef<Record<number, HTMLDivElement | null>>({})

  function scrollToYear(year: number) {
    setActiveYear(year)
    const el = yearRefs.current[year]
    const container = scrollRef.current
    if (!el || !container) return
    const containerTop = container.getBoundingClientRect().top
    const elTop = el.getBoundingClientRect().top
    container.scrollTop += elTop - containerTop - 48 // 48 = sticky header height
  }

  // Update active tab as user scrolls
  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    function onScroll() {
      const containerTop = container!.getBoundingClientRect().top + 48
      let best = years[0]
      for (const year of years) {
        const el = yearRefs.current[year]
        if (!el) continue
        if (el.getBoundingClientRect().top <= containerTop + 8) best = year
      }
      setActiveYear(best)
    }

    container.addEventListener('scroll', onScroll, { passive: true })
    return () => container.removeEventListener('scroll', onScroll)
  }, [years.join(',')])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div className="bg-white w-full max-w-[640px] rounded-t-[24px] flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-[16px] pt-[20px] pb-[12px] shrink-0">
          <p className="font-['Lato:Bold',sans-serif] text-[22px] leading-[28px] text-[#0d162e] tracking-[-0.5px]">Ваш график</p>
          <button onClick={onClose} className="w-[32px] h-[32px] flex items-center justify-center rounded-full cursor-pointer bg-[#f3f5fa] hover:bg-[#e6e9f0]">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1L11 11M11 1L1 11" stroke="#0d162e" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Year tabs – horizontal scroll only */}
        <div
          className="shrink-0 flex"
          style={{ borderBottom: '1px solid #D0D8E9', overflowX: 'auto', overflowY: 'hidden', height: 49 }}
        >
          {years.map(y => (
            <button
              key={y}
              onClick={() => scrollToYear(y)}
              className="px-[12px] shrink-0 cursor-pointer flex items-end"
              style={{
                height: 49,
                borderBottom: y === activeYear ? '2px solid #005EDE' : '2px solid transparent',
              }}
            >
              <p className={`font-['Lato:Bold',sans-serif] text-[16px] leading-[24px] tracking-[-0.2px] whitespace-nowrap pb-[10px] ${y === activeYear ? 'text-[#005ede]' : 'text-[#0d162e]'}`}>{y}</p>
            </button>
          ))}
        </div>

        {/* Scrollable table */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* Sticky column headers */}
          <div className="flex items-center gap-[24px] px-[16px] py-[10px] sticky top-0 bg-white z-10" style={{ borderBottom: '1px solid #D0D8E9' }}>
            <p className="flex-[1_0_0] font-['Lato:Regular',sans-serif] text-[14px] leading-[20px] text-[#697797]">Месяц</p>
            <p className="w-[80px] text-right font-['Lato:Regular',sans-serif] text-[14px] leading-[20px] text-[#697797]">Платёж</p>
            {hasEarly && <p className="w-[80px] text-right font-['Lato:Regular',sans-serif] text-[14px] leading-[20px] text-[#0468ff]">Досрочно</p>}
            <p className="w-[84px] text-right font-['Lato:Regular',sans-serif] text-[14px] leading-[20px] text-[#697797]">Остаток</p>
          </div>

          {/* All years in one continuous list */}
          {years.map(year => (
            <div key={year}>
              <div
                ref={el => { yearRefs.current[year] = el }}
                className="px-[16px] py-[8px] bg-[#f3f5fa]"
              >
                <p className="font-['Lato:Bold',sans-serif] text-[14px] leading-[20px] text-[#0d162e]">{year}</p>
              </div>
              {rows.filter(r => r.year === year).map((row, i) => (
                <div key={i} className="flex items-center gap-[24px] px-[16px] py-[14px]" style={{ borderBottom: '1px solid #F3F5FA' }}>
                  <p className="flex-[1_0_0] font-['Lato:Regular',sans-serif] text-[16px] leading-[24px] text-[#0d162e]">{MONTHS_RU[row.month]}</p>
                  <p className="w-[80px] text-right font-['Lato:Regular',sans-serif] text-[16px] leading-[24px] text-[#0d162e]">{fmt(row.payment)} ₽</p>
                  {hasEarly && (
                    <p className="w-[80px] text-right font-['Lato:Regular',sans-serif] text-[16px] leading-[24px] text-[#0468ff]">
                      {row.earlyPayment > 0.5 ? `${fmt(row.earlyPayment)} ₽` : '—'}
                    </p>
                  )}
                  <p className="w-[84px] text-right font-['Lato:Regular',sans-serif] text-[16px] leading-[24px] text-[#0d162e]">{fmt(row.balance)} ₽</p>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Download button */}
        <div className="px-[16px] pt-[12px] pb-[16px] shrink-0" style={{ borderTop: '1px solid #D0D8E9' }}>
          <div className="bg-[#0468ff] h-[54px] rounded-[12px] w-full flex items-center justify-center cursor-pointer gap-[6px]">
            <svg width="14" height="16" viewBox="0 0 14 16" fill="none">
              <path d="M8.00005 8.36463L8.00006 0H6.00005L6.00005 8.36463L3.1776 5.76452L1.82251 7.23548L7.00005 12.0052L12.1776 7.23548L10.8225 5.76452L8.00005 8.36463Z" fill="white"/>
              <path d="M2 10V14H12V10H14V14C14 15.1046 13.1046 16 12 16H2C0.89543 16 0 15.1046 0 14V10H2Z" fill="white"/>
            </svg>
            <p className="font-['Lato:Bold',sans-serif] text-[16px] leading-[22px] text-white tracking-[-0.2px]">Скачать</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function fmtYears(months: number): string {
  const y = Math.floor(months / 12)
  const m = months % 12
  if (y === 0) return `${m} мес.`
  if (m === 0) return `${y} ${y === 1 ? 'год' : y < 5 ? 'года' : 'лет'}`
  return `${y} ${y === 1 ? 'год' : y < 5 ? 'года' : 'лет'} ${m} мес.`
}

function fmtSavedTime(months: number): string {
  const y = Math.floor(months / 12)
  const m = months % 12
  function declMon(n: number) { return n === 1 ? 'месяц' : n < 5 ? 'месяца' : 'месяцев' }
  function declYear(n: number) { return n === 1 ? 'год' : n < 5 ? 'года' : 'лет' }
  if (y === 0) return `${m} ${declMon(m)}`
  if (m === 0) return `${y} ${declYear(y)}`
  return `${y} ${declYear(y)} ${m} ${declMon(m)}`
}

// ─── Types ────────────────────────────────────────────────────────────────────

type CalcMode = 'monthly' | 'property' | 'early'
type EarlyType = 'once' | 'monthly'
type EarlyReduce = 'payment' | 'term'

interface EarlyEntry {
  type: EarlyType
  reduce: EarlyReduce
  date: string
  amount: string
}

// ─── SVG Icons ───────────────────────────────────────────────────────────────

function IconBurger() {
  return (
    <div className="max-h-[24px] max-w-[24px] min-h-[24px] min-w-[24px] relative">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="h-[14px] relative shrink-0 w-[20px]">
          <svg className="absolute block inset-0 size-full" fill="none" height="14" preserveAspectRatio="none" viewBox="0 0 20 14" width="20">
            <g><path d="M0 0H20V2H0V0Z" fill="#7683A0" /><path d="M0 6H20V8H0V6Z" fill="#7683A0" /><path d="M20 12H0V14H20V12Z" fill="#7683A0" /></g>
          </svg>
        </div>
      </div>
    </div>
  )
}

function IconCalc() {
  return (
    <div className="absolute left-[14.91px] max-h-[39.77px] max-w-[39.77px] min-h-[39.77px] min-w-[39.77px] top-[14.91px] w-[39.771px]">
      <div className="content-stretch flex items-center justify-center size-full">
        <div className="h-[39.771px] relative shrink-0 w-[39.774px]">
          <svg className="absolute block inset-0 size-full" fill="none" height="39.7714" preserveAspectRatio="none" viewBox="0 0 39.7739 39.7714" width="39.7739">
            <g>
              <path d={svgPaths.p39440180} fill="white" />
              <path d={svgPaths.pc1a4840} fill="white" />
              <path d={svgPaths.p14b12c00} fill="white" />
              <path d={svgPaths.p32122800} fill="white" />
              <path d={svgPaths.p23c5ff00} fill="white" />
              <path d={svgPaths.pb2b1600} fill="white" />
              <path d={svgPaths.p28507340} fill="white" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  )
}

function IconSpecialLoan() {
  return (
    <div className="h-[24px] relative shrink-0 w-[23px]">
      <svg className="absolute block inset-0 size-full" fill="none" height="24" preserveAspectRatio="none" viewBox="0 0 23 24" width="23">
        <g><path d={svgPaths.p1188a580} fill="white" /><path d={svgPaths.p15cf6380} fill="white" /><path d={svgPaths.p30787780} fill="white" /></g>
      </svg>
    </div>
  )
}

function IconHouse() {
  return (
    <div className="h-[22px] relative shrink-0 w-[20px]">
      <svg className="absolute block inset-0 size-full" fill="none" height="22" preserveAspectRatio="none" viewBox="0 0 20 22" width="20">
        <g>
          <path clipRule="evenodd" d={svgPaths.p16c30000} fill="white" fillRule="evenodd" />
          <path d="M14 12H20V22H14V12Z" fill="white" />
        </g>
      </svg>
    </div>
  )
}

function IconPieChart() {
  return (
    <div className="relative shrink-0 size-[22px]">
      <svg className="absolute block inset-0 size-full" fill="none" height="22" preserveAspectRatio="none" viewBox="0 0 22 22" width="22">
        <g><path d={svgPaths.p3c5da300} fill="white" /><path d={svgPaths.p2418def0} fill="white" /></g>
      </svg>
    </div>
  )
}

function IconChevronRight() {
  return (
    <div className="flex h-[15.414px] items-center justify-center relative shrink-0 w-[9.121px]">
      <div className="-rotate-90 -scale-y-100 flex-none">
        <div className="h-[9.121px] relative w-[15.414px]">
          <svg className="absolute block inset-0 size-full" fill="none" height="9.12132" preserveAspectRatio="none" viewBox="0 0 15.4142 9.12132" width="15.4142">
            <path clipRule="evenodd" d={svgPaths.p19e3d780} fill="#7683A0" fillRule="evenodd" />
          </svg>
        </div>
      </div>
    </div>
  )
}

function IconPlus() {
  return (
    <div className="relative shrink-0 size-[12px]">
      <svg className="absolute block inset-0 size-full" fill="none" height="12" preserveAspectRatio="none" viewBox="0 0 12 12" width="12">
        <path d={svgPaths.pd220e00} fill="#0468FF" />
      </svg>
    </div>
  )
}

function IconCalendar() {
  return (
    <div className="h-[15px] relative shrink-0 w-[14px]">
      <svg className="absolute block inset-0 size-full" fill="none" height="15" preserveAspectRatio="none" viewBox="0 0 14 15" width="14">
        <g>
          <path d="M7 7H3V10H7V7Z" fill="#0468FF" />
          <path clipRule="evenodd" d={svgPaths.p6136af0} fill="#0468FF" fillRule="evenodd" />
        </g>
      </svg>
    </div>
  )
}

// Bar chart icon — matches design (3 ascending bars)
function IconBarChart() {
  return (
    <svg width="13" height="14" viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 14V0H13V14H10Z" fill="#0468FF"/>
      <path d="M5 5V14H8V5H5Z" fill="#0468FF"/>
      <path d="M0 8V14H3V8H0Z" fill="#0468FF"/>
    </svg>
  )
}

// Chevron for FAQ accordion
function IconChevronFaq({ open }: { open: boolean }) {
  return (
    <svg width="22" height="13" viewBox="0 0 22 13" fill="none" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
      <path fillRule="evenodd" clipRule="evenodd" d="M0 1.41421L1.41421 0L10.7071 9.29289L20 0L21.4142 1.41421L10.7071 12.1213L0 1.41421Z" fill="#7683A0"/>
    </svg>
  )
}

function LogoCian() {
  return (
    <div className="h-[20.792px] relative shrink-0 w-[82px]">
      <div className="absolute inset-[7.92%_0_0_27.03%]">
        <svg className="absolute block inset-0 size-full" fill="none" height="19.1445" preserveAspectRatio="none" viewBox="0 0 59.835 19.1445" width="59.835">
          <path d={svgPaths.p62d7b80} fill="#212C46" />
        </svg>
      </div>
      <div className="absolute inset-[0_79.46%_13.15%_0]">
        <svg className="absolute block inset-0 size-full" fill="none" height="18.0576" preserveAspectRatio="none" viewBox="0 0 16.8438 18.0576" width="16.8438">
          <path d={svgPaths.p38f73b00} fill="#0054FD" />
        </svg>
      </div>
    </div>
  )
}

function LogoCianNew() {
  return (
    <div className="h-[24px] relative shrink-0 w-[66px]">
      <svg className="absolute block inset-0 size-full" fill="none" height="24" preserveAspectRatio="none" viewBox="0 0 66 24" width="66">
        <g clipPath="url(#clip0_cian)">
          <path clipRule="evenodd" d={svgPaths.p14765200} fill="black" fillRule="evenodd" />
          <path clipRule="evenodd" d={svgPaths.p26cffd80} fill="black" fillRule="evenodd" />
          <path clipRule="evenodd" d={svgPaths.p861d580} fill="black" fillRule="evenodd" />
          <path clipRule="evenodd" d={svgPaths.p121d3080} fill="black" fillRule="evenodd" />
          <path clipRule="evenodd" d={svgPaths.p3deaf00} fill="black" fillRule="evenodd" />
          <path clipRule="evenodd" d={svgPaths.p25111a00} fill="black" fillRule="evenodd" />
        </g>
        <defs>
          <clipPath id="clip0_cian"><rect fill="white" height="24" width="66" /></clipPath>
        </defs>
      </svg>
    </div>
  )
}

// ─── Shared result sub-components ────────────────────────────────────────────

function RatioBar({ loan, down, interest }: { loan: number; down: number; interest: number }) {
  const total = loan + down + interest
  if (total <= 0) return null
  const lp = (loan / total) * 100
  const dp = (down / total) * 100
  const ip = (interest / total) * 100
  return (
    <div className="flex flex-col gap-[12px] items-start relative shrink-0 w-full">
      <div className="flex gap-[3px] h-[12px] items-start overflow-clip relative rounded-[6px] shrink-0 w-full">
        <div style={{ width: `${lp}%` }} className="bg-[#0054fd] h-full min-w-[4px] rounded-[3px]" />
        <div style={{ width: `${dp}%` }} className="bg-[#0095ff] h-full min-w-[4px] rounded-[3px]" />
        <div style={{ width: `${ip}%` }} className="bg-[#74d6fd] h-full min-w-[4px] rounded-[3px]" />
      </div>
      <div className="flex flex-wrap gap-[6px_10px] items-start relative shrink-0 w-full">
        {[
          { color: '#0054fd', label: `Кредит ${fmt(loan)} ₽` },
          { color: '#0095ff', label: `Взнос ${fmt(down)} ₽` },
          { color: '#74d6fd', label: `Проценты ${fmt(interest)} ₽` },
        ].map(({ color, label }) => (
          <div key={label} className="flex gap-[6px] items-center relative shrink-0">
            <div className="relative rounded-[2px] shrink-0 size-[10px]" style={{ background: color }} />
            <p className="font-['Lato:Regular',sans-serif] leading-[16px] relative shrink-0 text-[#0d162e] text-[12px] whitespace-nowrap">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatPair({ label1, val1, label2, val2 }: { label1: string; val1: string; label2: string; val2: string }) {
  return (
    <div className="flex gap-[8px] items-start relative shrink-0 text-[#0d162e] w-full whitespace-nowrap">
      {[{ label: label1, val: val1 }, { label: label2, val: val2 }].map(({ label, val }) => (
        <div key={label} className="flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px relative">
          <p className="font-['Lato:Regular',sans-serif] leading-[16px] not-italic relative shrink-0 text-[12px]">{label}</p>
          <p className="font-['Lato:Bold',sans-serif] leading-[24px] relative shrink-0 text-[16px] tracking-[-0.2px]">{val}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Shared UI Components ─────────────────────────────────────────────────────

function RadioToggle({ selected, onClick }: { selected: boolean; onClick?: () => void }) {
  if (selected) {
    return (
      <button onClick={onClick} className="bg-[#006cfd] cursor-pointer relative rounded-[999px] size-[20px]">
        <div className="flex flex-row items-center justify-center size-full">
          <div className="relative shrink-0 size-[10px]">
            <svg className="absolute block inset-0 size-full" fill="none" viewBox="0 0 10 10" width="10" height="10">
              <circle cx="5" cy="5" fill="white" r="5" />
            </svg>
          </div>
        </div>
      </button>
    )
  }
  return (
    <button onClick={onClick} className="bg-white relative rounded-[999px] size-[20px] cursor-pointer">
      <div aria-hidden className="absolute border-2 border-[#d0d8e9] border-solid inset-0 pointer-events-none rounded-[999px]" />
    </button>
  )
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`h-[44px] min-w-[44px] relative rounded-[8px] shrink-0 cursor-pointer ${active ? 'bg-[#e6f0ff]' : 'bg-white'}`}
    >
      {active
        ? <div aria-hidden className="absolute border border-[#3686ff] border-solid inset-0 pointer-events-none rounded-[8px]" />
        : <div aria-hidden className="absolute border border-[#d0d8e9] border-solid inset-0 pointer-events-none rounded-[8px]" />
      }
      <div className="flex flex-row items-center justify-center min-w-[inherit] size-full">
        <div className="flex gap-[8px] items-center justify-center px-[16px] py-[10px]">
          <p className="font-['Lato:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#0d162e] text-[16px] whitespace-nowrap">{label}</p>
        </div>
      </div>
    </button>
  )
}

// Format money with spaces between thousands
function formatMoney(raw: string): string {
  const n = parseFloat(raw.replace(/\s/g, ''))
  if (isNaN(n)) return raw
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.floor(n))
}

function parseMoney(formatted: string): string {
  return formatted.replace(/\s/g, '').replace(/[^\d.]/g, '')
}

function InputNum({
  label, value, onChange, suffix, placeholder, money = false,
}: {
  label: string; value: string; onChange: (v: string) => void; suffix?: string; placeholder?: string; money?: boolean
}) {
  const displayValue = money && value ? formatMoney(value) : value

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (money) {
      onChange(parseMoney(e.target.value))
    } else {
      onChange(e.target.value)
    }
  }

  return (
    <div className="relative shrink-0 w-full">
      <div className="content-stretch flex flex-col items-start relative size-full">
        <div className="content-stretch flex gap-[2px] items-center pb-[6px] relative shrink-0">
          <p className="font-['Lato:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#0d162e] text-[14px] whitespace-nowrap">{label}</p>
        </div>
        <div className="bg-white h-[44px] relative rounded-[8px] shrink-0 w-full">
          <div className="flex items-center overflow-clip relative rounded-[inherit] size-full">
            <div className="flex-[1_0_0] min-w-px relative">
              <div className="flex flex-row items-center size-full">
                <div className="flex items-center px-[12px] py-[8px] relative size-full">
                  <input
                    type="text"
                    inputMode={money ? 'numeric' : 'decimal'}
                    value={displayValue}
                    placeholder={placeholder}
                    onChange={handleChange}
                    className="flex-[1_0_0] font-['Lato:Regular',sans-serif] leading-[24px] not-italic text-[#0d162e] text-[16px] min-w-0 bg-transparent outline-none border-none w-full"
                  />
                </div>
              </div>
            </div>
            {suffix && (
              <div className="h-full relative shrink-0">
                <div className="flex flex-row items-center justify-end size-full">
                  <div className="flex items-center justify-end pr-[12px] py-[8px]">
                    <p className="font-['Lato:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#0d162e] text-[16px] whitespace-nowrap">{suffix}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div aria-hidden className="absolute border border-[#d0d8e9] border-solid inset-0 pointer-events-none rounded-[8px]" />
        </div>
      </div>
    </div>
  )
}

function formatDateRu(value: string): string {
  if (!value) return ''
  const parts = value.split('-')
  if (parts.length !== 3) return value
  const y = parseInt(parts[0])
  const m = parseInt(parts[1])
  const d = parseInt(parts[2])
  if (!y || !m || !d) return value
  return `${d} ${MONTHS_GEN[m - 1]} ${y}`
}

function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="relative shrink-0 w-full">
      <div className="content-stretch flex flex-col items-start relative size-full">
        <div className="content-stretch flex gap-[2px] items-center pb-[6px] relative shrink-0">
          <p className="font-['Lato:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#152242] text-[14px] whitespace-nowrap">{label}</p>
        </div>
        <div
          className="bg-white h-[44px] relative rounded-[8px] shrink-0 w-full cursor-pointer"
          onClick={() => { try { inputRef.current?.showPicker() } catch { inputRef.current?.focus() } }}
        >
          <div className="flex items-center overflow-clip relative rounded-[inherit] size-full">
            <div className="h-full relative shrink-0">
              <div className="flex flex-row items-center size-full">
                <div className="flex items-center pl-[12px] py-[8px]">
                  <IconCalendar />
                </div>
              </div>
            </div>
            <div className="flex-[1_0_0] min-w-px relative px-[12px]">
              <p className="font-['Lato:Regular',sans-serif] leading-[24px] text-[#152242] text-[14px] whitespace-nowrap">
                {formatDateRu(value)}
              </p>
            </div>
          </div>
          <input
            ref={inputRef}
            type="date"
            value={value}
            onChange={e => onChange(e.target.value)}
            className="absolute opacity-0 inset-0 w-full h-full cursor-pointer"
            tabIndex={-1}
          />
          <div aria-hidden className="absolute border border-[#c9d1e5] border-solid inset-0 pointer-events-none rounded-[8px]" />
        </div>
      </div>
    </div>
  )
}

function Divider() {
  return (
    <div className="h-px relative shrink-0 w-full">
      <div className="flex flex-row items-end size-full">
        <div className="flex items-end relative size-full">
          <div className="flex-[1_0_0] h-0 min-w-px relative">
            <div className="absolute inset-[-1px_0_0_0]">
              <svg className="block size-full" fill="none" height="1" preserveAspectRatio="none" viewBox="0 0 335 1" width="335">
                <line stroke="#D0D8E9" x2="335" y1="0.5" y2="0.5" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Header ───────────────────────────────────────────────────────────────────

function AppHeader() {
  return (
    <div className="bg-white h-[50px] relative w-full">
      <div className="flex flex-row items-center justify-center size-full overflow-clip">
        <div className="flex items-center justify-between px-[20px] relative size-full">
          <div className="flex gap-[20px] items-center relative shrink-0">
            <IconBurger />
            <p className="font-['Lato:Bold',sans-serif] text-[18px] text-[#212C46]">Циан</p>
          </div>
          <div className="flex gap-[24px] items-center relative shrink-0">
            <div className="flex gap-[8px] items-start justify-center relative shrink-0">
              <div className="max-h-[16px] max-w-[16px] min-h-[16px] min-w-[16px] relative shrink-0">
                <div className="flex items-center justify-center size-full">
                  <div className="h-[15.954px] relative shrink-0 w-[16px]">
                    <svg className="absolute block inset-0 size-full" fill="none" height="15.9543" preserveAspectRatio="none" viewBox="0 0 16 15.9543" width="16">
                      <g>
                        <path d={svgPaths.p2fd01f00} fill="#0468FF" />
                        <path d={svgPaths.p3ea00600} fill="#0468FF" />
                        <path d={svgPaths.p15e7db40} fill="#0468FF" />
                        <path clipRule="evenodd" d={svgPaths.p3c483a80} fill="#0468FF" fillRule="evenodd" />
                      </g>
                    </svg>
                  </div>
                </div>
              </div>
              <div className="absolute bg-[#c2122d] left-[11px] rounded-[20px] size-[8px] top-[-3px]">
                <div aria-hidden className="absolute border border-solid border-white inset-[-1px] pointer-events-none rounded-[21px]" />
              </div>
            </div>
            <div className="max-h-[16px] max-w-[16px] min-h-[16px] min-w-[16px] relative shrink-0">
              <div className="flex items-center justify-center size-full">
                <div className="h-[15px] relative shrink-0 w-[16px]">
                  <svg className="absolute block inset-0 size-full" fill="none" height="15" preserveAspectRatio="none" viewBox="0 0 16 15" width="16">
                    <path clipRule="evenodd" d={svgPaths.p19e907f2} fill="#0468FF" fillRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div aria-hidden className="absolute border-[#d0d8e9] border-b border-solid inset-0 pointer-events-none" />
    </div>
  )
}

// ─── Cover ────────────────────────────────────────────────────────────────────

function AppCover({ onCalculate }: { onCalculate: () => void }) {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-col items-center justify-center overflow-clip size-full">
        <div className="flex flex-col items-center justify-center pt-[16px] px-[16px] relative size-full">
          <div className="flex flex-col gap-[24px] items-center justify-center overflow-clip py-[36px] relative rounded-[40px] shrink-0 w-full">
            <div className="relative shrink-0 size-[120px]">
              <div className="-translate-x-1/2 -translate-y-1/2 absolute bg-[#0054fd] left-[calc(50%+0.6px)] overflow-clip rounded-[19.2px] shadow-[0px_0px_0px_12px_#0095ff,0px_0px_0px_24px_#74d6fd] size-[69.6px] top-1/2">
                <IconCalc />
              </div>
            </div>
            <div className="flex flex-col font-['Lato:Bold',sans-serif] gap-[12px] items-start not-italic relative shrink-0 text-center w-full">
              <p className="leading-[40px] relative shrink-0 text-[#0d162e] text-[36px] w-full">Умный калькулятор ипотеки</p>
              <p className="leading-[24px] relative shrink-0 text-[#697797] text-[16px] tracking-[-0.2px] w-full">Подберём комфортный платёж или план выгодного погашения кредита</p>
            </div>
            <button
              onClick={onCalculate}
              className="bg-[#0468ff] h-[54px] min-w-[40px] relative rounded-[12px] shrink-0 w-[209px] cursor-pointer hover:bg-[#0055dd] transition-colors"
            >
              <div className="flex flex-row items-center justify-center size-full">
                <div className="flex gap-[8px] items-center justify-center px-[16px] py-[11px]">
                  <p className="font-['Lato:Bold',sans-serif] leading-[22px] not-italic relative shrink-0 text-[16px] text-white tracking-[-0.2px] whitespace-nowrap">Рассчитать</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Mode selector row ────────────────────────────────────────────────────────

function ModeRow({
  icon, title, sub, selected, onClick, showDivider,
}: {
  icon: React.ReactNode; title: string; sub: string; selected: boolean; onClick: () => void; showDivider: boolean
}) {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-col items-start relative size-full">
        <div className="flex gap-[12px] items-start py-[12px] relative shrink-0 w-full">
          <div className="bg-[#0661ec] relative rounded-[8px] shrink-0">
            <div className="flex flex-row items-center justify-center size-full">
              <div className="flex items-center justify-center p-[8px] relative size-full">
                {icon}
              </div>
            </div>
          </div>
          <div className="flex flex-[1_0_0] flex-col font-['Lato:Regular',sans-serif] gap-[4px] items-start justify-center min-w-px not-italic relative">
            <p className="leading-[24px] overflow-hidden relative shrink-0 text-[#0d162e] text-[16px] text-ellipsis w-full">{title}</p>
            <p className="leading-[20px] overflow-hidden relative shrink-0 text-[#697797] text-[14px] text-ellipsis w-full">{sub}</p>
          </div>
          <div className="flex items-start py-[2px] relative shrink-0">
            <RadioToggle selected={selected} onClick={onClick} />
          </div>
        </div>
        {showDivider && <Divider />}
      </div>
    </div>
  )
}

// ─── Term field ───────────────────────────────────────────────────────────────

function TermField({ term, setTerm }: { term: string; setTerm: (v: string) => void }) {
  const chips = ['15', '20', '30']
  return (
    <div className="flex flex-col gap-[12px] items-start relative shrink-0 w-full">
      <div className="relative shrink-0 w-full">
        <div className="flex flex-col items-start relative size-full">
          <div className="flex gap-[2px] items-center pb-[6px] relative shrink-0">
            <p className="font-['Lato:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#0d162e] text-[14px] whitespace-nowrap">Срок</p>
          </div>
          <div className="bg-white h-[44px] relative rounded-[8px] shrink-0 w-full">
            <div className="flex items-center overflow-clip relative rounded-[inherit] size-full">
              <div className="flex-[1_0_0] min-w-px relative">
                <div className="flex flex-row items-center size-full">
                  <div className="flex items-center px-[12px] py-[8px] relative size-full">
                    <input
                      type="number"
                      value={term}
                      onChange={e => setTerm(e.target.value)}
                      className="flex-[1_0_0] font-['Lato:Regular',sans-serif] leading-[24px] not-italic text-[#0d162e] text-[16px] min-w-0 bg-transparent outline-none border-none w-full"
                    />
                  </div>
                </div>
              </div>
              <div className="h-full relative shrink-0">
                <div className="flex items-center justify-end size-full">
                  <div className="flex items-center justify-end pr-[12px] py-[8px]">
                    <p className="font-['Lato:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#0d162e] text-[16px] whitespace-nowrap">лет</p>
                  </div>
                </div>
              </div>
            </div>
            <div aria-hidden className="absolute border border-[#d0d8e9] border-solid inset-0 pointer-events-none rounded-[8px]" />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-[8px] items-start relative shrink-0 w-full">
        {chips.map(c => (
          <Chip key={c} label={`${c} лет`} active={term === c} onClick={() => setTerm(c)} />
        ))}
      </div>
    </div>
  )
}

function DownPaymentPctChips({
  propertyValue, setDownPayment,
}: {
  propertyValue: number; setDownPayment: (v: string) => void
}) {
  const pcts = [20, 30, 40, 50]
  return (
    <div className="flex flex-wrap gap-[8px] items-start relative shrink-0 w-full mt-[8px]">
      {pcts.map(p => (
        <Chip
          key={p}
          label={`${p}%`}
          active={false}
          onClick={() => setDownPayment(String(Math.round(propertyValue * p / 100)))}
        />
      ))}
    </div>
  )
}

// ─── Early repayment block ────────────────────────────────────────────────────

function EarlyBlock({ entry, onChange, showRemove, onRemove, index }: {
  entry: EarlyEntry
  onChange: (e: EarlyEntry) => void
  showRemove: boolean
  onRemove: () => void
  index: number
}) {
  return (
    <div className="bg-white relative rounded-[16px] shrink-0 w-full">
      <div className="flex flex-col gap-[16px] items-start overflow-clip p-[16px] relative rounded-[inherit] size-full">
        <div className="flex items-center justify-between w-full shrink-0">
          <p className="font-['Lato:Bold',sans-serif] leading-[24px] not-italic relative text-[#0d162e] text-[18px] tracking-[-0.5px] whitespace-nowrap">
            {index === 0 ? 'Досрочное погашение' : `Досрочное погашение ${index + 1}`}
          </p>
          {showRemove && (
            <button
              onClick={onRemove}
              className="w-[28px] h-[28px] rounded-full bg-[#f3f5fa] flex items-center justify-center cursor-pointer hover:bg-[#e6e9f0] transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 1L9 9M9 1L1 9" stroke="#697797" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
        <div className="flex flex-col gap-[12px] items-start relative shrink-0 w-full">
          <div className="flex flex-wrap gap-[8px] items-start relative shrink-0 w-full">
            <Chip label="Разовое" active={entry.type === 'once'} onClick={() => onChange({ ...entry, type: 'once' })} />
            <Chip label="Ежемесячно" active={entry.type === 'monthly'} onClick={() => onChange({ ...entry, type: 'monthly' })} />
          </div>
        </div>
        <div className="flex flex-col gap-[2px] items-start relative shrink-0 w-full">
          <div className="flex gap-[2px] items-center pb-[6px] relative shrink-0">
            <p className="font-['Lato:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#0d162e] text-[14px] whitespace-nowrap">Что уменьшить?</p>
          </div>
          <div className="flex flex-wrap gap-[8px] items-start relative shrink-0 w-full">
            <Chip label="Платёж" active={entry.reduce === 'payment'} onClick={() => onChange({ ...entry, reduce: 'payment' })} />
            <Chip label="Срок" active={entry.reduce === 'term'} onClick={() => onChange({ ...entry, reduce: 'term' })} />
          </div>
        </div>
        <div className="flex gap-[8px] items-start relative shrink-0 w-full">
          <div className="flex-[1_0_0] min-w-px">
            <DateInput label="Дата платежа" value={entry.date} onChange={v => onChange({ ...entry, date: v })} />
          </div>
          <div className="flex-[1_0_0] min-w-px">
            <InputNum
              label="Сумма сверх платежа"
              value={entry.amount}
              onChange={v => onChange({ ...entry, amount: v })}
              suffix="₽"
              money
            />
          </div>
        </div>
      </div>
      <div aria-hidden className="absolute border border-[#d0d8e9] border-solid inset-0 pointer-events-none rounded-[16px]" />
    </div>
  )
}

// ─── Results ──────────────────────────────────────────────────────────────────

function ResultMonthly({ property, down, rate, termYears, onShowSchedule }: { property: number; down: number; rate: number; termYears: number; onShowSchedule: () => void }) {
  const loan = Math.max(0, property - down)
  const months = termYears * 12
  const pmt = calcMonthlyPayment(loan, rate, months)
  const total = pmt * months
  const interest = Math.max(0, total - loan)
  const income = Math.round(pmt / 0.4)

  return (
    <div className="bg-[#f3f5fa] relative rounded-[20px] shrink-0 w-full">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="flex flex-col gap-[24px] items-start pb-[16px] pt-[20px] px-[16px] relative size-full">
          <div className="flex flex-col gap-[16px] items-start relative shrink-0 w-full">
            <div className="flex flex-col items-start relative shrink-0 w-full">
              <p className="font-['Lato:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#0d162e] text-[14px] tracking-[-0.2px] w-full">Ваш платёж</p>
              <p className="font-['Lato:Bold',sans-serif] leading-[40px] relative text-[#0d162e] text-[32px] tracking-[-0.5px] w-full">
                {fmt(pmt)} ₽/мес
              </p>
            </div>
            <StatPair label1="Всего заплатите" val1={`${fmt(total)} ₽`} label2="Нужный доход" val2={`${fmt(income)} ₽`} />
          </div>
          <RatioBar loan={loan} down={down} interest={interest} />
          <div className="flex flex-col gap-[8px] items-start relative shrink-0 w-full">
            <div className="bg-[#0468ff] h-[54px] min-w-[40px] relative rounded-[12px] shrink-0 w-full cursor-pointer">
              <div className="flex flex-row items-center justify-center size-full">
                <div className="flex gap-[8px] items-center justify-center px-[16px] py-[11px]">
                  <p className="font-['Lato:Bold',sans-serif] leading-[22px] not-italic relative shrink-0 text-[16px] text-white tracking-[-0.2px] whitespace-nowrap">Заполнить анкету на Циане</p>
                </div>
              </div>
            </div>
            <button onClick={onShowSchedule} className="bg-white h-[54px] min-w-[40px] relative rounded-[12px] shrink-0 w-full cursor-pointer hover:bg-[#f3f5fa] transition-colors">
              <div className="flex flex-row items-center justify-center size-full">
                <div className="flex gap-[8px] items-center justify-center px-[16px] py-[11px]">
                  <IconBarChart />
                  <p className="font-['Lato:Bold',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#0661ec] text-[16px] tracking-[-0.2px] whitespace-nowrap">График платежей</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ResultProperty({ monthlyPayment, down, rate, termYears, onShowSchedule }: { monthlyPayment: number; down: number; rate: number; termYears: number; onShowSchedule: () => void }) {
  const months = termYears * 12
  const maxLoan = calcMaxLoan(monthlyPayment, rate, months)
  const propertyValue = maxLoan + down
  const total = monthlyPayment * months
  const interest = Math.max(0, total - maxLoan)
  const income = Math.round(monthlyPayment / 0.4)

  return (
    <div className="bg-[#f3f5fa] relative rounded-[20px] shrink-0 w-full">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="flex flex-col gap-[24px] items-start pb-[16px] pt-[20px] px-[16px] relative size-full">
          <div className="flex flex-col gap-[16px] items-start relative shrink-0 w-full">
            <div className="flex flex-col items-start relative shrink-0 w-full">
              <p className="font-['Lato:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#0d162e] text-[14px] tracking-[-0.2px] w-full">Можно взять недвижимость на сумму</p>
              <p className="font-['Lato:Bold',sans-serif] leading-[40px] relative text-[#0d162e] text-[32px] tracking-[-0.5px] w-full">
                {fmt(propertyValue)} ₽
              </p>
            </div>
            <StatPair label1="Всего заплатите" val1={`${fmt(total)} ₽`} label2="Нужный доход" val2={`${fmt(income)} ₽`} />
          </div>
          <RatioBar loan={maxLoan} down={down} interest={interest} />
          <div className="flex flex-col gap-[8px] items-start relative shrink-0 w-full">
            <div className="bg-[#0468ff] h-[54px] min-w-[40px] relative rounded-[12px] shrink-0 w-full cursor-pointer">
              <div className="flex flex-row items-center justify-center size-full">
                <div className="flex gap-[8px] items-center justify-center px-[16px] py-[11px]">
                  <p className="font-['Lato:Bold',sans-serif] leading-[22px] not-italic relative shrink-0 text-[16px] text-white tracking-[-0.2px] whitespace-nowrap">Заполнить анкету на Циане</p>
                </div>
              </div>
            </div>
            <button onClick={onShowSchedule} className="bg-white h-[54px] min-w-[40px] relative rounded-[12px] shrink-0 w-full cursor-pointer hover:bg-[#f3f5fa] transition-colors">
              <div className="flex flex-row items-center justify-center size-full">
                <div className="flex gap-[8px] items-center justify-center px-[16px] py-[11px]">
                  <IconBarChart />
                  <p className="font-['Lato:Bold',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#0661ec] text-[16px] tracking-[-0.2px] whitespace-nowrap">График платежей</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function addMonthsToDate(isoDate: string, n: number): { month: number; year: number } {
  const [y, m] = isoDate.split('-').map(Number)
  const total = (m - 1) + n
  return { month: total % 12, year: y + Math.floor(total / 12) }
}

function ResultEarly({
  loan, rate, termYears, totalOnce, totalMonthly, earlyReduce, startDate, onShowSchedule,
}: {
  loan: number; rate: number; termYears: number; totalOnce: number; totalMonthly: number; earlyReduce: EarlyReduce; startDate: string; onShowSchedule: () => void
}) {
  const months = termYears * 12
  const adjustedPrincipal = Math.max(0, loan - totalOnce)
  const basePmt = calcMonthlyPayment(loan, rate, months)
  const origInterest = Math.max(0, basePmt * months - loan)

  let displayText = ''
  let mainValue = ''
  let sub1Label = ''
  let sub1Value = ''
  let sub1Delta = ''
  let termClosingLine = ''

  if (earlyReduce === 'term') {
    // Client keeps paying the original payment + monthly extra on the reduced principal
    const effectivePmt = basePmt + totalMonthly
    const newMonths = calcNewTerm(adjustedPrincipal, rate, effectivePmt)
    const savedMonths = Math.max(0, months - newMonths)
    const newTotal = effectivePmt * newMonths + totalOnce
    const newInterest = Math.max(0, newTotal - loan)
    const savedInterest = Math.max(0, origInterest - newInterest)
    const closing = addMonthsToDate(startDate, newMonths)

    displayText = `Вы закроете ипотеку на ${fmtSavedTime(savedMonths)} раньше`
    termClosingLine = `В ${MONTHS_PREP[closing.month]} ${closing.year} года`
    mainValue = ''
    sub1Label = 'Проценты станут'
    sub1Value = `${fmt(newInterest)} ₽`
    sub1Delta = `−${fmt(savedInterest)} ₽`
  } else {
    const newPmt = Math.max(0, calcMonthlyPayment(adjustedPrincipal, rate, months) - totalMonthly)
    const savedPerMonth = Math.max(0, basePmt - newPmt)
    const newInterest = Math.max(0, newPmt * months - adjustedPrincipal)

    displayText = `Платёж уменьшится на ${fmt(savedPerMonth)} ₽ и станет`
    mainValue = `${fmt(newPmt)} ₽/мес`
    sub1Label = 'Проценты станут'
    sub1Value = `${fmt(newInterest)} ₽`
    sub1Delta = `−${fmt(Math.max(0, origInterest - newInterest))} ₽`
  }

  return (
    <div className="bg-[#f3f5fa] relative rounded-[20px] shrink-0 w-full">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="flex flex-col gap-[24px] items-start pb-[16px] pt-[20px] px-[16px] relative size-full">
          <div className="flex flex-col items-start relative shrink-0 w-full">
            <p className="font-['Lato:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#0d162e] text-[14px] tracking-[-0.2px] w-full">{displayText}</p>
            {termClosingLine
              ? <p className="font-['Lato:Bold',sans-serif] leading-[40px] relative text-[#0d162e] text-[28px] tracking-[-0.5px] w-full">{termClosingLine}</p>
              : mainValue
                ? <p className="font-['Lato:Bold',sans-serif] leading-[40px] relative text-[#0d162e] text-[28px] tracking-[-0.5px] w-full break-all">{mainValue}</p>
                : null
            }
          </div>
          <div className="flex items-start relative shrink-0 w-full">
            <div className="flex flex-[1_0_0] flex-col gap-[4px] items-start min-w-px relative">
              <p className="font-['Lato:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#0d162e] text-[14px] tracking-[-0.2px]">{sub1Label}</p>
              <div className="flex gap-[3px] items-baseline relative shrink-0">
                <p className="font-['Lato:Bold',sans-serif] leading-[24px] relative shrink-0 text-[#0d162e] text-[18px] tracking-[-0.5px]">{sub1Value}</p>
                <p className="font-['Lato:Regular',sans-serif] leading-[20px] relative shrink-0 text-[14px] text-[#227e01]">{sub1Delta}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-[8px] items-start relative shrink-0 w-full">
            <div className="bg-[#0468ff] h-[54px] min-w-[40px] relative rounded-[12px] shrink-0 w-full cursor-pointer">
              <div className="flex flex-row items-center justify-center size-full">
                <div className="flex gap-[8px] items-center justify-center px-[16px] py-[11px]">
                  <p className="font-['Lato:Bold',sans-serif] leading-[22px] not-italic relative shrink-0 text-[16px] text-white tracking-[-0.2px] whitespace-nowrap">Заполнить анкету на Циане</p>
                </div>
              </div>
            </div>
            <button onClick={onShowSchedule} className="bg-white h-[54px] min-w-[40px] relative rounded-[12px] shrink-0 w-full cursor-pointer hover:bg-[#f3f5fa] transition-colors">
              <div className="flex flex-row items-center justify-center size-full">
                <div className="flex gap-[8px] items-center justify-center px-[16px] py-[11px]">
                  <IconBarChart />
                  <p className="font-['Lato:Bold',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#0661ec] text-[16px] tracking-[-0.2px] whitespace-nowrap">График платежей</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Journal / Reviews section ────────────────────────────────────────────────

function Reviews() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="flex flex-col items-start pb-[20px] px-[16px] relative size-full">
          <div className="bg-[#e6f0ff] relative rounded-[20px] shrink-0 w-full overflow-hidden">
            <div className="flex flex-col gap-[16px] items-start pb-[16px] pt-[20px] px-[16px] relative size-full">
              <div className="absolute left-[100px] rounded-[16px] size-[243px] top-[115px]">
                <div className="absolute h-[273.173px] left-[-3.16px] pointer-events-none top-[8.54px] w-[248.346px]">
                  <img alt="" className="absolute inset-0 max-w-none object-bottom size-full" src={img1} />
                </div>
              </div>
              <div className="flex flex-col gap-[12px] h-[189px] items-start not-italic relative shrink-0 w-full">
                <p className="font-['Lato:Bold',sans-serif] leading-[36px] relative shrink-0 text-[#0d162e] text-[28px] tracking-[-0.5px] w-full">Читайте об ипотеке в&#160;Журнале</p>
                <p className="font-['Lato:Regular',sans-serif] leading-[24px] relative shrink-0 text-[#697797] text-[16px] w-full">Актуальная информация о ставках и программах</p>
              </div>
              <div className="flex flex-col items-start relative shrink-0 w-full">
                <div className="bg-white h-[54px] min-w-[40px] relative rounded-[12px] shrink-0 w-full cursor-pointer">
                  <div className="flex flex-row items-center justify-center size-full">
                    <div className="flex gap-[6px] items-center justify-center px-[14px] py-[10px]">
                      <p className="font-['Lato:Bold',sans-serif] leading-[24px] not-italic overflow-hidden relative shrink-0 text-[#0661ec] text-[16px] text-ellipsis tracking-[-0.2px] whitespace-nowrap">Читать</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Programs section ─────────────────────────────────────────────────────────

function ProgramRow({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="bg-[#f3f5fa] relative rounded-[16px] shrink-0 w-full cursor-pointer">
      <div className="flex flex-row items-center size-full">
        <div className="flex gap-[16px] items-center pl-[16px] relative size-full">
          <div className="flex flex-row items-center self-stretch shrink-0">
            <div className="flex flex-col items-start py-[16px]">
              <div className="bg-[#e6f0ff] overflow-clip relative rounded-[12px] shrink-0 size-[56px] flex items-center justify-center">
                {icon}
              </div>
            </div>
          </div>
          <div className="flex flex-[1_0_0] flex-row items-center self-stretch">
            <div className="flex-[1_0_0] h-full min-h-[52px] min-w-px relative">
              <div className="flex flex-row items-center min-h-[inherit] size-full">
                <div className="flex gap-[16px] items-center min-h-[inherit] pr-[16px] relative size-full">
                  <div className="flex flex-[1_0_0] flex-col gap-[4px] items-start justify-center min-w-px py-[16px] relative">
                    <p className="font-['Lato:Bold',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#0d162e] text-[18px] tracking-[-0.5px] w-full">{title}</p>
                  </div>
                  <div className="h-full relative shrink-0">
                    <div className="flex flex-row items-center justify-end size-full">
                      <div className="flex gap-[8px] items-center justify-end py-[16px]">
                        <IconChevronRight />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Programs() {
  return (
    <div className="bg-white relative shrink-0 w-full">
      <div className="flex flex-col items-center overflow-clip rounded-[inherit] size-full">
        <div className="flex flex-col gap-[16px] items-center pb-[32px] px-[16px] relative size-full">
          {/* Item 1: Подобрать предложения по ипотеке */}
          <ProgramRow
            title="Подобрать предложения по ипотеке"
            icon={
              <div className="absolute bottom-0 right-[-1px] size-[57px]">
                <div className="absolute left-[-0.64px] top-[7.43px]">
                  <div className="absolute left-[-0.61px] mask-alpha mask-intersect mask-no-clip mask-no-repeat pointer-events-none size-[60.34px] top-[7.06px]" style={{ maskImage: `url("${img124}")`, maskSize: '63.516px 63.516px' }}>
                    <img alt="" className="absolute inset-0 max-w-none object-cover size-full" src={img125} />
                  </div>
                </div>
              </div>
            }
          />
          {/* Item 2: Господдержка для семей */}
          <ProgramRow
            title="Господдержка для семей"
            icon={
              <div className="absolute inset-0 overflow-hidden">
<div className="absolute h-[104px] w-[140px] mask-alpha mask-intersect mask-no-clip mask-no-repeat" style={{ maskImage: `url("${imgDoma212}")`, maskSize: '140px 104px', left: 'calc(50% - 79px)', top: 'calc(50% - 36px)' }}>
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <img alt="" className="absolute h-[117.87%] left-[14.39%] max-w-none top-[-25.36%] w-[87.4%]" src={imgDoma213} />
                  </div>
                </div>
                <div className="absolute h-[104px] w-[140px] mask-alpha mask-intersect mask-no-clip mask-no-repeat" style={{ maskImage: `url("${imgDoma212}")`, maskSize: '140px 104px', left: 'calc(50% - 79px)', top: 'calc(50% - 36px)' }}>
                  <img alt="" className="absolute inset-0 max-w-none object-bottom pointer-events-none size-full" src={imgDoma214} />
                </div>
              </div>
            }
          />
          {/* Item 3: Ипотека на дома и строительство */}
          <ProgramRow
            title="Ипотека на дома и строительство"
            icon={
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute h-[65px] w-[103px] mask-alpha mask-intersect mask-no-clip mask-no-repeat" style={{ maskImage: `url("${imgNewHous5}")`, maskSize: '103px 65px', left: '-8px', top: '7px' }}>
                  <img alt="" className="absolute inset-0 max-w-none object-bottom pointer-events-none size-full" src={imgNewHous6} />
                </div>
                <div className="absolute h-[65px] w-[103px] mask-alpha mask-intersect mask-no-clip mask-no-repeat" style={{ maskImage: `url("${imgNewHous5}")`, maskSize: '103px 65px', left: '-8px', top: '7px' }}>
                  <img alt="" className="absolute inset-0 max-w-none object-bottom pointer-events-none size-full" src={imgNewHous7} />
                </div>
                <div className="absolute h-[65px] w-[103px] mask-alpha mask-intersect mask-no-clip mask-no-repeat" style={{ maskImage: `url("${imgNewHous5}")`, maskSize: '103px 65px', left: '-8px', top: '7px' }}>
                  <div className="absolute inset-0 overflow-hidden">
                    <img alt="" className="absolute h-[223%] left-[-21%] max-w-none top-[-62%] w-[142%]" src={imgNewHous8} />
                  </div>
                  <div className="absolute bg-[rgba(255,255,255,0.54)] inset-0 mix-blend-soft-light" />
                  <div className="absolute bg-[rgba(4,111,255,0.8)] inset-0 mix-blend-color" />
                </div>
                <div className="absolute h-[65px] w-[103px] mask-alpha mask-intersect mask-no-clip mask-no-repeat" style={{ maskImage: `url("${imgNewHous5}")`, maskSize: '103px 65px', left: '-8px', top: '7px' }}>
                  <div className="absolute inset-0 overflow-hidden">
                    <img alt="" className="absolute h-[223%] left-[-21%] max-w-none top-[-62%] w-[142%]" src={imgNewHous9} />
                  </div>
                  <div className="absolute bg-[rgba(255,255,255,0.54)] inset-0 mix-blend-soft-light" />
                  <div className="absolute bg-[rgba(4,111,255,0.8)] inset-0 mix-blend-color" />
                </div>
              </div>
            }
          />
          {/* Item 4: Скидки на ипотеку от застройщиков */}
          <ProgramRow
            title="Скидки на ипотеку от застройщиков"
            icon={
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute w-[51px] h-[54px] mask-alpha mask-intersect mask-no-clip mask-no-repeat shadow-[0px_3.7px_3.7px_0px_rgba(0,0,0,0.25)]" style={{ maskImage: `url("${imgPct2}")`, maskSize: '55px 58px', left: 'calc(50% - 28px)', bottom: '-4px' }}>
                  <img alt="" className="absolute inset-0 max-w-none object-bottom size-full" src={imgPct3} />
                </div>
              </div>
            }
          />
        </div>
      </div>
    </div>
  )
}

// ─── FAQ section ──────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    q: 'Что представляет собой ипотека?',
    a: 'Ипотека – это разновидность кредита, предоставляемого заемщику под залог его недвижимости. Право собственности на купленную с использованием ипотеки квартиру остается у заёмщика, в то время как сама недвижимость находится в залоге у банка-кредитора до полного погашения долга.',
  },
  {
    q: 'Как можно снизить процентную ставку по ипотеке?',
    a: 'Существует несколько способов, которые могут помочь в снижении ипотечной ставки. Изучить предложения банков: некоторые из них предлагают сниженную ставку своим зарплатным клиентам, предоставляют скидки за онлайн-оформление или определенные виды страховки. Некоторые девелоперы также предлагают ипотеку по сниженным ставкам для квартир в новостройках, а на Циан можно найти объекты на вторичном рынке с понижением ставки на 4 процентных пункта.',
  },
  {
    q: 'Стоит ли погашать ипотеку досрочно?',
    a: 'Ответ на этот вопрос зависит от нескольких параметров: ставки по ипотеке, срока, финансовых возможностей заемщика. Если прошло менее половины срока кредита, досрочное погашение будет целесообразным: в первые годы значительная часть платежа приходится на проценты, а досрочный платеж отправится на погашение тела кредита.',
  },
  {
    q: 'Какие типы платежей по ипотеке бывают?',
    a: 'Любой кредитный платеж состоит из двух компонентов: основной суммы долга и процента за пользование заёмными средствами. Аннуитетный платеж устанавливается на весь срок кредита — заемщик выплачивает фиксированную сумму каждый месяц. Дифференцированный платеж формируется иначе: сумма основного долга делится на равные части, а проценты начисляются на остаток кредитных средств.',
  },
  {
    q: 'Что будет, если пропустить ежемесячный платеж?',
    a: 'Все зависит от условий кредитного договора. В нём может быть оговорена допустимая задержка платежей по кредиту на срок от одного до пяти дней. В других случаях кредитор имеет право наложить на заёмщика штрафные санкции.',
  },
]

function FAQSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-col items-center size-full">
        <div className="flex flex-col items-center px-[16px] relative size-full w-full">
          <div className="flex flex-col gap-[12px] items-start pb-[32px] pt-[24px] relative shrink-0 w-full">
            <p className="font-['Lato:Bold',sans-serif] leading-[36px] not-italic relative shrink-0 text-[#0d162e] text-[28px] tracking-[-0.5px] w-full">Об ипотеке</p>
            <div className="flex flex-col items-start relative shrink-0 w-full">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openIdx === idx
                const isLast = idx === FAQ_ITEMS.length - 1
                return (
                  <div key={idx} className="relative shrink-0 w-full" style={{ borderBottom: isLast ? 'none' : '0.5px solid #D0D8E9' }}>
                    <button
                      onClick={() => setOpenIdx(isOpen ? null : idx)}
                      className="flex gap-[12px] items-start pt-[24px] pb-[24px] relative shrink-0 w-full cursor-pointer text-left"
                    >
                      <p className="font-['Lato:Bold',sans-serif] leading-[28px] flex-[1_0_0] min-w-px not-italic relative text-[#0d162e] text-[22px] tracking-[-0.5px]">{item.q}</p>
                      <div className="flex items-start pt-[8px] shrink-0">
                        <IconChevronFaq open={isOpen} />
                      </div>
                    </button>
                    {isOpen && (
                      <div className="pb-[24px] relative shrink-0 w-full">
                        <p className="font-['Lato:Regular',sans-serif] leading-[24px] not-italic relative text-[#4f5c79] text-[16px] w-full">{item.a}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Footer section ───────────────────────────────────────────────────────────

function FooterSection() {
  return (
    <div className="flex flex-col items-start relative shrink-0 w-full">
      {/* SEO links */}
      <div className="bg-white max-w-[640px] relative shrink-0 w-full">
        <div className="flex flex-col gap-[24px] items-start p-[16px] relative size-full">
          {/* Cities and regions */}
          <div className="flex flex-col gap-[8px] items-start relative rounded-[12px] shrink-0 w-full">
            <div className="flex items-center justify-center pb-[2px] relative shrink-0 w-full">
              <p className="flex-[1_0_0] font-['Lato:Bold',sans-serif] leading-[24px] min-w-px not-italic relative text-[#152242] text-[16px] tracking-[-0.2px]">Города и регионы</p>
            </div>
            <div className="flex gap-[8px] items-start relative shrink-0 w-full">
              <div className="flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px relative">
                {['Москва', 'Московская область', 'Санкт-Петербург'].map(c => (
                  <p key={c} className="font-['Lato:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#152242] text-[14px] w-full">{c}</p>
                ))}
              </div>
              <div className="flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px relative">
                {['Ленинградская область', 'Алтайский край', 'Архангельская область'].map(c => (
                  <p key={c} className="font-['Lato:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#152242] text-[14px] w-full">{c}</p>
                ))}
              </div>
            </div>
          </div>
          {/* Down payment + Term */}
          <div className="flex gap-[16px] items-start relative shrink-0 w-full">
            <div className="flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px relative">
              <p className="flex-[1_0_0] font-['Lato:Bold',sans-serif] leading-[24px] min-w-px not-italic relative text-[#152242] text-[16px] tracking-[-0.2px]">Первый взнос</p>
              {['20%', '30%', '40%', '50%'].map(v => (
                <p key={v} className="font-['Lato:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#152242] text-[14px] w-full">{v}</p>
              ))}
            </div>
            <div className="flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px relative">
              <p className="flex-[1_0_0] font-['Lato:Bold',sans-serif] leading-[24px] min-w-px not-italic relative text-[#152242] text-[16px] tracking-[-0.2px]">Срок кредита</p>
              {['15 лет', '20 лет', '30 лет'].map(v => (
                <p key={v} className="font-['Lato:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#152242] text-[14px] w-full">{v}</p>
              ))}
            </div>
          </div>
          {/* Employment + Income */}
          <div className="flex gap-[16px] items-start relative shrink-0 w-full">
            <div className="flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px relative">
              <p className="flex-[1_0_0] font-['Lato:Bold',sans-serif] leading-[24px] min-w-px not-italic relative text-[#152242] text-[16px] tracking-[-0.2px]">Тип занятости</p>
              {['Наёмный работник', 'Самозанятый', 'ИП', 'Собственник бизнеса'].map(v => (
                <p key={v} className="font-['Lato:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#152242] text-[14px] w-full">{v}</p>
              ))}
            </div>
            <div className="flex flex-[1_0_0] flex-col gap-[8px] items-start min-w-px relative">
              <p className="flex-[1_0_0] font-['Lato:Bold',sans-serif] leading-[24px] min-w-px not-italic relative text-[#152242] text-[16px] tracking-[-0.2px]">Доход</p>
              {['С подтверждением', 'Без подтверждения'].map(v => (
                <p key={v} className="font-['Lato:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#152242] text-[14px] w-full">{v}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Brand footer */}
      <div className="bg-white max-w-[1024px] min-w-[320px] relative shrink-0 w-full">
        <div className="flex flex-col items-center max-w-[inherit] min-w-[inherit] size-full">
          <div className="flex flex-col items-center max-w-[inherit] min-w-[inherit] pb-[32px] pt-[40px] px-[16px] relative size-full">
            <div className="flex flex-col gap-[8px] items-center relative shrink-0 w-full">
              <LogoCianNew />
              <p className="font-['Lato:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#697797] text-[14px] underline whitespace-nowrap cursor-pointer">Полная версия сайта</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Calculator ──────────────────────────────────────────────────────────

function CalculatorSection({ calcRef }: { calcRef: React.RefObject<HTMLDivElement | null> }) {
  const [mode, setMode] = useState<CalcMode>('monthly')

  // Mode 1: monthly payment
  const [m1Property, setM1Property] = useState('12000000')
  const [m1Down, setM1Down] = useState('6000000')
  const [m1Term, setM1Term] = useState('20')
  const [m1Rate, setM1Rate] = useState('17')

  // Mode 2: property value
  const [m2Payment, setM2Payment] = useState('60000')
  const [m2Down, setM2Down] = useState('6000000')
  const [m2Term, setM2Term] = useState('20')
  const [m2Rate, setM2Rate] = useState('17')

  // Mode 3: early repayment
  const [m3Loan, setM3Loan] = useState('12000000')
  const [m3Date, setM3Date] = useState('2026-03-02')
  const [m3Term, setM3Term] = useState('30')
  const [m3Rate, setM3Rate] = useState('12.5')
  const [earlyEntries, setEarlyEntries] = useState<EarlyEntry[]>([
    { type: 'once', reduce: 'payment', date: '2026-03-02', amount: '30000' }
  ])
  const [showSchedule, setShowSchedule] = useState(false)

  const p1 = parseFloat(m1Property) || 0
  const d1 = parseFloat(m1Down) || 0
  const t1 = parseFloat(m1Term) || 0
  const r1 = parseFloat(m1Rate) || 0

  const p2 = parseFloat(m2Payment) || 0
  const d2 = parseFloat(m2Down) || 0
  const t2 = parseFloat(m2Term) || 0
  const r2 = parseFloat(m2Rate) || 0

  const l3 = parseFloat(m3Loan) || 0
  const t3 = parseFloat(m3Term) || 0
  const r3 = parseFloat(m3Rate) || 0

  const totalOnce3 = earlyEntries.filter(e => e.type === 'once').reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
  const totalMonthly3 = earlyEntries.filter(e => e.type === 'monthly').reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
  const earlyReduce3: EarlyReduce = earlyEntries[0]?.reduce ?? 'payment'

  function updateEntry(idx: number, updated: EarlyEntry) {
    setEarlyEntries(prev => prev.map((e, i) => i === idx ? updated : e))
  }

  function removeEntry(idx: number) {
    setEarlyEntries(prev => prev.filter((_, i) => i !== idx))
  }

  function addEntry() {
    setEarlyEntries(prev => [...prev, {
      type: 'once',
      reduce: prev[0]?.reduce ?? 'payment',
      date: m3Date,
      amount: '30000',
    }])
  }

  return (
    <div ref={calcRef} className="bg-white flex flex-col gap-[16px] items-start px-[16px] py-[24px] relative shrink-0 w-full">
      {/* What to calculate */}
      <div className="flex flex-col gap-[16px] items-start relative shrink-0 w-full">
        <p className="font-['Lato:Bold',sans-serif] leading-[36px] not-italic relative shrink-0 text-[#0d162e] text-[28px] tracking-[-0.5px] w-full">Что будем считать?</p>
        <div className="flex flex-col gap-[8px] items-start relative shrink-0 w-full">
          <ModeRow
            icon={<IconSpecialLoan />}
            title="Платёж в месяц"
            sub="Сколько будете платить по ипотеке"
            selected={mode === 'monthly'}
            onClick={() => setMode('monthly')}
            showDivider={true}
          />
          <ModeRow
            icon={<IconHouse />}
            title="Стоимость недвижимости"
            sub="Рассчитать по вашему бюджету"
            selected={mode === 'property'}
            onClick={() => setMode('property')}
            showDivider={true}
          />
          <ModeRow
            icon={<IconPieChart />}
            title="Досрочное погашение"
            sub="Как уменьшится платёж или срок"
            selected={mode === 'early'}
            onClick={() => setMode('early')}
            showDivider={false}
          />
        </div>
      </div>

      {/* Form */}
      <div className="bg-white flex flex-col gap-[16px] items-start py-[8px] relative rounded-[24px] shrink-0 w-full">
        <div className="flex flex-col items-start relative shrink-0 w-full">
          <p className="font-['Lato:Bold',sans-serif] leading-[36px] not-italic relative shrink-0 text-[#0d162e] text-[28px] tracking-[-0.5px] w-full">Введите данные</p>
        </div>

        <div className="flex flex-col gap-[16px] items-start pt-[8px] relative shrink-0 w-full">
          {mode === 'monthly' && (
            <>
              <InputNum label="Стоимость недвижимости" value={m1Property} onChange={setM1Property} suffix="₽" money />
              <div className="relative shrink-0 w-full">
                <InputNum label="Первоначальный взнос" value={m1Down} onChange={setM1Down} suffix="₽" money />
                <DownPaymentPctChips propertyValue={p1} setDownPayment={setM1Down} />
              </div>
              <TermField term={m1Term} setTerm={setM1Term} />
              <InputNum label="Ставка" value={m1Rate} onChange={setM1Rate} suffix="%" />
            </>
          )}
          {mode === 'property' && (
            <>
              <InputNum label="Платёж в месяц" value={m2Payment} onChange={setM2Payment} suffix="₽/мес" money />
              <InputNum label="Первоначальный взнос" value={m2Down} onChange={setM2Down} suffix="₽" money />
              <TermField term={m2Term} setTerm={setM2Term} />
              <InputNum label="Ставка" value={m2Rate} onChange={setM2Rate} suffix="%" />
            </>
          )}
          {mode === 'early' && (
            <>
              <InputNum label="Сумма кредита" value={m3Loan} onChange={setM3Loan} suffix="₽" money />
              <DateInput label="Дата получения" value={m3Date} onChange={setM3Date} />
              <TermField term={m3Term} setTerm={setM3Term} />
              <InputNum label="Ставка" value={m3Rate} onChange={setM3Rate} suffix="%" />
              {earlyEntries.map((entry, idx) => (
                <EarlyBlock
                  key={idx}
                  index={idx}
                  entry={entry}
                  onChange={updated => updateEntry(idx, updated)}
                  showRemove={earlyEntries.length > 1}
                  onRemove={() => removeEntry(idx)}
                />
              ))}
              <button
                onClick={addEntry}
                className="bg-[#e6f0ff] h-[54px] min-w-[40px] relative rounded-[12px] shrink-0 w-full cursor-pointer hover:bg-[#cce0ff] transition-colors"
              >
                <div className="flex flex-row items-center justify-center size-full">
                  <div className="flex gap-[8px] items-center justify-center px-[16px] py-[11px]">
                    <IconPlus />
                    <p className="font-['Lato:Bold',sans-serif] leading-[22px] not-italic relative shrink-0 text-[#0661ec] text-[16px] tracking-[-0.2px] whitespace-nowrap">Добавить досрочное погашение</p>
                  </div>
                </div>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Results */}
      {mode === 'monthly' && (
        <ResultMonthly property={p1} down={d1} rate={r1} termYears={t1} onShowSchedule={() => setShowSchedule(true)} />
      )}
      {mode === 'property' && (
        <ResultProperty monthlyPayment={p2} down={d2} rate={r2} termYears={t2} onShowSchedule={() => setShowSchedule(true)} />
      )}
      {mode === 'early' && (
        <ResultEarly loan={l3} rate={r3} termYears={t3} totalOnce={totalOnce3} totalMonthly={totalMonthly3} earlyReduce={earlyReduce3} startDate={m3Date} onShowSchedule={() => setShowSchedule(true)} />
      )}

      {/* Payment schedule modal */}
      {showSchedule && (() => {
        const loan = mode === 'monthly' ? Math.max(0, p1 - d1)
          : mode === 'early' ? l3
          : calcMaxLoan(p2, r2, t2 * 12)

        const rate = mode === 'monthly' ? r1 : mode === 'early' ? r3 : r2
        const months = mode === 'monthly' ? t1 * 12 : mode === 'early' ? t3 * 12 : t2 * 12
        const startDate = mode === 'early' ? m3Date : new Date().toISOString().split('T')[0]
        return (
          <PaymentScheduleModal
            principal={loan}
            annualRate={rate}
            totalMonths={months}
            startDate={startDate}
            earlyMonthly={mode === 'early' ? totalMonthly3 : 0}
            onClose={() => setShowSchedule(false)}
          />
        )
      })()}
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const calcRef = { current: null as HTMLDivElement | null }

  function scrollToCalc() {
    calcRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="bg-white flex flex-col items-start relative min-h-screen w-full max-w-[640px] mx-auto">
      <AppHeader />
      <AppCover onCalculate={scrollToCalc} />
      <CalculatorSection calcRef={calcRef} />
      <Reviews />
      <Programs />
      <FAQSection />
      <FooterSection />
    </div>
  )
}
