import { useToast } from "@/hooks/use-toast"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex w-full items-start justify-between gap-4 overflow-hidden rounded-xl border p-4 shadow-lg transition-all duration-300 ${
            t.variant === "destructive"
              ? "bg-red-600 border-red-500 text-white"
              : "bg-white border-gray-200 text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
          }`}
        >
          <div className="grid gap-1">
            {t.title && <div className="font-semibold text-sm">{t.title}</div>}
            {t.description && <div className="text-xs opacity-90">{t.description}</div>}
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="rounded-lg p-1 opacity-70 hover:opacity-100 transition-opacity focus:outline-none cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
