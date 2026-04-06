'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createTeam(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = formData.get('name') as string

  // Create the team
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .insert({ name, created_by: user.id })
    .select()
    .single()

  if (teamError || !team) return { error: teamError?.message ?? 'Failed to create team' }

  // Add creator as owner
  const { error: memberError } = await supabase.from('team_members').insert({
    team_id: team.id,
    user_id: user.id,
    email: user.email!,
    role: 'owner',
  })

  if (memberError) return { error: memberError.message }

  revalidatePath('/household')
  redirect('/household')
}

export async function generateInvite(teamId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Deactivate any unused existing invites
  await supabase
    .from('team_invites')
    .delete()
    .eq('team_id', teamId)
    .is('accepted_at', null)

  // Create a new invite
  const { data: invite, error } = await supabase
    .from('team_invites')
    .insert({ team_id: teamId, created_by: user.id })
    .select()
    .single()

  if (error || !invite) return { error: error?.message ?? 'Failed to generate invite' }

  revalidatePath('/household')
  return { token: invite.token as string }
}

export async function acceptInvite(token: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/invite/${token}`)

  // Look up the invite
  const { data: invite, error: inviteError } = await supabase
    .from('team_invites')
    .select('*, teams(name)')
    .eq('token', token)
    .is('accepted_at', null)
    .single()

  if (inviteError || !invite) return { error: 'Invite not found or already used.' }

  // Check user isn't already in this team
  const { data: existing } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', invite.team_id)
    .eq('user_id', user.id)
    .single()

  if (existing) return { error: 'You are already a member of this household.' }

  // Add user to team
  const { error: memberError } = await supabase.from('team_members').insert({
    team_id: invite.team_id,
    user_id: user.id,
    email: user.email!,
    role: 'member',
  })

  if (memberError) return { error: memberError.message }

  // Mark invite as accepted
  await supabase
    .from('team_invites')
    .update({ accepted_by: user.id, accepted_at: new Date().toISOString() })
    .eq('token', token)

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function leaveTeam(teamId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', user.id)

  revalidatePath('/household')
  redirect('/household')
}
