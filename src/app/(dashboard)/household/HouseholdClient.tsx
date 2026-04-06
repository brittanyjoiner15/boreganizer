'use client'

import { useState, useActionState } from 'react'
import Link from 'next/link'
import { createTeam, generateInvite, leaveTeam } from '@/app/actions/teams'

interface Member {
  id: string
  email: string
  role: string
  user_id: string
}

interface Team {
  id: string
  name: string
  created_by: string
}

interface Props {
  team: Team | null
  members: Member[]
  activeInviteToken: string | null
  currentUserId: string
}

type CreateState = { error: string | undefined }
const initialState: CreateState = { error: undefined }

function emailLabel(email: string) {
  return email.split('@')[0]
}

export default function HouseholdClient({ team, members, activeInviteToken, currentUserId }: Props) {
  const [inviteToken, setInviteToken] = useState<string | null>(activeInviteToken)
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)

  const [createState, createAction, isCreating] = useActionState(
    async (_prev: CreateState, formData: FormData): Promise<CreateState> => {
      const result = await createTeam(formData)
      return result ?? initialState
    },
    initialState
  )

  const inviteUrl = inviteToken
    ? `${window.location.origin}/invite/${inviteToken}`
    : null

  async function handleGenerateInvite() {
    if (!team) return
    setGenerating(true)
    const result = await generateInvite(team.id)
    setGenerating(false)
    if (result?.token) setInviteToken(result.token)
  }

  async function handleCopy() {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="pt-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="text-stone-400 hover:text-stone-600 text-lg">←</Link>
        <h1 className="text-2xl font-extrabold text-stone-800">Household</h1>
      </div>

      {!team ? (
        <div>
          <div className="bg-violet-50 rounded-2xl border-2 border-violet-100 p-5 mb-6 text-center">
            <div className="text-4xl mb-2">🏡</div>
            <p className="font-bold text-stone-700 mb-1">No household yet</p>
            <p className="text-sm text-stone-400">Create one and invite your partner to share chores.</p>
          </div>

          <form action={createAction} className="space-y-4">
            {createState.error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3">
                {createState.error}
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                Household name
              </label>
              <input
                name="name"
                type="text"
                required
                placeholder="e.g. The Smith House"
                className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <button
              type="submit"
              disabled={isCreating}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors"
            >
              {isCreating ? 'Creating...' : 'Create household'}
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Team info */}
          <div className="bg-white rounded-2xl border-2 border-stone-200 p-5">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Your household</p>
            <p className="text-xl font-extrabold text-stone-800">{team.name}</p>
          </div>

          {/* Members */}
          <div>
            <h2 className="text-sm font-extrabold text-stone-500 uppercase tracking-wider mb-3">Members</h2>
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.id} className="bg-white rounded-xl border border-stone-200 px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-violet-600">
                      {emailLabel(member.email).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-700 truncate">{emailLabel(member.email)}</p>
                    <p className="text-xs text-stone-400 truncate">{member.email}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    member.role === 'owner'
                      ? 'bg-violet-100 text-violet-700'
                      : 'bg-stone-100 text-stone-500'
                  }`}>
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Invite link */}
          <div>
            <h2 className="text-sm font-extrabold text-stone-500 uppercase tracking-wider mb-3">Invite someone</h2>
            <div className="bg-white rounded-2xl border-2 border-stone-200 p-4 space-y-3">
              {inviteUrl ? (
                <>
                  <p className="text-sm text-stone-500">Share this link with anyone you want to add:</p>
                  <div className="bg-stone-50 rounded-xl border border-stone-200 px-3 py-2.5 flex items-center gap-2">
                    <p className="text-xs text-stone-500 flex-1 truncate font-mono">{inviteUrl}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
                    >
                      {copied ? '✓ Copied!' : 'Copy link'}
                    </button>
                    <button
                      onClick={handleGenerateInvite}
                      disabled={generating}
                      className="px-4 py-2.5 rounded-xl border-2 border-stone-200 text-stone-500 font-semibold text-sm hover:bg-stone-50 transition-colors disabled:opacity-50"
                    >
                      New link
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-stone-500">Generate a link to share with your partner.</p>
                  <button
                    onClick={handleGenerateInvite}
                    disabled={generating}
                    className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors text-sm"
                  >
                    {generating ? 'Generating...' : 'Generate invite link'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Leave */}
          <div className="border-t border-stone-200 pt-6">
            <form action={leaveTeam.bind(null, team.id)}>
              <button
                type="submit"
                className="w-full py-3 rounded-xl text-rose-500 font-semibold text-sm hover:bg-rose-50 transition-colors"
              >
                Leave household
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
