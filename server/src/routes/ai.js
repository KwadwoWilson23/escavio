import { Router } from 'express'
import { supabase } from '../config/supabase.js'
import { authenticate } from '../middleware/auth.js'
import { summarizeLease, analyzeDispute, generatePaymentReminder, checkRentCompliance } from '../services/ai.js'

const router = Router()

router.post('/summarize-lease', authenticate, async (req, res) => {
  try {
    const { lease_id } = req.body

    const { data: lease } = await supabase
      .from('leases')
      .select('*, properties(address)')
      .eq('id', lease_id)
      .single()

    if (!lease) return res.status(404).json({ error: 'Lease not found' })

    const summary = await summarizeLease(lease)
    res.json({ summary })
  } catch (err) {
    res.status(500).json({ error: 'AI summarization failed' })
  }
})

router.post('/dispute-analysis', authenticate, async (req, res) => {
  try {
    const { dispute_id } = req.body

    const { data: dispute } = await supabase
      .from('disputes')
      .select('*')
      .eq('id', dispute_id)
      .single()

    if (!dispute) return res.status(404).json({ error: 'Dispute not found' })

    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('lease_id', dispute.lease_id)
      .order('due_date', { ascending: true })

    const analysis = await analyzeDispute(dispute, payments || [])

    await supabase
      .from('disputes')
      .update({ ai_summary: analysis, status: 'reviewing' })
      .eq('id', dispute_id)

    res.json({ analysis })
  } catch (err) {
    res.status(500).json({ error: 'AI analysis failed' })
  }
})

router.post('/payment-reminder', authenticate, async (req, res) => {
  try {
    const { lease_id } = req.body

    const { data: lease } = await supabase
      .from('leases')
      .select('*, tenant:users!leases_tenant_id_fkey(full_name, phone)')
      .eq('id', lease_id)
      .single()

    if (!lease) return res.status(404).json({ error: 'Lease not found' })

    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('lease_id', lease_id)

    const daysUntilDue = 3
    const reminder = await generatePaymentReminder(
      lease.tenant,
      lease.monthly_amount,
      daysUntilDue,
      payments || []
    )

    res.json({ reminder })
  } catch (err) {
    res.status(500).json({ error: 'Reminder generation failed' })
  }
})

router.post('/compliance-check', authenticate, async (req, res) => {
  try {
    const { advance_months } = req.body
    const result = await checkRentCompliance(advance_months)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: 'Compliance check failed' })
  }
})

export default router
