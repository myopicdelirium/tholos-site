export type LogType = 'release' | 'patch' | 'paper' | 'update'

export type LogEntry = {
  id: string
  type: LogType
  title: string
  date: string
  summary: string
  tags: string[]
  href?: string
}

export const LOGBOOK_ENTRIES: LogEntry[] = []
