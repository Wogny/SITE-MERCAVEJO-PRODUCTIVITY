/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_TRELLO_API_KEY?: string
  readonly VITE_TRELLO_TOKEN?: string
  readonly VITE_TRELLO_BOARD_ID?: string
  readonly VITE_TRELLO_STUDIO_LIST_ID?: string
  readonly VITE_TRELLO_COMPLETED_LIST_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}