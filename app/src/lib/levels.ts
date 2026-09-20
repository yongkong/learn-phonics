// 词库级别 ↔ 课程进度的共享定义（拼读机 / 拼写挑战共用）
export interface WordLevel {
  value: number | 'all'
  label: string
}

export const WORD_LEVELS: WordLevel[] = [
  { value: 1, label: 'L1 · s a t p' },
  { value: 2, label: 'L2 · 加 i n m d' },
  { value: 3, label: 'L3 · 加 g o c k' },
  { value: 4, label: 'L4 · 加 e u r' },
  { value: 5, label: 'L5 · 加 h b f l' },
  { value: 6, label: 'L6 · 加 j v w x y z q' },
  { value: 'all', label: '全部' },
]
