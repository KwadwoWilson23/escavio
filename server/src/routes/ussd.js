import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { normalizePhone, collectPayment } from '../services/moolre.js'
import { getOrCreateWallet } from './wallet.js'
import env from '../config/env.js'

const router = Router()

router.post('/callback', async (req, res) => {
  const { sessionId, phoneNumber, text, serviceCode } = req.body
  const phone = normalizePhone(phoneNumber || '')

  console.log(`[USSD] Session=${sessionId} Phone=${phone} Input="${text}" Code=${serviceCode}`)

  try {
    const parts = (text || '').split('*').filter(Boolean)
    const level = parts.length

    const { data: user } = await supabase
      .from('users')
      .select('id, full_name, role, is_verified')
      .eq('phone', phone)
      .single()

    if (!user) {
      return res.send(`END Welcome to Escavio.\n\nThis number is not registered.\nDownload the app at escavio.vercel.app to create an account.`)
    }

    if (level === 0) {
      return res.send(
        `CON Welcome to Escavio, ${user.full_name?.split(' ')[0] || 'User'}!\n` +
        `1. Wallet Balance\n` +
        `2. Pay Rent\n` +
        `3. Lease Status\n` +
        `4. Withdraw Funds\n` +
        `0. Exit`
      )
    }

    const choice = parts[0]

    if (choice === '0') {
      return res.send(`END Thank you for using Escavio.\nVisit escavio.vercel.app for more.`)
    }

    // 1. Wallet Balance
    if (choice === '1') {
      const wallet = await getOrCreateWallet(user.id)
      const available = Number(wallet.balance).toFixed(2)
      const locked = Number(wallet.locked_balance).toFixed(2)
      const total = (Number(wallet.balance) + Number(wallet.locked_balance)).toFixed(2)
      return res.send(
        `END Escavio Wallet\n\n` +
        `Available: GHS ${available}\n` +
        `Locked: GHS ${locked}\n` +
        `Total: GHS ${total}`
      )
    }

    // 2. Pay Rent
    if (choice === '2') {
      const { data: lease } = await supabase
        .from('leases')
        .select('id, monthly_amount, status, properties(address)')
        .eq('tenant_id', user.id)
        .eq('status', 'active')
        .single()

      if (!lease) {
        return res.send(`END You have no active lease.\nBrowse properties at escavio.vercel.app`)
      }

      if (level === 1) {
        return res.send(
          `CON Pay Rent\n` +
          `Property: ${lease.properties?.address || 'N/A'}\n` +
          `Amount: GHS ${Number(lease.monthly_amount).toFixed(2)}\n\n` +
          `1. Pay now via MoMo\n` +
          `0. Back`
        )
      }

      if (level === 2 && parts[1] === '1') {
        const wallet = await getOrCreateWallet(user.id)
        if (Number(wallet.balance) >= Number(lease.monthly_amount)) {
          const newBalance = Number(wallet.balance) - Number(lease.monthly_amount)
          await supabase
            .from('wallets')
            .update({ balance: newBalance, updated_at: new Date().toISOString() })
            .eq('id', wallet.id)

          await supabase
            .from('wallet_transactions')
            .insert({
              wallet_id: wallet.id,
              user_id: user.id,
              type: 'lock',
              amount: Number(lease.monthly_amount),
              balance_after: newBalance,
              description: 'Rent payment via USSD',
              reference: `USSD-RENT-${Date.now()}`,
              status: 'success',
            })

          return res.send(
            `END Rent payment of GHS ${Number(lease.monthly_amount).toFixed(2)} successful!\n\n` +
            `Paid from wallet balance.\n` +
            `New balance: GHS ${newBalance.toFixed(2)}`
          )
        }

        const reference = `USSD-${user.id.slice(0, 8)}-${Date.now()}`
        try {
          await collectPayment({
            amount: Number(lease.monthly_amount),
            phone,
            reference,
            callbackUrl: env.appBaseUrl !== 'http://localhost:5000'
              ? `${env.appBaseUrl}/api/webhooks/moolre`
              : undefined,
          })
          return res.send(
            `END MoMo prompt sent!\n\n` +
            `Amount: GHS ${Number(lease.monthly_amount).toFixed(2)}\n` +
            `Approve on your phone to complete payment.\n` +
            `Ref: ${reference}`
          )
        } catch {
          return res.send(`END Payment could not be initiated.\nPlease try again later or use the app.`)
        }
      }

      if (parts[1] === '0') {
        return res.send(
          `CON Welcome to Escavio, ${user.full_name?.split(' ')[0] || 'User'}!\n` +
          `1. Wallet Balance\n` +
          `2. Pay Rent\n` +
          `3. Lease Status\n` +
          `4. Withdraw Funds\n` +
          `0. Exit`
        )
      }
    }

    // 3. Lease Status
    if (choice === '3') {
      const { data: leases } = await supabase
        .from('leases')
        .select('monthly_amount, status, start_date, properties(address)')
        .or(`tenant_id.eq.${user.id},landlord_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(1)

      if (!leases?.length) {
        return res.send(`END No lease found.\nBrowse properties at escavio.vercel.app`)
      }

      const l = leases[0]
      return res.send(
        `END Lease Info\n\n` +
        `Property: ${l.properties?.address || 'N/A'}\n` +
        `Rent: GHS ${Number(l.monthly_amount).toFixed(2)}/month\n` +
        `Status: ${l.status}\n` +
        `Since: ${l.start_date || 'N/A'}`
      )
    }

    // 4. Withdraw
    if (choice === '4') {
      const wallet = await getOrCreateWallet(user.id)
      const available = Number(wallet.balance)

      if (level === 1) {
        if (available < 1) {
          return res.send(`END Insufficient balance.\nAvailable: GHS ${available.toFixed(2)}\n\nDeposit via the app first.`)
        }
        return res.send(
          `CON Withdraw to MoMo\n` +
          `Available: GHS ${available.toFixed(2)}\n\n` +
          `Enter amount:`
        )
      }

      if (level === 2) {
        const amt = Number(parts[1])
        if (!amt || amt < 1) {
          return res.send(`END Invalid amount. Minimum is GHS 1.00`)
        }
        if (amt > available) {
          return res.send(`END Amount exceeds balance.\nAvailable: GHS ${available.toFixed(2)}`)
        }

        const newBalance = available - amt
        const reference = `USSD-WD-${user.id.slice(0, 8)}-${Date.now()}`

        await supabase
          .from('wallets')
          .update({ balance: newBalance, updated_at: new Date().toISOString() })
          .eq('id', wallet.id)

        await supabase
          .from('wallet_transactions')
          .insert({
            wallet_id: wallet.id,
            user_id: user.id,
            type: 'withdrawal',
            amount: amt,
            balance_after: newBalance,
            description: 'USSD withdrawal to MoMo',
            reference,
            status: 'success',
          })

        try {
          const { disbursePayment } = await import('../services/moolre.js')
          await disbursePayment({ amount: amt, phone, reference })
        } catch {}

        return res.send(
          `END GHS ${amt.toFixed(2)} sent to your MoMo!\n\n` +
          `New balance: GHS ${newBalance.toFixed(2)}\n` +
          `Ref: ${reference}`
        )
      }
    }

    return res.send(`END Invalid option. Dial ${serviceCode || '*714#'} to try again.`)
  } catch (err) {
    console.error('[USSD] Error:', err.message)
    return res.send(`END An error occurred.\nPlease try again later.`)
  }
})

export default router
