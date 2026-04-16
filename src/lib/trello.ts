const TRELLO_API_BASE = 'https://api.trello.com/1'

function apiKey() {
  return process.env.TRELLO_API_KEY!
}

export function getTrelloAuthUrl(returnUrl: string): string {
  const params = new URLSearchParams({
    expiration: 'never',
    name: 'Boreganizer',
    scope: 'read,write',
    response_type: 'token',
    key: apiKey(),
    return_url: returnUrl,
  })
  return `https://trello.com/1/authorize?${params}`
}

export async function getTrelloBoards(token: string): Promise<{ id: string; name: string }[]> {
  const res = await fetch(
    `${TRELLO_API_BASE}/members/me/boards?key=${apiKey()}&token=${token}&filter=open&fields=name,id`
  )
  if (!res.ok) throw new Error(`Failed to fetch Trello boards: ${res.status}`)
  return res.json()
}

export async function getTrelloLists(token: string, boardId: string): Promise<{ id: string; name: string }[]> {
  const res = await fetch(
    `${TRELLO_API_BASE}/boards/${boardId}/lists?key=${apiKey()}&token=${token}&filter=open&fields=name,id`
  )
  if (!res.ok) throw new Error(`Failed to fetch Trello lists: ${res.status}`)
  return res.json()
}

export async function createTrelloCard(
  token: string,
  listId: string,
  name: string,
  dueDate: string | null
): Promise<{ id: string }> {
  const body: Record<string, string> = { idList: listId, name }
  if (dueDate) body.due = `${dueDate}T12:00:00.000Z`

  const res = await fetch(`${TRELLO_API_BASE}/cards?key=${apiKey()}&token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Failed to create Trello card: ${res.status}`)
  return res.json()
}

export async function registerTrelloWebhook(
  token: string,
  boardId: string,
  callbackUrl: string
): Promise<string> {
  const res = await fetch(`${TRELLO_API_BASE}/webhooks?key=${apiKey()}&token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      callbackURL: callbackUrl,
      idModel: boardId,
      description: 'Boreganizer sync',
    }),
  })
  if (!res.ok) throw new Error(`Failed to register Trello webhook: ${res.status}`)
  const data = await res.json()
  return data.id
}

export async function deregisterTrelloWebhook(token: string, webhookId: string): Promise<void> {
  // Best-effort — don't throw if already gone
  await fetch(`${TRELLO_API_BASE}/webhooks/${webhookId}?key=${apiKey()}&token=${token}`, {
    method: 'DELETE',
  })
}

export async function updateTrelloCardDue(token: string, cardId: string, dueDate: string): Promise<void> {
  const res = await fetch(`${TRELLO_API_BASE}/cards/${cardId}?key=${apiKey()}&token=${token}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ due: `${dueDate}T12:00:00.000Z` }),
  })
  if (!res.ok) throw new Error(`Failed to update Trello card due date: ${res.status}`)
}

export async function markTrelloCardComplete(token: string, cardId: string): Promise<void> {
  const res = await fetch(`${TRELLO_API_BASE}/cards/${cardId}?key=${apiKey()}&token=${token}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dueComplete: true }),
  })
  if (!res.ok) throw new Error(`Failed to mark Trello card complete: ${res.status}`)
}
