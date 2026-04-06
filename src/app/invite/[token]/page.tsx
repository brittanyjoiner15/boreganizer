import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AcceptInviteButton from './AcceptInviteButton'

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Look up invite (public read allowed by RLS)
  const { data: invite } = await supabase
    .from('team_invites')
    .select('id, accepted_at, teams(name)')
    .eq('token', token)
    .single()

  const teamName = (invite?.teams as unknown as { name: string } | null)?.name

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="text-5xl mb-4">🏡</div>

        {!invite && (
          <>
            <h1 className="text-2xl font-extrabold text-stone-800 mb-2">Invalid invite</h1>
            <p className="text-stone-400 mb-6">This invite link is invalid or has already been used.</p>
            <Link href="/dashboard" className="text-violet-600 font-semibold hover:underline">
              Go to dashboard
            </Link>
          </>
        )}

        {invite && invite.accepted_at && (
          <>
            <h1 className="text-2xl font-extrabold text-stone-800 mb-2">Already accepted</h1>
            <p className="text-stone-400 mb-6">This invite has already been used.</p>
            <Link href="/dashboard" className="text-violet-600 font-semibold hover:underline">
              Go to dashboard
            </Link>
          </>
        )}

        {invite && !invite.accepted_at && (
          <>
            <h1 className="text-2xl font-extrabold text-stone-800 mb-2">
              You're invited!
            </h1>
            <p className="text-stone-500 mb-6">
              Join <span className="font-bold text-stone-700">{teamName}</span> on Boreganizer
              to share and manage chores together.
            </p>

            {!user ? (
              <div className="space-y-3">
                <Link
                  href={`/signup?next=/invite/${token}`}
                  className="block w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  Create an account to join
                </Link>
                <Link
                  href={`/login?next=/invite/${token}`}
                  className="block w-full border-2 border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-bold py-3 rounded-xl transition-colors"
                >
                  Sign in to join
                </Link>
              </div>
            ) : (
              <AcceptInviteButton token={token} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
