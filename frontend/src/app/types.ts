export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BANNED';
export type PostStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type ReportStatus = 'PENDING' | 'PROCESSED' | 'DISMISSED';
export type ReactionType = 'UPVOTE' | 'DOWNVOTE';
export type TargetType = 'POST' | 'COMMENT';
export type MediaType = 'IMAGE' | 'VIDEO' | 'DOCUMENT';

export interface Role {
  id: number;
  role_name: string;
  description?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  status: UserStatus;
  reputation_score: number;
  role?: number;
  created_date: string;
  updated_date: string;
}

export interface ScamCategory {
  id: number;
  category_name: string;
  description?: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  created_time: string;
  updated_time: string;
  published_time?: string | null;
  status: PostStatus;
  user_detail: User;
  category_detail: ScamCategory | null;
  likes_count: number;
  comments_count: number;
}

export interface Comment {
  id: number;
  content: string;
  created_time: string;
  status: 'ACTIVE' | 'HIDDEN';
  user_detail: User;
  post: number;
  parent_comment?: number | null;
  replies?: Comment[];
}

export interface Bookmark {
  id: number;
  created_time: string;
  user: number;
  post_detail: Post;
  imageUrl?: string;
  createdAt: string;
  isReported?: boolean;
  replies?: Comment[];
  parentId?: string;
}

export interface Reaction {
  id: number;
  reaction_type: ReactionType;
  target_type: TargetType;
  target_id: number;
  created_time: string;
  user: number;
}

export interface ContentReport {
  id: number;
  reason: string;
  reported_time: string;
  processing_status: ReportStatus;
  target_type: TargetType;
  target_id: number;
  reporter_user_detail: User;
}

export interface Media {
  id: number;
  url: string;
  media_type: MediaType;
  created_time: string;
}

export interface Notification {
  id: number;
  content: string;
  is_read: boolean;
  created_time: string;
  user: number;
}

export interface ActivityLog {
  id: number;
  action: string;
  created_time: string;
  user: number;
}

export interface ReputationHistory {
  id: number;
  action_type: string;
  score_change: number;
  created_time: string;
  user: number;
}

export interface ReputationStat {
  user_id: number;
  current_score: number;
  total_gained: number;
  total_lost: number;
}