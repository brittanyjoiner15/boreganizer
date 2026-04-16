const GCAL_API_BASE = 'https://www.googleapis.com/calendar/v3'
const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token'

function clientId() { return process.env.GOOGLE_CLIENT_ID! }
function clientSecret() { return process.env.GOOGLE_CLIENT_SECRET! }
function appUrl() { return process.env.NEXT_PUBLIC_APP_URL! }

export function getGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: `${appUrl()}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar.events',
    access_type: 'offline',
    prompt: 'consent',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

export async function exchangeGoogleCode(code: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
}> {
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId(),
      client_secret: clientSecret(),
      redirect_uri: `${appUrl()}/api/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to exchange Google code: ${text}`)
  }
  return res.json()
}

export async function refreshGoogleToken(refreshToken: string): Promise<{
  access_token: string
  expires_in: number
}> {
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId(),
      client_secret: clientSecret(),
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) throw new Error(`Failed to refresh Google token: ${res.status}`)
  return res.json()
}

export async function createGCalEvent(
  accessToken: string,
  name: string,
  dueDate: string,
  eventType: 'all_day' | 'timed'
): Promise<{ id: string }> {
  const event =
    eventType === 'all_day'
      ? {
          summary: name,
          start: { date: dueDate },
          end: { date: dueDate },
        }
      : {
          summary: name,
          start: { dateTime: `${dueDate}T12:00:00`, timeZone: 'UTC' },
          end: { dateTime: `${dueDate}T12:30:00`, timeZone: 'UTC' },
        }

  const res = await fetch(`${GCAL_API_BASE}/calendars/primary/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Failed to create GCal event: ${text}`)
  }
  return res.json()
}

export async function updateGCalEvent(
  accessToken: string,
  eventId: string,
  updates: Record<string, unknown>
): Promise<void> {
  const res = await fetch(`${GCAL_API_BASE}/calendars/primary/events/${eventId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  })
  if (!res.ok) throw new Error(`Failed to update GCal event: ${res.status}`)
}
