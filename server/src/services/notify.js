import { supabase } from '../config/supabase.js'

export async function createNotification({ userId, message, channel = 'in_app', type = 'general' }) {
  if (!userId) return null
  const { data, error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, message, channel, type })
    .select()
    .single()
  if (error) return null
  return data
}

export async function notifyBoth({ payerId, recipientId, payerMsg, recipientMsg, type = 'payment' }) {
  const promises = []
  if (payerId && payerMsg) {
    promises.push(createNotification({ userId: payerId, message: payerMsg, type }))
  }
  if (recipientId && recipientMsg) {
    promises.push(createNotification({ userId: recipientId, message: recipientMsg, type }))
  }
  return Promise.all(promises)
}
