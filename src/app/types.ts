export type UserRole = 'guest' | 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  isLocked?: boolean;
  reputationScore: number; 
  violationCount: number; 
}

export type PostStatus = 'pending' | 'approved' | 'rejected';

export interface ScamCategory {
  id: string;
  name: string;
  description: string;
  color: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  category: ScamCategory;
  author: User;
  status: PostStatus;
  createdAt: string;
  updatedAt: string;
  likes: number;
  comments: Comment[];
  isReported?: boolean;
  reportCount?: number;
}

export interface Comment {
  id: string;
  postId: string;
  author: User;
  content: string;
  createdAt: string;
  isReported?: boolean;
  replies?: Comment[]; 
  parentId?: string; 
}

export interface Report {
  id: string;
  postId?: string;
  commentId?: string;
  reportedBy: User;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}