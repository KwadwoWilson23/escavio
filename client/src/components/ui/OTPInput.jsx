import { useState, useRef, useEffect } from 'react'
import { Loader2, Shield } from 'lucide-react'
import GlassCard from './GlassCard'
import NetworkLogo, { detectNetwork } from './NetworkLogo'

export default function OTPInput({ phone, amount, onSubmit, onCancel, loading, error }) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const inputRefs = useRef([])
  const network = detectNetwork(phone || '')

  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  function handleChange(index, value) {
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const newOtp = [...otp]
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || ''
    }
    setOtp(newOtp)
    const focusIdx = Math.min(pasted.length, 5)
    inputRefs.current[focusIdx]?.focus()
  }

  function handleSubmit() {
    const code = otp.join('')
    if (code.length === 6) {
      onSubmit(code)
    }
  }

  const code = otp.join('')
  const isComplete = code.length === 6

  function formatPhone(p) {
    if (!p) return ''
    const d = p.replace(/\D/g, '')
    const local = d.startsWith('233') ? '0' + d.slice(3) : d
    if (local.length === 10) return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`
    return local
  }

  return (
    <div className="flex flex-col items-center py-6 space-y-6">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Shield size={40} className="text-primary" />
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-lg font-bold">Enter Verification Code</h2>
        <p className="text-sm text-text-muted mt-2 max-w-xs">
          A 6-digit code has been sent to <strong>{formatPhone(phone)}</strong> via {network}.
        </p>
        {amount && (
          <p className="text-xs text-text-dim mt-1">
            Amount: <strong>GHS {Number(amount).toFixed(2)}</strong>
          </p>
        )}
      </div>

      <div className="flex gap-2.5 justify-center" onPaste={handlePaste}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={el => inputRefs.current[i] = el}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 bg-surface transition-all focus:outline-none focus:ring-0 ${
              digit
                ? 'border-primary text-primary'
                : 'border-surface-border text-text-primary'
            } focus:border-primary`}
          />
        ))}
      </div>

      {error && (
        <p className="text-xs text-red-500 text-center max-w-xs">{error}</p>
      )}

      <GlassCard className="w-full">
        <div className="flex items-start gap-3">
          <NetworkLogo network={network} size={24} />
          <div>
            <p className="text-xs text-text-muted">
              Open the SMS from Moolre on your phone and enter the 6-digit code above.
            </p>
            <p className="text-[10px] text-text-dim mt-1">
              The code expires in 5 minutes. Do not share it with anyone.
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="w-full space-y-3">
        <button
          onClick={handleSubmit}
          disabled={!isComplete || loading}
          className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-50"
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> Verifying...</>
          ) : (
            'Verify & Complete Payment'
          )}
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          className="w-full text-center text-sm text-text-muted font-semibold py-2"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
