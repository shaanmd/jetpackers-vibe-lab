export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface BuildRequest {
  prompt: string
  history: Message[]
}

export interface PublishRequest {
  html: string
  title?: string
}

export interface PublishResponse {
  url: string
  slug: string
}
