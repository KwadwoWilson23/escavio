import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wallet, ArrowDownLeft, ArrowUpRight, Lock, Loader2, CheckCircle, XCircle, RefreshCw, Phone, Edit3, ChevronRight, Trash2, Clock, AlertTriangle } from 'lucide-react'
import { WalletSkeleton } from '../../components/ui/Skeleton'
import GlassCard from '../../components/ui/GlassCard'
import Badge from '../../components/ui/Badge'
import NetworkLogo, { detectNetwork } from '../../components/ui/NetworkLogo'
import OTPInput from '../../components/ui/OTPInput'
import { formatGHS, formatDate } from '../../utils/format'
import { useAuth } from '../../hooks/useAuth'
import api from '../../services/api'

export default function WalletPage() {
  const [balance, setBalance] = useState(0)
  const [lockedBalance, setLockedBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [step, setStep] = useState('idle')
  const [error, setError] = useState('')
  const [txnId, setTxnId] = useState(null)
  const [altPhone, setAltPhone] = useState('')
  const [useAltPhone, setUseAltPhone] = useState(false)
  const pollRef = useRef(null)
  const { user } = useAuth()
  const navigate = useNavigate()

  const [showAllTxns, setShowAllTxns] = useState(false)
  const [canWithdraw, setCanWithdraw] = useState(true)
  const [withdrawBlockReason, setWithdrawBlockReason] = useState('')
  const [hasActiveLease, setHasActiveLease] = useState(false)

  const activePhone = useAltPhone && altPhone.replace(/\D/g, '').length >= 9 ? altPhone : user?.phone
  const network = activePhone ? detectNetwork(activePhone) : 'Mobile Money'

  useEffect(() => {
    loadWallet()
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  async function loadWallet() {
    try {
      const [balRes, txnRes] = await Promise.all([
        api.get('/wallet/balance'),
        api.get('/wallet/transactions'),
      ])
      setBalance(balRes.data.balance)
      setLockedBalance(balRes.data.locked_balance)
      setCanWithdraw(balRes.data.can_withdraw !== false)
      setWithdrawBlockReason(balRes.data.withdraw_block_reason || '')
      setHasActiveLease(balRes.data.has_active_lease || false)
      setTransactions(txnRes.data)
    } catch {} finally {
      setLoading(false)
    }
  }

  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState('')

  function startDepositPolling(id) {
    let count = 0
    pollRef.current = setInterval(async () => {
      count++
      try {
        const { data: status } = await api.get(`/wallet/deposit-status/${id}`)
        if (status.status === 'success') {
          clearInterval(pollRef.current)
          setBalance(status.balance_after)
          setStep('success')
          loadWallet()
        } else if (status.status === 'failed') {
          clearInterval(pollRef.current)
          setStep('failed')
          setError('Deposit was declined. Check your balance and try again.')
        }
      } catch {}
      if (count >= 24) {
        clearInterval(pollRef.current)
        setStep('timeout')
      }
    }, 5000)
  }

  async function handleDeposit() {
    const amt = Number(depositAmount)
    if (!amt || amt < 1) return setError('Enter at least GHS 1.00')
    setStep('processing')
    setError('')

    try {
      const payload = { amount: amt }
      if (useAltPhone && altPhone.replace(/\D/g, '').length >= 9) {
        payload.phone = altPhone
      }
      const { data } = await api.post('/wallet/deposit', payload)
      setTxnId(data.transaction_id)

      if (data.otp_required) {
        setStep('otp')
      } else {
        setStep('waiting')
        startDepositPolling(data.transaction_id)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Deposit failed')
      setStep('failed')
    }
  }

  async function handleOTPSubmit(otp) {
    setOtpLoading(true)
    setOtpError('')

    try {
      const { data } = await api.post('/wallet/verify-otp', {
        transaction_id: txnId,
        otp,
      })

      if (data.status === 'success') {
        setBalance(data.balance)
        setStep('success')
        loadWallet()
      } else if (data.status === 'failed') {
        setOtpError(data.message || 'Verification failed. Please try again.')
      } else if (data.status === 'invalid_otp') {
        setOtpError(data.message || 'Invalid code. Check your latest SMS and try again.')
      } else if (data.status === 'otp_required') {
        setOtpError(data.message || 'A new code has been sent. Enter the latest code.')
      } else {
        setStep('waiting')
        startDepositPolling(txnId)
      }
    } catch (err) {
      setOtpError(err.response?.data?.detail || err.response?.data?.error || 'Verification failed. Check the code and try again.')
    } finally {
      setOtpLoading(false)
    }
  }

  async function handleWithdraw() {
    const amt = Number(withdrawAmount)
    if (!amt || amt < 1) return setError('Enter at least GHS 1.00')
    if (amt > balance) return setError(`Insufficient balance. Available: GHS ${balance.toFixed(2)}`)
    setStep('processing')
    setError('')

    try {
      const payload = { amount: amt }
      if (useAltPhone && altPhone.replace(/\D/g, '').length >= 9) {
        payload.phone = altPhone
      }
      const { data } = await api.post('/wallet/withdraw', payload)
      setBalance(data.balance)
      setStep('withdraw-success')
      loadWallet()
    } catch (err) {
      setError(err.response?.data?.error || 'Withdrawal failed')
      setStep('failed')
    }
  }

  async function cancelDeposit() {
    if (pollRef.current) clearInterval(pollRef.current)
    if (txnId) {
      try {
        await api.post(`/wallet/cancel/${txnId}`)
      } catch {}
    }
    setStep('failed')
    setError('Payment was cancelled.')
    setTxnId(null)
  }

  function resetFlow() {
    if (pollRef.current) clearInterval(pollRef.current)
    setStep('idle')
    setError('')
    setDepositAmount('')
    setWithdrawAmount('')
    setTxnId(null)
    setAltPhone('')
    setUseAltPhone(false)
    setTab('overview')
  }

  async function handleDeleteTxn(id) {
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  const quickAmounts = [50, 100, 200, 500, 1000, 2000]

  if (loading) return <WalletSkeleton />

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">My Wallet</h1>

      <GlassCard glow="primary" className="text-center py-6">
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Available Balance</span>
        <p className="text-4xl font-bold text-primary mt-2">{formatGHS(balance)}</p>
        {lockedBalance > 0 && (
          <div className="flex items-center justify-center gap-1.5 mt-3 text-text-muted">
            <Lock size={12} />
            <span className="text-xs">{formatGHS(lockedBalance)} locked in leases</span>
          </div>
        )}
      </GlassCard>

      {step === 'idle' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTab('deposit')}
              className={`py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                tab === 'deposit' ? 'bg-primary text-white' : 'bg-surface-card border border-surface-border text-text-primary'
              }`}
            >
              <ArrowDownLeft size={16} /> Deposit
            </button>
            <button
              onClick={() => setTab('withdraw')}
              className={`py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                tab === 'withdraw' ? 'bg-primary text-white' : 'bg-surface-card border border-surface-border text-text-primary'
              }`}
            >
              <ArrowUpRight size={16} /> Withdraw
            </button>
          </div>

          {tab === 'deposit' && (
            <GlassCard className="space-y-4">
              <div className="flex items-center gap-2">
                <NetworkLogo network={network} size={24} />
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Top Up via {network}</h3>
              </div>

              <div className="bg-surface rounded-xl p-3 flex items-center gap-3">
                <Phone size={16} className="text-text-dim flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {useAltPhone ? (
                    <div className="flex gap-2 items-center">
                      <span className="text-xs text-text-muted flex-shrink-0">+233</span>
                      <input
                        type="tel"
                        placeholder="24 123 4567"
                        value={altPhone}
                        onChange={e => setAltPhone(e.target.value)}
                        className="flex-1 text-sm bg-transparent border-none p-0 focus:ring-0 focus:outline-none"
                        maxLength={12}
                      />
                    </div>
                  ) : (
                    <p className="text-sm font-medium truncate">{user?.phone || 'No phone'}</p>
                  )}
                  <p className="text-[10px] text-text-dim">MoMo prompt will be sent to this number</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setUseAltPhone(!useAltPhone); setAltPhone('') }}
                  className="text-xs text-primary font-semibold flex items-center gap-1 flex-shrink-0"
                >
                  <Edit3 size={12} />
                  {useAltPhone ? 'Use mine' : 'Change'}
                </button>
              </div>

              <div>
                <input
                  type="number"
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  className="w-full text-3xl font-bold text-center border-none bg-transparent p-0 focus:ring-0"
                />
                <p className="text-center text-xs text-text-dim mt-1">Amount in GHS</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {quickAmounts.map(a => (
                  <button
                    key={a}
                    onClick={() => setDepositAmount(String(a))}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      depositAmount === String(a) ? 'bg-primary text-white' : 'bg-surface border border-surface-border text-text-muted'
                    }`}
                  >
                    {formatGHS(a)}
                  </button>
                ))}
              </div>
              {error && <p className="text-xs text-red-500 text-center">{error}</p>}
              <button
                onClick={handleDeposit}
                disabled={!depositAmount || Number(depositAmount) < 1}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 disabled:opacity-50"
              >
                <ArrowDownLeft size={16} /> Deposit {depositAmount ? formatGHS(Number(depositAmount)) : ''}
              </button>
            </GlassCard>
          )}

          {tab === 'withdraw' && (
            <GlassCard className="space-y-4">
              <div className="flex items-center gap-2">
                <NetworkLogo network={network} size={24} />
                <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">Withdraw to {network}</h3>
              </div>

              {!canWithdraw ? (
                <div className="py-6 text-center space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-full bg-amber-50 flex items-center justify-center">
                    <AlertTriangle size={28} className="text-amber-500" />
                  </div>
                  <h3 className="font-bold text-text-primary">Withdrawal Restricted</h3>
                  <p className="text-sm text-text-muted max-w-xs mx-auto leading-relaxed">
                    {withdrawBlockReason || 'You have outstanding rent obligations. Clear your dues to unlock withdrawals.'}
                  </p>
                  <button onClick={() => navigate('/dashboard/pay')} className="btn-primary px-6 py-2.5 text-sm">
                    Pay Rent Now
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-surface rounded-xl p-3 flex items-center gap-3">
                    <Phone size={16} className="text-text-dim flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      {useAltPhone ? (
                        <div className="flex gap-2 items-center">
                          <span className="text-xs text-text-muted flex-shrink-0">+233</span>
                          <input
                            type="tel"
                            placeholder="24 123 4567"
                            value={altPhone}
                            onChange={e => setAltPhone(e.target.value)}
                            className="flex-1 text-sm bg-transparent border-none p-0 focus:ring-0 focus:outline-none"
                            maxLength={12}
                          />
                        </div>
                      ) : (
                        <p className="text-sm font-medium truncate">{user?.phone || 'No phone'}</p>
                      )}
                      <p className="text-[10px] text-text-dim">Funds will be sent to this number</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setUseAltPhone(!useAltPhone); setAltPhone('') }}
                      className="text-xs text-primary font-semibold flex items-center gap-1 flex-shrink-0"
                    >
                      <Edit3 size={12} />
                      {useAltPhone ? 'Use mine' : 'Change'}
                    </button>
                  </div>

                  <div>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={withdrawAmount}
                      onChange={e => setWithdrawAmount(e.target.value)}
                      className="w-full text-3xl font-bold text-center border-none bg-transparent p-0 focus:ring-0"
                    />
                    <p className="text-center text-xs text-text-dim mt-1">Available: {formatGHS(balance)}</p>
                  </div>
                  <button
                    onClick={() => setWithdrawAmount(String(balance))}
                    className="text-xs text-primary font-semibold mx-auto block"
                  >
                    Withdraw All
                  </button>
                  {error && <p className="text-xs text-red-500 text-center">{error}</p>}
                  <button
                    onClick={handleWithdraw}
                    disabled={!withdrawAmount || Number(withdrawAmount) < 1}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-full font-semibold bg-surface-card border border-surface-border text-text-primary disabled:opacity-50"
                  >
                    <ArrowUpRight size={16} /> Withdraw {withdrawAmount ? formatGHS(Number(withdrawAmount)) : ''}
                  </button>
                  {hasActiveLease && (
                    <p className="text-[10px] text-amber-600 text-center flex items-center justify-center gap-1">
                      <AlertTriangle size={10} /> Withdrawals are monitored. Ensure your rent is up to date.
                    </p>
                  )}
                  {lockedBalance > 0 && (
                    <p className="text-[10px] text-text-dim text-center flex items-center justify-center gap-1">
                      <Lock size={10} /> Locked funds ({formatGHS(lockedBalance)}) cannot be withdrawn
                    </p>
                  )}
                </>
              )}
            </GlassCard>
          )}

          {tab === 'overview' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm">Recent Transactions</h3>
                {transactions.length > 3 && (
                  <button
                    onClick={() => setShowAllTxns(!showAllTxns)}
                    className="text-xs text-primary font-semibold flex items-center gap-1"
                  >
                    {showAllTxns ? 'Show less' : 'View history'}
                    <ChevronRight size={14} className={`transition-transform ${showAllTxns ? 'rotate-90' : ''}`} />
                  </button>
                )}
              </div>

              {transactions.length === 0 ? (
                <GlassCard className="text-center py-6">
                  <Wallet size={32} className="text-text-dim mx-auto mb-2" />
                  <p className="text-sm text-text-muted">No transactions yet</p>
                  <p className="text-xs text-text-dim mt-1">Deposit funds to get started</p>
                </GlassCard>
              ) : (
                <div className="space-y-2">
                  {(showAllTxns ? transactions : transactions.slice(0, 3)).map(txn => (
                    <SwipeableTxn key={txn.id} txn={txn} onDelete={handleDeleteTxn} />
                  ))}
                  {!showAllTxns && transactions.length > 3 && (
                    <button
                      onClick={() => setShowAllTxns(true)}
                      className="w-full py-2.5 text-xs text-text-muted font-medium flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-surface-border"
                    >
                      <Clock size={12} /> {transactions.length - 3} more transactions
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {step === 'processing' && (
        <div className="flex flex-col items-center py-16 space-y-4">
          <div className="relative">
            <NetworkLogo network={network} size={56} />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" style={{ animationDuration: '1.5s', width: 64, height: 64, top: -4, left: -4 }} />
          </div>
          <p className="text-text-muted font-medium">Connecting to {network}...</p>
        </div>
      )}

      {step === 'otp' && (
        <OTPInput
          phone={activePhone}
          amount={depositAmount}
          onSubmit={handleOTPSubmit}
          onCancel={resetFlow}
          loading={otpLoading}
          error={otpError}
        />
      )}

      {step === 'waiting' && (
        <div className="flex flex-col items-center py-8 space-y-6">
          <div className="relative">
            <NetworkLogo network={network} size={72} />
            <div className="absolute rounded-full border-4 border-yellow-200 border-t-yellow-500 animate-spin" style={{ animationDuration: '2s', width: 84, height: 84, top: -6, left: -6 }} />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold">Processing Payment</h2>
            <p className="text-sm text-text-muted mt-2">
              Your payment of <strong>{formatGHS(Number(depositAmount))}</strong> is being processed. Please wait...
            </p>
          </div>
          <button
            onClick={cancelDeposit}
            className="text-sm text-red-500 font-semibold px-6 py-2.5 rounded-full border border-red-200 bg-red-50 flex items-center gap-2"
          >
            <XCircle size={16} /> Cancel Payment
          </button>
        </div>
      )}

      {step === 'success' && (
        <div className="flex flex-col items-center py-8 space-y-6">
          <CheckCircle size={56} className="text-accent-success" />
          <div className="text-center">
            <h2 className="text-xl font-bold">Deposit Successful!</h2>
            <p className="text-sm text-text-muted mt-2">
              {formatGHS(Number(depositAmount))} added to your wallet.
            </p>
          </div>
          <button onClick={resetFlow} className="btn-primary px-8">Done</button>
        </div>
      )}

      {step === 'withdraw-success' && (
        <div className="flex flex-col items-center py-8 space-y-6">
          <CheckCircle size={56} className="text-accent-success" />
          <div className="text-center">
            <h2 className="text-xl font-bold">Withdrawal Sent!</h2>
            <p className="text-sm text-text-muted mt-2">
              {formatGHS(Number(withdrawAmount))} sent to your {network} wallet.
            </p>
          </div>
          <button onClick={resetFlow} className="btn-primary px-8">Done</button>
        </div>
      )}

      {step === 'failed' && (
        <div className="flex flex-col items-center py-8 space-y-6">
          <XCircle size={56} className="text-red-500" />
          <div className="text-center">
            <h2 className="text-xl font-bold">Transaction Failed</h2>
            <p className="text-sm text-text-muted mt-2">{error}</p>
          </div>
          <button onClick={resetFlow} className="btn-primary px-8 flex items-center gap-2">
            <RefreshCw size={16} /> Try Again
          </button>
        </div>
      )}

      {step === 'timeout' && (
        <div className="flex flex-col items-center py-8 space-y-6">
          <Loader2 size={48} className="text-yellow-500" />
          <div className="text-center">
            <h2 className="text-xl font-bold">Still Processing</h2>
            <p className="text-sm text-text-muted mt-2">Your deposit may still be processing. Check back shortly.</p>
          </div>
          <button onClick={resetFlow} className="btn-primary px-8">Back to Wallet</button>
        </div>
      )}
    </div>
  )
}

function SwipeableTxn({ txn, onDelete }) {
  const [offsetX, setOffsetX] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const startX = useRef(0)
  const currentX = useRef(0)

  const isDeposit = txn.type === 'deposit'
  const isLock = txn.type === 'lock'

  function handleTouchStart(e) {
    startX.current = e.touches[0].clientX
    currentX.current = startX.current
    setSwiping(true)
  }

  function handleTouchMove(e) {
    if (!swiping) return
    currentX.current = e.touches[0].clientX
    const diff = currentX.current - startX.current
    if (diff < 0) setOffsetX(Math.max(diff, -80))
  }

  function handleTouchEnd() {
    setSwiping(false)
    if (offsetX < -50) {
      setOffsetX(-80)
    } else {
      setOffsetX(0)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="absolute inset-y-0 right-0 w-20 bg-red-500 flex items-center justify-center rounded-2xl">
        <button onClick={() => onDelete(txn.id)} className="flex flex-col items-center gap-0.5 text-white">
          <Trash2 size={16} />
          <span className="text-[10px] font-medium">Delete</span>
        </button>
      </div>
      <div
        className="relative bg-surface-card border border-surface-border rounded-2xl px-4 py-3 flex items-center gap-3 transition-transform"
        style={{ transform: `translateX(${offsetX}px)`, transition: swiping ? 'none' : 'transform 0.2s ease-out' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
          isDeposit ? 'bg-green-50' : isLock ? 'bg-blue-50' : 'bg-red-50'
        }`}>
          {isDeposit ? <ArrowDownLeft size={16} className="text-green-600" />
            : isLock ? <Lock size={16} className="text-primary" />
            : <ArrowUpRight size={16} className="text-red-500" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{txn.description || txn.type}</p>
          <p className="text-[10px] text-text-dim">{formatDate(txn.created_at)}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className={`font-bold text-sm ${isDeposit ? 'text-green-600' : 'text-red-500'}`}>
            {isDeposit ? '+' : '-'}{formatGHS(txn.amount)}
          </p>
          <Badge variant={txn.status === 'success' ? 'success' : txn.status === 'pending' ? 'warning' : 'danger'}>
            {txn.status}
          </Badge>
        </div>
      </div>
    </div>
  )
}
