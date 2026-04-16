'use client'

import { useState, useEffect } from 'react'
import { fetchTrelloBoards, fetchTrelloLists, saveTrelloSetup } from '@/app/actions/integrations'

export default function TrelloSetup() {
  const [boards, setBoards] = useState<{ id: string; name: string }[]>([])
  const [lists, setLists] = useState<{ id: string; name: string }[]>([])
  const [selectedBoard, setSelectedBoard] = useState('')
  const [selectedBoardName, setSelectedBoardName] = useState('')
  const [selectedList, setSelectedList] = useState('')
  const [selectedListName, setSelectedListName] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingLists, setLoadingLists] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTrelloBoards().then((result) => {
      if ('error' in result) {
        setError(result.error ?? null)
      } else {
        setBoards(result.boards)
      }
      setLoading(false)
    })
  }, [])

  async function handleBoardChange(boardId: string) {
    const board = boards.find((b) => b.id === boardId)
    setSelectedBoard(boardId)
    setSelectedBoardName(board?.name ?? '')
    setSelectedList('')
    setSelectedListName('')
    setLists([])
    if (!boardId) return

    setLoadingLists(true)
    const result = await fetchTrelloLists(boardId)
    if ('error' in result) {
      setError(result.error ?? null)
    } else {
      setLists(result.lists)
    }
    setLoadingLists(false)
  }

  async function handleSave() {
    if (!selectedBoard || !selectedList) return
    setSaving(true)
    const result = await saveTrelloSetup(selectedBoard, selectedBoardName, selectedList, selectedListName)
    if (result && 'error' in result) {
      setError(result.error ?? null)
      setSaving(false)
    }
    // On success, revalidatePath causes page to re-render without the setup banner
  }

  return (
    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
      <h3 className="font-semibold text-stone-800 mb-1">Finish Trello setup</h3>
      <p className="text-xs text-stone-500 mb-4">Pick the board and list where your tasks should appear.</p>

      {loading && <p className="text-sm text-stone-400">Loading your boards...</p>}
      {error && <p className="text-sm text-red-500 mb-3">{error}</p>}

      {!loading && (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-stone-500 block mb-1">Board</label>
            <select
              value={selectedBoard}
              onChange={(e) => handleBoardChange(e.target.value)}
              className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm bg-white"
            >
              <option value="">Select a board...</option>
              {boards.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {selectedBoard && (
            <div>
              <label className="text-xs font-semibold text-stone-500 block mb-1">List</label>
              {loadingLists ? (
                <p className="text-sm text-stone-400">Loading lists...</p>
              ) : (
                <select
                  value={selectedList}
                  onChange={(e) => {
                    const list = lists.find((l) => l.id === e.target.value)
                    setSelectedList(e.target.value)
                    setSelectedListName(list?.name ?? '')
                  }}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl text-sm bg-white"
                >
                  <option value="">Select a list...</option>
                  {lists.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={!selectedBoard || !selectedList || saving}
            className="w-full py-2 px-4 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save setup'}
          </button>
        </div>
      )}
    </div>
  )
}
