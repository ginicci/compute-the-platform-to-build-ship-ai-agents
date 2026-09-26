import Link from 'next/link'

export function TermsCheckbox({
  checked,
  onChange,
  id = 'accept-terms',
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  id?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        name="acceptTerms"
        type="checkbox"
        required
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-5 shrink-0 accent-primary"
      />
      <label htmlFor={id} className="text-sm leading-relaxed text-muted-foreground">
        I agree to the{' '}
        <Link href="/terms" target="_blank" className="text-foreground underline underline-offset-4">
          Terms of Service
        </Link>
        ,{' '}
        <Link href="/refund-policy" target="_blank" className="text-foreground underline underline-offset-4">
          Refund Policy
        </Link>{' '}
        and{' '}
        <Link href="/privacy" target="_blank" className="text-foreground underline underline-offset-4">
          Privacy Policy
        </Link>
        .
      </label>
    </div>
  )
}
