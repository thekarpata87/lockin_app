/** The app's own completion check: thick and angular (DESIGN §5). Inherits currentColor. */
export function CheckMark({ size = 20 }: { size?: number }) {
  return (
    <svg className="check-draw" width={size} height={size} viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M3 10.5 L8 15.5 L17.5 4.5" fill="none" stroke="currentColor" strokeWidth="3.25" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  )
}
