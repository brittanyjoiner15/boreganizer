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

  if (!verifySignature(body, signature, callbackUrl)) {
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
  if (action?.type !== 'updateCard') return NextResponse.json({ ok: true })
  if (!action.data?.old?.due) return NextResponse.json({ ok: true }) // due date didn't change

  const cardId = action.data.card?.id
  const newDue = action.data.card?.due
  if (!cardId || !newDue) return NextResponse.json({ ok: true })

  // We store noon UTC, so the date part is always safe to extract
  const newDueDate = new Date(newDue).toISOString().split('T')[0]

  const supabase = createServiceClient()

  const { data: syncItem } = await supabase
    .from('task_sync_items')
    .select('task_id')
    .eq('external_id', cardId)
    .eq('status', 'active')
    .single()

  if (!syncItem) return NextResponse.json({ ok: true })

  await supabase
    .from('tasks')
    .update({ next_due_date: newDueDate })
    .eq('id', syncItem.task_id)

  return NextResponse.json({ ok: true })
}
