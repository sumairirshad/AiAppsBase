export type PostContentType = 'Text' | 'Image' | 'MultiImage' | 'Video' | 'Document' | 'ArticleLink'
export type PostStatus = 'Draft' | 'Scheduled' | 'Publishing' | 'Published' | 'Failed'
export type MediaKind = 'Image' | 'Video' | 'Document'
export type EngagementActionType = 'Comment' | 'Reaction' | 'Repost'
export type EngagementTaskStatus = 'Pending' | 'Done' | 'Dismissed'

export interface MediaAsset {
  id: string
  kind: MediaKind
  originalFileName: string
  contentType: string
  sizeBytes: number
  uploadedAt: string
}

export interface Post {
  id: string
  contentType: PostContentType
  status: PostStatus
  title: string | null
  body: string
  externalLinkUrl: string | null
  captionTemplateId: string | null
  scheduledAt: string | null
  publishedAt: string | null
  linkedInPostUrn: string | null
  publishError: string | null
  publishAttempts: number
  createdAt: string
  updatedAt: string
  media: MediaAsset[]
}

export interface CaptionTemplate {
  id: string
  contentType: PostContentType
  title: string
  templateBody: string
  characterLimit: number | null
}

export interface LinkedInStatus {
  connected: boolean
  organizationName: string | null
  organizationUrn: string | null
  connectedByAdminEmail: string | null
  connectedAt: string | null
  accessTokenExpiresAt: string | null
  tokenExpired: boolean
}

export interface EngagementTarget {
  id: string
  name: string
  linkedInProfileUrl: string | null
  notes: string | null
  createdAt: string
  pendingTaskCount: number
}

export interface EngagementTask {
  id: string
  engagementTargetId: string
  targetName: string
  actionType: EngagementActionType
  status: EngagementTaskStatus
  sourcePostUrl: string | null
  suggestedText: string | null
  createdAt: string
  completedAt: string | null
}

export const CONTENT_TYPE_LABELS: Record<PostContentType, string> = {
  Text: 'Text / hiring post',
  Image: 'Single image',
  MultiImage: 'Multi-image album',
  Video: 'Video (reel)',
  Document: 'Document (carousel PDF)',
  ArticleLink: 'Article link share',
}

export const MEDIA_KIND_FOR_CONTENT_TYPE: Partial<Record<PostContentType, MediaKind>> = {
  Image: 'Image',
  MultiImage: 'Image',
  Video: 'Video',
  Document: 'Document',
}
