import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { mockPosts, scamCategories } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';
import { ReportDialog } from '../components/ReportDialog';
import { ShareDialog } from '../components/ShareDialog';
import { 
  ArrowLeft, 
  Heart, 
  MessageCircle, 
  Share2, 
  Send, 
  Flag,
  ThumbsUp,
  ChevronRight,
  Star
} from 'lucide-react';
import { Comment } from '../types';

/*************  ✨ Windsurf Command ⭐  *************/
/**
 * PostDetail component
 *
 * Displays a single post and its comments. Allows users to like, comment, and report the post.
 *
 * @param {string} id - The ID of the post to display.
 */
/*******  2af65171-5474-4d87-8b2b-b9018096e26d  *******/
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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

  const approvedPosts = mockPosts.filter(post => post.status === 'approved');

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

  const getReputationColor = (score: number) => {
    if (score >= 100) return '#22C55E';
    if (score >= 50) return '#F59E0B';
    return '#E01515';
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
            {/* <span
              className="text-xs font-semibold px-2 py-0.5 rounded"
              style={{
                backgroundColor: `${getReputationColor(comment.author.reputationScore)}15`,
                color: getReputationColor(comment.author.reputationScore),
              }}
            >
              {comment.author.reputationScore}
            </span> */}
            <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${post.author.reputationScore >= 50 ? 'text-white' : ''}`}
                style={{
                  backgroundColor: `${getReputationColor(post.author.reputationScore)}15`,
                  color: getReputationColor(post.author.reputationScore),
                }}
              >
                <Star className="h-4 w-4 fill-current" /> { /* Ngôi sao luôn hiện */ }
                <span className="text-sm font-semibold">
                  {post.author.reputationScore}
                </span>
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
        <aside className="w-[220px] shrink-0 bg-white border-r border-[#D1D5DC] min-h-screen sticky top-[70px] h-[calc(100vh-70px)] overflow-y-auto">
          <div className="p-4">
            <h2 className="font-semibold mb-4">Danh mục lừa đảo</h2>
            <div className="space-y-2">
              <Link
                to="/"
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] text-sm transition-colors hover:bg-gray-50`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-[8px] flex items-center justify-center text-white font-semibold text-xs"
                    style={{ backgroundColor: '#E01515' }}
                  >
                    {approvedPosts.length}
                  </div>
                  <span className="text-left">Tất cả</span>
                </div>
                <ChevronRight className="h-4 w-4 text-[#99A1AF]" />
              </Link>

              {scamCategories.map(category => {
                const categoryPostCount = approvedPosts.filter(p => p.category.id === category.id).length;
                return (
                  <Link
                    key={category.id}
                    to={`/?category=${category.id}`}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] text-sm transition-colors hover:bg-gray-50`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-[8px] flex items-center justify-center text-white font-semibold text-xs"
                        style={{ backgroundColor: '#E01515' }}
                      >
                        {categoryPostCount}
                      </div>
                      <span className="text-left text-xs">{category.name}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#99A1AF]" />
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
                  <div className="flex flex-col gap-1"> { /* Chuyển thành flex-col để xếp dọc và thêm khoảng cách */ }
                      { /* Hàng Tên tác giả và Điểm uy tín (vẫn giữ flex items-center) */ }
                      <div className="flex items-center gap-2">
                        <Link to={`/user/${post.author.id}`} className="font-semibold text-[#1E293B] hover:text-[#E01515] transition-colors">
                          {post.author.name}
                        </Link>
                        { /* Ngôi sao và điểm uy tín từ bước trước - giữ nguyên */ }
                        <div
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${post.author.reputationScore >= 50 ? 'text-white' : ''}`}
                          style={{
                            backgroundColor: '#FFE4E6'
                          }}
                        >
                          <Star className="h-4 w-4 fill-[#F59E0B] text-[#F59E0B]" />
                          <span className="text-[#881337]">
                            {post.author.reputationScore}
                          </span>
                        </div>
                      </div>
                      
                      { /* Ngày đăng - giữ nguyên và tự động xếp xuống dưới */ }
                      <p className="text-sm text-[#99A1AF]">
                        Đăng lúc {formatDate(post.createdAt)}
                      </p>
                    </div>
                </div>

                {user && (
                  <button
                    onClick={handleReportPost}
                    className="flex items-center gap-2 px-3 py-2 rounded-[8px] border border-[#E01515] text-[#E01515] hover:bg-[#FFF5F5] transition-colors"
                  >
                    <Flag className="h-4 w-4" />
                    Báo cáo
                  </button>
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
