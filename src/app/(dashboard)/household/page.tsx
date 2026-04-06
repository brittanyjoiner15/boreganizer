import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HouseholdClient from './HouseholdClient'

export default async function HouseholdPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('team_members')
    .select('role, teams(id, name, created_by)')
    .eq('user_id', user.id)
    .single()

  const team = (membership?.teams as unknown as { id: string; name: string; created_by: string }) ?? null

  let members: { id: string; email: string; role: string; user_id: string }[] = []
  let activeInviteToken: string | null = null

  if (team) {
    const [{ data: teamMembers }, { data: invites }] = await Promise.all([
      supabase
        .from('team_members')
        .select('id, email, role, user_id')
        .eq('team_id', team.id),
      supabase
        .from('team_invites')
        .select('token')
        .eq('team_id', team.id)
        .is('accepted_at', null)
        .order('created_at', { ascending: false })
        .limit(1),
    ])
    members = teamMembers ?? []
    activeInviteToken = invites?.[0]?.token ?? null
  }

  return (
    <HouseholdClient
      team={team}
      members={members}
      activeInviteToken={activeInviteToken}
      currentUserId={user.id}
    />
  )
}
