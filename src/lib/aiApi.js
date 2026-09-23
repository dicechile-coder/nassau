import { supabase } from './supabase.js'

async function call(body) {
  const { data, error } = await supabase.functions.invoke('ai-tutor', { body })
  if (error) {
    let msg = error.message
    try { const j = await error.context?.json?.(); if (j?.error) msg = j.error } catch { /* keep message */ }
    throw new Error(msg)
  }
  if (data?.error) throw new Error(data.error)
  return data
}

export const aiChat = (stepId, messages, preview = false) => call({ action: 'chat', step_id: stepId, messages, preview })
export const aiMark = (stepId, text, variationIndex, preview = false) => call({ action: 'mark', step_id: stepId, text, variation_index: variationIndex, preview })

export async function myAllowance() {
  const { data } = await supabase.rpc('my_ai_allowance')
  return data
}
