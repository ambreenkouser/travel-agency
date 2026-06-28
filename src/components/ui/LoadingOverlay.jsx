import Spinner from './Spinner'

export default function LoadingOverlay({ visible }) {
  if (!visible) return null
  return (
    <div className="fixed inset-0 bg-black/30 z-[9999] flex items-center justify-center">
      <div className="bg-white rounded-xl p-5 shadow-xl flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <span className="text-sm text-gray-600 font-medium">Please wait…</span>
      </div>
    </div>
  )
}
