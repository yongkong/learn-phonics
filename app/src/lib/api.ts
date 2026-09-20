export interface Phoneme {
  letter: string
  sound: string
  say: string
  words: string[]
  phase: number
  set_no: number | null
}

export interface LeaderRow {
  nickname: string
  sessions: number
  correct: number
  questions: number
  accuracy: number
  last_played: string
}

export interface WordItem {
  word: string
  letters: string[]
  says: string[]
  meaning: string
  level: number
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

export function fetchPhonemes(): Promise<Phoneme[]> {
  return fetch('/api/phonemes').then((r) => json<Phoneme[]>(r))
}

export function fetchWords(): Promise<WordItem[]> {
  return fetch('/api/words').then((r) => json<WordItem[]>(r))
}

export function fetchLeaderboard(): Promise<LeaderRow[]> {
  return fetch('/api/leaderboard').then((r) => json<LeaderRow[]>(r))
}

export function postProgress(nickname: string, mode: string, score: number, total: number) {
  return fetch('/api/progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname, mode, score, total }),
  }).then((r) => json<{ ok: boolean }>(r))
}
