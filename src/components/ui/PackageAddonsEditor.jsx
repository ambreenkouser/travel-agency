import { useState, useEffect } from 'react'
import { getHotels } from '../../api/hotels'

// ── Default addon structures ─────────────────────────────────────────────────

const MEAL_TIMES    = ['Breakfast', 'Lunch', 'Dinner', 'All']
const FOOD_STYLES   = ['Desi', 'Fast Food', 'Buffet']
const BREAKFAST_OPT = ['Paratha with Tea', 'Egg', 'Bread']
const TRANSPORT_TYPES = ['Bus', 'Private']
const SEAT_CLASSES  = ['Economy', 'Business']
const ZIYARAT_NAMES = ['Ziyarat Makkah', 'Ziyarat Madina', 'Other']

function emptyMealItem()      { return { mealTime: 'Breakfast', foodStyle: 'Desi', option: '', price: 0 } }
function emptyHotelItem()     { return { hotelId: '', hotelName: '', nights: 1, price: 0 } }
function emptyTransportItem() { return { type: 'Bus', seatClass: 'Economy', price: 0 } }
function emptyZiyaratItem()   { return { name: 'Ziyarat Makkah', customName: '', price: 0 } }

export function defaultAddons() {
  return {
    meal:      { enabled: false, price: 0, items: [] },
    hotel:     { enabled: false, price: 0, items: [] },
    transport: { enabled: false, price: 0, items: [] },
    ziyarat:   { enabled: false, price: 0, items: [] },
    medical:   { enabled: false, price: 0, items: [] },
  }
}

/** Merge server data into the default structure (backward compat). */
export function addonsFromServer(raw) {
  const base = defaultAddons()
  if (!raw) return base
  const keys = ['meal', 'hotel', 'transport', 'ziyarat', 'medical']
  keys.forEach(k => {
    if (raw[k]) {
      base[k] = {
        enabled: raw[k].enabled ?? false,
        price:   raw[k].price   ?? 0,
        items:   raw[k].items   ?? [],
      }
    }
  })
  return base
}

/** Sum item prices into the top-level price (for PackageBookingPage compat). */
function syncPrice(section) {
  const total = (section.items || []).reduce((s, i) => s + Number(i.price || 0), 0)
  return { ...section, price: total }
}

// ── Section wrappers ─────────────────────────────────────────────────────────

function SectionCard({ label, icon, section, onToggle, children }) {
  return (
    <div className={`rounded-lg border transition-colors ${section.enabled ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-center justify-between px-4 py-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={section.enabled}
            onChange={onToggle}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-base">{icon}</span>
          <span className="text-sm font-semibold text-gray-700">{label}</span>
        </label>
        {section.enabled && (
          <span className="text-xs text-gray-500 font-medium">
            Total: PKR {Number(section.price || 0).toLocaleString()}
          </span>
        )}
      </div>
      {section.enabled && (
        <div className="px-4 pb-4 border-t border-blue-100 pt-3 space-y-2">
          {children}
        </div>
      )}
    </div>
  )
}

function ItemRow({ children, onRemove }) {
  return (
    <div className="flex items-start gap-2 bg-white rounded border border-gray-200 p-2">
      <div className="flex-1 grid grid-cols-2 gap-2">{children}</div>
      <button
        type="button"
        onClick={onRemove}
        className="mt-1 text-red-400 hover:text-red-600 text-lg leading-none"
        title="Remove"
      >×</button>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-gray-600">
      {label}
      {children}
    </label>
  )
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
    >
      {options.map(o => (
        <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
      ))}
    </select>
  )
}

function PriceInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-gray-400">PKR</span>
      <input
        type="number"
        min="0"
        step="1"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  )
}

function AddBtn({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-1 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
    >
      <span className="text-base leading-none">+</span> {label}
    </button>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

export default function PackageAddonsEditor({ addons, onChange }) {
  const [hotels, setHotels] = useState([])

  useEffect(() => {
    getHotels().then(setHotels).catch(() => {})
  }, [])

  function update(key, newSection) {
    onChange({ ...addons, [key]: syncPrice(newSection) })
  }

  function toggle(key) {
    const s = addons[key]
    update(key, { ...s, enabled: !s.enabled })
  }

  function addItem(key, emptyFn) {
    const s = addons[key]
    update(key, { ...s, items: [...(s.items || []), emptyFn()] })
  }

  function removeItem(key, idx) {
    const s = addons[key]
    const items = s.items.filter((_, i) => i !== idx)
    update(key, { ...s, items })
  }

  function patchItem(key, idx, patch) {
    const s = addons[key]
    const items = s.items.map((item, i) => i === idx ? { ...item, ...patch } : item)
    update(key, { ...s, items })
  }

  // ── Meal ──────────────────────────────────────────────────────────────────

  const meal = addons.meal || defaultAddons().meal

  // ── Hotel ─────────────────────────────────────────────────────────────────

  const hotel = addons.hotel || defaultAddons().hotel
  const hotelOpts = hotels.map(h => ({ value: String(h.id), label: h.name }))

  // ── Transport ─────────────────────────────────────────────────────────────

  const transport = addons.transport || defaultAddons().transport

  // ── Ziyarat ───────────────────────────────────────────────────────────────

  const ziyarat = addons.ziyarat || defaultAddons().ziyarat

  // ── Medical ───────────────────────────────────────────────────────────────

  const medical = addons.medical || defaultAddons().medical

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-gray-700">Extras &amp; Add-ons</p>

      {/* ── MEAL ── */}
      <SectionCard label="Meal" icon="🍽️" section={meal} onToggle={() => toggle('meal')}>
        {(meal.items || []).map((item, idx) => (
          <ItemRow key={idx} onRemove={() => removeItem('meal', idx)}>
            <Field label="Meal Time">
              <Select value={item.mealTime} onChange={v => patchItem('meal', idx, { mealTime: v })} options={MEAL_TIMES} />
            </Field>
            <Field label="Food Style">
              <Select value={item.foodStyle} onChange={v => patchItem('meal', idx, { foodStyle: v, option: '' })} options={FOOD_STYLES} />
            </Field>
            {item.mealTime === 'Breakfast' && item.foodStyle === 'Desi' && (
              <Field label="Option">
                <Select value={item.option} onChange={v => patchItem('meal', idx, { option: v })}
                  options={[{ value: '', label: '-- select --' }, ...BREAKFAST_OPT]} />
              </Field>
            )}
            <Field label="Price / person">
              <PriceInput value={item.price} onChange={v => patchItem('meal', idx, { price: Number(v) || 0 })} />
            </Field>
          </ItemRow>
        ))}
        <AddBtn label="Add Meal" onClick={() => addItem('meal', emptyMealItem)} />
      </SectionCard>

      {/* ── HOTEL ── */}
      <SectionCard label="Hotel" icon="🏨" section={hotel} onToggle={() => toggle('hotel')}>
        {(hotel.items || []).map((item, idx) => (
          <ItemRow key={idx} onRemove={() => removeItem('hotel', idx)}>
            <Field label="Hotel">
              {hotelOpts.length > 0 ? (
                <Select
                  value={item.hotelId}
                  onChange={v => {
                    const h = hotels.find(h => String(h.id) === v)
                    patchItem('hotel', idx, { hotelId: v, hotelName: h?.name || v })
                  }}
                  options={[{ value: '', label: '-- select hotel --' }, ...hotelOpts]}
                />
              ) : (
                <input
                  type="text"
                  value={item.hotelName}
                  onChange={e => patchItem('hotel', idx, { hotelName: e.target.value })}
                  placeholder="Hotel name"
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              )}
            </Field>
            <Field label="Nights">
              <input
                type="number"
                min="1"
                value={item.nights}
                onChange={e => patchItem('hotel', idx, { nights: Number(e.target.value) || 1 })}
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </Field>
            <Field label="Price / person">
              <PriceInput value={item.price} onChange={v => patchItem('hotel', idx, { price: Number(v) || 0 })} />
            </Field>
          </ItemRow>
        ))}
        <AddBtn label="Add Hotel" onClick={() => addItem('hotel', emptyHotelItem)} />
      </SectionCard>

      {/* ── TRANSPORT ── */}
      <SectionCard label="Transport" icon="🚌" section={transport} onToggle={() => toggle('transport')}>
        {(transport.items || []).map((item, idx) => (
          <ItemRow key={idx} onRemove={() => removeItem('transport', idx)}>
            <Field label="Type">
              <Select value={item.type} onChange={v => patchItem('transport', idx, { type: v })} options={TRANSPORT_TYPES} />
            </Field>
            {item.type === 'Private' && (
              <Field label="Class">
                <Select value={item.seatClass} onChange={v => patchItem('transport', idx, { seatClass: v })} options={SEAT_CLASSES} />
              </Field>
            )}
            <Field label="Price / person">
              <PriceInput value={item.price} onChange={v => patchItem('transport', idx, { price: Number(v) || 0 })} />
            </Field>
          </ItemRow>
        ))}
        <AddBtn label="Add Transport" onClick={() => addItem('transport', emptyTransportItem)} />
      </SectionCard>

      {/* ── ZIYARAT ── */}
      <SectionCard label="Ziyarat" icon="🕌" section={ziyarat} onToggle={() => toggle('ziyarat')}>
        {(ziyarat.items || []).map((item, idx) => (
          <ItemRow key={idx} onRemove={() => removeItem('ziyarat', idx)}>
            <Field label="Ziyarat">
              <Select value={item.name} onChange={v => patchItem('ziyarat', idx, { name: v, customName: '' })} options={ZIYARAT_NAMES} />
            </Field>
            {item.name === 'Other' && (
              <Field label="Custom Name">
                <input
                  type="text"
                  value={item.customName}
                  onChange={e => patchItem('ziyarat', idx, { customName: e.target.value })}
                  placeholder="Enter name..."
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </Field>
            )}
            <Field label="Price / person">
              <PriceInput value={item.price} onChange={v => patchItem('ziyarat', idx, { price: Number(v) || 0 })} />
            </Field>
          </ItemRow>
        ))}
        <AddBtn label="Add Ziyarat" onClick={() => addItem('ziyarat', emptyZiyaratItem)} />
      </SectionCard>

      {/* ── MEDICAL ── */}
      <SectionCard label="Medical" icon="🏥" section={medical} onToggle={() => toggle('medical')}>
        <div className="flex items-center gap-3">
          <label className="text-xs text-gray-600">Price / person</label>
          <PriceInput
            value={medical.price}
            onChange={v => onChange({ ...addons, medical: { ...medical, price: Number(v) || 0 } })}
          />
        </div>
      </SectionCard>
    </div>
  )
}
