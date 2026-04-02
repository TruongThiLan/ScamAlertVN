import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { mockPosts, scamCategories } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import { ReportDialog } from '../components/ReportDialog';
import { ShareDialog } from '../components/ShareDialog';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Heart, 
  MessageCircle, 
  Share2, 
  Send, 
  Flag,
  ThumbsUp,
  ChevronRight,
  Star,
  Bookmark,
  MoreHorizontal
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Comment } from '../types';
import { getCategoryBadgeStyle } from '../utils/colorUtils';

export function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const post = mockPosts.find(p => p.id === id);
  const [comments, setComments] = useState<Comment[]>(post?.comments || []);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [commentLikes, setCommentLikes] = useState<Record<string, number>>({});
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: 'post' | 'comment'; id: string } | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post?.likes || 0);
  const [isSaved, setIsSaved] = useState(false);

  if (!post) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Không tìm thấy bài viết</h2>
          <button
            onClick={() => navigate('/')}
            className="text-[#E01515] hover:underline"
          >
            Quay về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const approvedPosts = mockPosts.filter(p => p.status === 'approved');
  
  const categoryCounts = scamCategories.map(c => approvedPosts.filter(p => p.category.id === c.id).length);
  const maxCategoryCount = Math.max(...categoryCounts, 1);

  const handleAddComment = () => {
    if (!newComment.trim() || !user) return;

    const comment: Comment = {
      id: `c${Date.now()}`,
      postId: post.id,
      author: user,
      content: newComment,
      createdAt: new Date().toISOString(),
      replies: [],
    };

    setComments([...comments, comment]);
    setNewComment('');
  };

  const handleAddReply = (parentId: string) => {
    if (!replyText.trim() || !user) return;

    const reply: Comment = {
      id: `r${Date.now()}`,
      postId: post.id,
      author: user,
      content: replyText,
      createdAt: new Date().toISOString(),
      parentId,
    };

    setComments(prevComments => {
      return prevComments.map(comment => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), reply],
          };
        }
        return comment;
      });
    });

    setReplyText('');
    setReplyTo(null);
  };

  const handleLikeComment = (commentId: string) => {
    if (!user) return;

    const newLikedComments = new Set(likedComments);
    if (newLikedComments.has(commentId)) {
      newLikedComments.delete(commentId);
      setCommentLikes({
        ...commentLikes,
        [commentId]: (commentLikes[commentId] || 0) - 1,
      });
    } else {
      newLikedComments.add(commentId);
      setCommentLikes({
        ...commentLikes,
        [commentId]: (commentLikes[commentId] || 0) + 1,
      });
    }
    setLikedComments(newLikedComments);
  };

  const handleReportPost = () => {
    setReportTarget({ type: 'post', id: post.id });
    setIsReportDialogOpen(true);
  };

  const handleReportComment = (commentId: string) => {
    setReportTarget({ type: 'comment', id: commentId });
    setIsReportDialogOpen(true);
  };

  const handleSubmitReport = (reason: string) => {
    console.log('Report submitted:', { target: reportTarget, reason });
    alert('Báo cáo đã được gửi. Chúng tôi sẽ xem xét trong thời gian sớm nhất.');
  };

  const handleLikePost = () => {
    if (!user) return;
    
    if (isLiked) {
      setIsLiked(false);
      setLikesCount(likesCount - 1);
    } else {
      setIsLiked(true);
      setLikesCount(likesCount + 1);
    }
  };

  const handleShare = () => {
    setIsShareDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-14' : ''}`}>
      <div className="flex gap-3">
        <Link to={`/user/${comment.author.id}`} className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-[#E01515] flex items-center justify-center text-white font-semibold">
            {comment.author.name.charAt(0)}
          </div>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Link to={`/user/${comment.author.id}`} className="font-semibold text-[#1E293B] hover:text-[#E01515] transition-colors">
              {comment.author.name}
            </Link>
                      
            <div className="px-1.5 py-0.5 bg-[#FFE2E2] rounded flex items-center gap-1">
              <span className="text-[#C10007] text-xs font-semibold">⭐ {comment.author.reputationScore}</span>
            </div>
              
            <span className="text-sm text-[#99A1AF]">
              • 5 giờ trước
            </span>
          </div>
          <p className="text-[#4A5565] mb-2">{comment.content}</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleLikeComment(comment.id)}
              disabled={!user}
              className={`flex items-center gap-1 text-sm transition-colors ${
                !user
                  ? 'text-[#99A1AF] cursor-not-allowed opacity-50'
                  : likedComments.has(comment.id)
                    ? 'text-[#E01515]'
                    : 'text-[#99A1AF] hover:text-[#E01515]'
              }`}
              title={!user ? 'Vui lòng đăng nhập để thích bình luận' : ''}
            >
              <ThumbsUp className={`h-4 w-4 ${likedComments.has(comment.id) ? 'fill-current' : ''}`} />
              <span>{commentLikes[comment.id] || 0} Thích</span>
            </button>
            <button 
              onClick={() => setReplyTo(comment.id)}
              disabled={!user}
              className={`flex items-center gap-1 text-sm transition-colors ${
                !user 
                  ? 'text-[#99A1AF] cursor-not-allowed opacity-50' 
                  : 'text-[#99A1AF] hover:text-[#E01515]'
              }`}
              title={!user ? 'Vui lòng đăng nhập để phản hồi' : ''}
            >
              <MessageCircle className="h-4 w-4" />
              <span>Phản hồi</span>
            </button>
            {user && (
              <button
                onClick={() => handleReportComment(comment.id)}
                className="flex items-center gap-1 text-sm text-[#99A1AF] hover:text-[#E01515] transition-colors"
              >
                <Flag className="h-4 w-4" />
                <span>Báo cáo</span>
              </button>
            )}
          </div>

          {/* Reply Input */}
          {replyTo === comment.id && user && (
            <div className="mt-3 relative">
              <input
                type="text"
                placeholder="Viết phản hồi..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddReply(comment.id);
                  }
                }}
                className="w-full px-4 py-2 pr-12 rounded-[10px] bg-[#F3F3F5] border border-[#D1D5DC] focus:outline-none focus:border-[#E01515] transition-colors text-sm"
              />
              <button
                onClick={() => handleAddReply(comment.id)}
                disabled={!replyText.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#E01515] hover:bg-[#C10007] disabled:bg-gray-300 flex items-center justify-center transition-colors"
              >
                <Send className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
          )}

          {/* Nested Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map(reply => renderComment(reply, true))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="flex">
        
        {/* Sidebar - Categories */}
        <aside className="w-[320px] shrink-0 bg-white border-r border-[#D1D5DC] min-h-screen sticky top-[70px] h-[calc(100vh-70px)] overflow-y-auto">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-6">Danh mục lừa đảo</h2>
            <div className="space-y-2">
              <Link
                to="/"
                className="w-full flex items-center justify-between px-3 py-3 rounded-[10px] text-base transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center font-semibold text-sm"
                    style={getCategoryBadgeStyle(approvedPosts.length, maxCategoryCount)}
                  >
                    {approvedPosts.length}
                  </div>
                  <span className="text-left">Tất cả</span>
                </div>
                <ChevronRight className="h-5 w-5 text-[#99A1AF]" />
              </Link>

              {scamCategories.map(category => {
                const categoryPostCount = approvedPosts.filter(p => p.category.id === category.id).length;
                
                // Kiểm tra xem bài viết đang xem có thuộc danh mục này không
                const isActive = category.id === post.category.id;

                return (
                  <Link
                    key={category.id}
                    to={`/?category=${category.id}`}
                    // Thêm nền xám và chữ in đậm nếu trùng khớp danh mục
                    className={`w-full flex items-center justify-between px-3 py-3 rounded-[10px] text-base transition-colors ${
                      isActive 
                        ? 'bg-gray-100 font-semibold' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-[10px] flex items-center justify-center font-semibold text-sm"
                        style={getCategoryBadgeStyle(categoryPostCount, maxCategoryCount)}
                      >
                        {categoryPostCount}
                      </div>
                      <span className="text-left">{category.name}</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-[#99A1AF]" />
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-8 py-8">
          <div className="max-w-[900px] ml-24">
            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-[#4A5565] hover:text-[#E01515] mb-6 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Quay lại</span>
            </button>

            {/* Post Card */}
            <div className="bg-white rounded-[10px] border border-[#D1D5DC] p-6 mb-4">
              {/* Author Info */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Link to={`/user/${post.author.id}`} className="w-12 h-12 rounded-full bg-[#E01515] flex items-center justify-center text-white font-semibold text-lg">
                    {post.author.name.charAt(0)}
                  </Link>
                  <div className="flex flex-col gap-1"> 
                      { /* Hàng Tên tác giả và Điểm uy tín */ }
                      <div className="flex items-center gap-2">
                        <Link to={`/user/${post.author.id}`} className="font-semibold text-[#1E293B] hover:text-[#E01515] transition-colors">
                          {post.author.name}
                        </Link>
                          <div className="px-1.5 py-0.5 bg-[#FFE2E2] rounded flex items-center gap-1">
                            <span className="text-[#C10007] text-xs font-semibold">⭐ {post.author.reputationScore}</span>
                          </div>
                      </div>
                      
                      { /* Ngày đăng */ }
                      <p className="text-sm text-[#99A1AF]">
                        Đăng lúc {formatDate(post.createdAt)}
                      </p>
                    </div>
                </div>

                {user && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none">
                        <MoreHorizontal className="h-6 w-6" />
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
                        onClick={handleReportPost}
                        className="flex items-center gap-2 px-3 py-2 cursor-pointer outline-none hover:bg-red-50 text-[#E01515] transition-colors"
                      >
                        <Flag className="h-4 w-4" />
                        <span className="text-sm">Báo cáo bài viết</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Category Tag */}
              <div className="mb-4">
                <span className="inline-block px-3 py-1 rounded-full border border-[#E01515] text-[#E01515] text-sm">
                  {post.category.name}
                </span>
              </div>

              {/* Post Title */}
              <h1 className="text-2xl font-semibold text-[#1E293B] mb-4">
                {post.title}
              </h1>

              {/* Post Content */}
              <div className="text-[#4A5565] whitespace-pre-wrap mb-6">
                {post.content}
              </div>

              {/* Post Stats */}
              <div className="flex items-center gap-6 pt-4 border-t border-[#D1D5DC]">
                <button
                  onClick={handleLikePost}
                  disabled={!user}
                  className={`flex items-center gap-2 transition-colors ${
                    !user 
                      ? 'text-[#99A1AF] cursor-not-allowed opacity-50' 
                      : isLiked 
                        ? 'text-[#E01515]' 
                        : 'text-[#99A1AF] hover:text-[#E01515]'
                  }`}
                  title={!user ? 'Vui lòng đăng nhập để thích bài viết' : ''}
                >
                  <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{likesCount}</span>
                </button>
                <div className="flex items-center gap-2 text-[#99A1AF]">
                  <MessageCircle className="h-5 w-5" />
                  <span>{comments.length} bình luận</span>
                </div>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 text-[#99A1AF] hover:text-[#E01515] transition-colors"
                >
                  <Share2 className="h-5 w-5" />
                  <span>28 chia sẻ</span>
                </button>
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-white rounded-[10px] border border-[#D1D5DC] p-6">
              <h2 className="text-lg font-semibold mb-4">Bình luận</h2>

              {/* Add Comment */}
              {user ? (
                <div className="mb-6">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Viết bình luận của bạn..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment();
                        }
                      }}
                      className="w-full px-4 py-3 pr-12 rounded-[10px] bg-[#F3F3F5] border border-[#D1D5DC] focus:outline-none focus:border-[#E01515] transition-colors"
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#E01515] hover:bg-[#C10007] disabled:bg-gray-300 flex items-center justify-center transition-colors"
                    >
                      <Send className="h-4 w-4 text-white" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-6 p-4 bg-[#F3F3F5] rounded-[10px] text-center text-[#99A1AF]">
                  Vui lòng đăng nhập để có thể bình luận bài viết
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-6">
                {comments.length === 0 ? (
                  <p className="text-center text-[#99A1AF] py-8">Chưa có bình luận nào</p>
                ) : (
                  comments.filter(comment => !comment.parentId).map((comment) => (
                    <div key={comment.id} className="border-b border-[#D1D5DC] pb-6 last:border-0 last:pb-0">
                      {renderComment(comment)}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Report Dialog */}
      <ReportDialog
        isOpen={isReportDialogOpen}
        onClose={() => {
          setIsReportDialogOpen(false);
          setReportTarget(null);
        }}
        onSubmit={handleSubmitReport}
        title={reportTarget?.type === 'post' ? 'Báo cáo bài viết' : 'Báo cáo bình luận'}
      />

      {/* Share Dialog */}
      <ShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        postId={post.id}
      />
    </div>
  );
}