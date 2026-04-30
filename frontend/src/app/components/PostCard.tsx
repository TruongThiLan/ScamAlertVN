import { Link } from 'react-router';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import api from '../../api/axiosInstance';
import { ReportDialog } from './ReportDialog';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Heart, MessageCircle, Share2, AlertTriangle, Bookmark, Flag, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Avatar } from './Avatar';

interface PostCardProps {
  post: any;
  showStatus?: boolean;
  defaultSaved?: boolean;
}

export function PostCard({ post, showStatus = false, defaultSaved = false }: PostCardProps) {
  const { user } = useAuth();
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(defaultSaved);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [isLiked, setIsLiked] = useState(post.is_liked || false);

  const handleReportClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Vui lòng đăng nhập để báo cáo bài viết');
      return;
    }
    setIsReportDialogOpen(true);
  };

  const handleReportSubmit = async (reason: string) => {
    try {
      await api.post('reports/', {
        target_type: 'POST',
        target_id: post.id,
        reason: reason
      });
      toast.success('Báo cáo đã được gửi. Chúng tôi sẽ xem xét trong thời gian sớm nhất.');
      setIsReportDialogOpen(false);
    } catch (err) {
      toast.error('Không thể gửi báo cáo');
    }
  };

  const handleLikePost = async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) {
      toast.error('Vui lòng đăng nhập để thích bài viết');
      return;
    }

    try {
      const res = await api.post('reactions/toggle/', {
        target_type: 'POST',
        target_id: post.id,
        reaction_type: 'UPVOTE'
      });

      const isReacted = res.data.status === 'reacted';
      setIsLiked(isReacted);
      setLikesCount(isReacted ? likesCount + 1 : likesCount - 1);
    } catch (err) {
      toast.error('Lỗi khi thực hiện thích bài viết');
    }
  };

  const timeAgo = post.created_time
    ? formatDistanceToNow(new Date(post.created_time), { addSuffix: true, locale: vi })
    : 'Vừa xong';

  return (
    <Card className="hover:shadow-md transition-shadow border-[#D1D5DC] rounded-[12px] mb-4">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {post.is_anonymous ? (
            <Avatar
              name="?"
              size="lg"
              className="shadow-sm grayscale"
            />
          ) : (
            <Link to={`/user/${post.user_detail?.id}`}>
              <Avatar
                name={post.user_detail?.username || 'U'}
                size="lg"
                className="hover:opacity-80 transition-opacity cursor-pointer shadow-sm"
              />
            </Link>
          )}

          <div className="flex-1 min-w-0">
            {/* Header: Author Info & Actions */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                {post.is_anonymous ? (
                  <span className="font-semibold text-sm text-gray-500 italic">
                    {post.user_detail?.username || 'Người dùng ẩn danh'}
                  </span>
                ) : (
                  <Link to={`/user/${post.user_detail?.id}`} className="hover:underline">
                    <span className="font-semibold text-sm">{post.user_detail?.username}</span>
                  </Link>
                )}
                {!post.is_anonymous && post.user_detail?.reputation_score !== undefined && (
                  <div className="px-1.5 py-0.5 bg-[#FFE2E2] rounded flex items-center gap-1">
                    <span className="text-[#C10007] text-xs font-semibold">
                      ⭐ {post.user_detail.reputation_score}
                    </span>
                  </div>
                )}

                <span className="text-gray-400">•</span>
                <span className="text-sm text-[#4A5565]">{timeAgo}</span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white border border-[#D1D5DC] rounded-[8px] shadow-lg p-1">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      if (!user) {
                        toast.error('Vui lòng đăng nhập để lưu bài viết');
                        return;
                      }
                      setIsSaved(!isSaved);
                      if (!isSaved) toast.success('Đã lưu bài viết');
                    }}
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-50 outline-none"
                  >
                    <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-amber-500 text-amber-500' : 'text-gray-600'}`} />
                    <span className={`text-sm ${isSaved ? 'text-amber-600' : 'text-gray-700'}`}>
                      {isSaved ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleReportClick}
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-red-50 text-[#E01515] outline-none"
                  >
                    <Flag className="h-4 w-4" />
                    <span className="text-sm">Báo cáo bài viết</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Danh mục: category -> category_detail */}
            {post.category_detail && (
              <div className="mb-2">
                <span className="inline-block px-2 py-0.5 border border-[#E01515] text-[#E01515] rounded-lg text-xs font-medium">
                  {post.category_detail.category_name}
                </span>
              </div>
            )}

            {/* Post Title */}
            <Link to={`/post/${post.id}`} className="hover:underline block mb-2">
              <h3 className="font-semibold text-base">{post.title}</h3>
            </Link>

            {/* Post Content */}
            <p className="text-gray-700 line-clamp-2 text-sm mb-3">
              {post.content}
            </p>

            {/* Actions: likes -> likes_count, comments -> comments_count */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleLikePost}
                className={`flex items-center gap-1 transition-colors ${isLiked ? 'text-[#E01515]' : 'text-gray-600 hover:text-red-600'}`}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                <span className="text-sm">{likesCount}</span>
              </button>
              <Link to={`/post/${post.id}`} className="flex items-center gap-1 text-gray-600 hover:text-[#E01515] transition-colors">
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm">{post.comments_count || 0} bình luận</span>
              </Link>
              <button className="ml-auto flex items-center gap-2 text-[#99A1AF] hover:text-[#E01515] transition-colors">
                <Share2 className="h-4 w-4" />
                <span className="text-sm">Chia sẻ</span>
              </button>
            </div>

            {/* Status Badge */}
            {showStatus && (
              <div className="mt-4">
                <Badge
                  variant={
                    post.status === 'APPROVED' ? 'default' :
                      post.status === 'PENDING' ? 'secondary' :
                        'destructive'
                  }
                >
                  {post.status === 'APPROVED' && 'Đã duyệt'}
                  {post.status === 'PENDING' && 'Chờ duyệt'}
                  {post.status === 'REJECTED' && 'Từ chối'}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      <ReportDialog
        isOpen={isReportDialogOpen}
        onClose={() => setIsReportDialogOpen(false)}
        onSubmit={handleReportSubmit}
        title="Báo cáo bài viết"
      />
    </Card>
  );
}