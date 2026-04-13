// Shared extras editor: Meal, Medical, Hotel, Ziyarat
// extras shape: { meal: { enabled, price }, medical: { enabled, price }, ... }

export const EXTRAS_CONFIG = [
  { key: 'meal',    label: 'Meal',    icon: '🍽️' },
  { key: 'medical', label: 'Medical', icon: '🏥' },
  { key: 'hotel',   label: 'Hotel',   icon: '🏨' },
  { key: 'ziyarat', label: 'Ziyarat', icon: '🕌' },
]

// Infants are not charged for these extras (no separate seat/meal/bed needed)
export const INFANT_EXEMPT_EXTRAS = ['meal', 'hotel', 'ziyarat']

/** Returns the billable pax count for a given extra key */
export function extraPaxCount(key, adults, children, infants) {
  return INFANT_EXEMPT_EXTRAS.includes(key)
    ? adults + children
    : adults + children + infants
}

export function defaultExtras() {
  const obj = {}
  EXTRAS_CONFIG.forEach(e => { obj[e.key] = { enabled: false, price: 0 } })
  return obj
}

export function extrasFromServer(raw) {
  const base = defaultExtras()
  if (!raw) return base
  EXTRAS_CONFIG.forEach(e => {
    if (raw[e.key]) {
      base[e.key] = {
        enabled: raw[e.key].enabled ?? false,
        price:   raw[e.key].price   ?? 0,
      }
    }
  })
  return base
}

export default function ExtrasEditor({ extras, onChange }) {
  function toggle(key) {
    onChange({ ...extras, [key]: { ...extras[key], enabled: !extras[key].enabled } })
  }
  function setPrice(key, val) {
    onChange({ ...extras, [key]: { ...extras[key], price: val === '' ? 0 : Number(val) } })
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700 mb-2">Extras &amp; Add-ons</p>
      {EXTRAS_CONFIG.map(({ key, label, icon }) => {
        const item = extras[key] ?? { enabled: false, price: 0 }
        return (
          <div key={key}
            className={`flex items-center justify-between rounded-lg border px-3 py-2 transition-colors ${
              item.enabled ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
            }`}
          >
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={item.enabled}
                onChange={() => toggle(key)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-base">{icon}</span>
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </label>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">PKR</span>
              <input
                type="number"
                min="0"
                step="1"
                value={item.price}
                onChange={e => setPrice(key, e.target.value)}
                placeholder="0"
                className="w-24 border border-gray-300 rounded-md px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <span className="text-xs text-gray-400">/ person</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
