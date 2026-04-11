import { Link } from 'react-router';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { ReportDialog } from './ReportDialog';
import { Post } from '../types';
import { Card, CardContent, CardFooter, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ThumbsUp, MessageCircle, Share2, AlertTriangle, Calendar, Bookmark, Flag, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ReputationBadge } from './ReputationBadge';

interface PostCardProps {
  post: Post;
  showStatus?: boolean;
  defaultSaved?: boolean;
}

export function PostCard({ post, showStatus = false, defaultSaved = false }: PostCardProps) {
  const { user } = useAuth();
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(defaultSaved);

  const handleReportClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Vui lòng đăng nhập để báo cáo bài viết');
      return;
    }
    setIsReportDialogOpen(true);
  };

  const handleReportSubmit = (reason: string) => {
    toast.success('Báo cáo đã được gửi. Chúng tôi sẽ xem xét trong thời gian sớm nhất.');
  };

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { 
    addSuffix: true,
    locale: vi 
  });

  return (
    <Card className="hover:shadow-md transition-shadow border-[#D1D5DC] rounded-[12px]">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Author Avatar - Clickable */}
          <Link to={`/user/${post.author.id}`}>
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
              style={{ backgroundColor: '#E01515' }}
            >
              {post.author.name.charAt(0)}
            </div>
          </Link>

          <div className="flex-1 min-w-0">
            {/* Header: Author Info & Report */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Link to={`/user/${post.author.id}`} className="hover:underline">
                  <span className="font-semibold text-sm">{post.author.name}</span>
                </Link>
                <div className="px-1.5 py-0.5 bg-[#FFE2E2] rounded flex items-center gap-1">
                  <span className="text-[#C10007] text-xs font-semibold">⭐ {post.author.reputationScore}</span>
                </div>
                <span className="text-gray-400">•</span>
                <span className="text-sm text-[#4A5565]">
                  {timeAgo}
                </span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white border border-[#D1D5DC] rounded-[8px] shadow-lg overflow-hidden p-1">
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.preventDefault();
                      setIsSaved(!isSaved);
                      if (!isSaved) toast.success('Đã lưu bài viết');
                    }}
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer outline-none hover:bg-slate-50 transition-colors"
                  >
                    <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-amber-500 text-amber-500' : 'text-gray-600'}`} />
                    <span className={`text-sm ${isSaved ? 'text-amber-600' : 'text-gray-700'}`}>
                      {isSaved ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleReportClick}
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer outline-none hover:bg-red-50 text-[#E01515] transition-colors"
                  >
                    <Flag className="h-4 w-4" />
                    <span className="text-sm">Báo cáo bài viết</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {post.category && (
              <div className="mb-2">
                <span className="inline-block px-2 py-0.5 border border-[#E01515] text-[#E01515] rounded-lg text-xs font-medium">
                  {post.category.name}
                </span>
              </div>
            )}

            {/* Post Title - Link to Post Detail */}
            <Link 
              to={`/post/${post.id}`}
              className="hover:underline block mb-2"
            >
              <h3 className="font-semibold text-base">{post.title}</h3>
            </Link>

            {/* Post Content */}
            <p className="text-gray-700 line-clamp-2 text-sm mb-3">
              {post.content}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1 text-gray-600 hover:text-red-600 transition-colors">
                <ThumbsUp className="h-4 w-4" />
                <span className="text-sm">{post.likes}</span>
              </button>
              <Link to={`/post/${post.id}`} className="flex items-center gap-1 text-gray-600 hover:text-[#E01515] transition-colors">
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm">{post.comments.length} bình luận</span>
              </Link>
              <button className="ml-auto flex items-center gap-2 text-[#99A1AF] hover:text-[#E01515] transition-colors">
                <Share2 className="h-4 w-4" />
                <span className="text-sm">Chia sẻ</span>
              </button>
            </div>

            {showStatus && (
              <div className="mt-4">
                <Badge 
                  variant={
                    post.status === 'approved' ? 'default' : 
                    post.status === 'pending' ? 'secondary' : 
                    'destructive'
                  }
                >
                  {post.status === 'approved' && 'Đã duyệt'}
                  {post.status === 'pending' && 'Chờ duyệt'}
                  {post.status === 'rejected' && 'Từ chối'}
                </Badge>
              </div>
            )}

            {post.isReported && (
              <div className="mt-4 flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">Bài viết có {post.reportCount} báo cáo</span>
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