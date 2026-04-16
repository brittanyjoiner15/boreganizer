import crypto from 'crypto'
import { type NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

function verifySignature(body: string, signature: string, callbackUrl: string): boolean {
  const hash = crypto
    .createHmac('sha1', process.env.TRELLO_API_SECRET!)
    .update(callbackUrl + body)
    .digest('base64')
  return hash === signature
}

// Trello sends HEAD to verify the endpoint exists before activating the webhook
export async function HEAD() {
  return new Response(null, { status: 200 })
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-trello-webhook') ?? ''
  const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/trello`

  console.log('[trello-webhook] received POST, callbackUrl:', callbackUrl)

  if (!verifySignature(body, signature, callbackUrl)) {
    console.log('[trello-webhook] signature verification failed')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: {
    action?: {
      type?: string
      data?: {
        card?: { id?: string; due?: string }
        old?: { due?: string }
      }
    }
  }

  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const action = payload.action
  console.log('[trello-webhook] action type:', action?.type)

  if (action?.type !== 'updateCard') return NextResponse.json({ ok: true })
  if (!action.data?.old?.due) {
    console.log('[trello-webhook] no due date change in old, old keys:', Object.keys(action.data?.old ?? {}))
    return NextResponse.json({ ok: true })
  }

  const cardId = action.data.card?.id
  const newDue = action.data.card?.due
  console.log('[trello-webhook] due date change — cardId:', cardId, 'newDue:', newDue)

  if (!cardId || !newDue) return NextResponse.json({ ok: true })

  const newDueDate = new Date(newDue).toISOString().split('T')[0]

  const supabase = createServiceClient()

  const { data: syncItem, error: syncError } = await supabase
    .from('task_sync_items')
    .select('task_id')
    .eq('external_id', cardId)
    .eq('status', 'active')
    .single()

  console.log('[trello-webhook] sync item lookup — found:', !!syncItem, 'error:', syncError?.message)

  if (!syncItem) return NextResponse.json({ ok: true })

  const { error: updateError } = await supabase
    .from('tasks')
    .update({ next_due_date: newDueDate })
    .eq('id', syncItem.task_id)

  console.log('[trello-webhook] task update — taskId:', syncItem.task_id, 'newDate:', newDueDate, 'error:', updateError?.message)

  return NextResponse.json({ ok: true })
}
