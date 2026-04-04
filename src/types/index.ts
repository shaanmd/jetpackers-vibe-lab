export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export type ImageMimeType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

export type Attachment =
  | { type: 'image'; name: string; base64: string; mimeType: ImageMimeType }
  | { type: 'csv'; name: string; text: string; rowCount: number }

export interface BuildRequest {
  prompt: string
  history: Message[]
  attachment?: Attachment
}

export interface PublishRequest {
  html: string
  title?: string
}

export interface PublishResponse {
  url: string
  slug: string
}
