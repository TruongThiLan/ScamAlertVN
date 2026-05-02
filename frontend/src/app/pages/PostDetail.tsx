import { useState, useEffect, ChangeEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import api from '../../api/axiosInstance';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
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
  MoreHorizontal,
  Camera,
  X,
  AlertTriangle
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Comment } from '../types';
import { getCategoryBadgeStyle } from '../utils/colorUtils';
import { Avatar } from '../components/Avatar';
import { Lightbox } from '../components/Lightbox';
import { ReportDialog } from '../components/ReportDialog';
import { ShareDialog } from '../components/ShareDialog';

async function fetchAllResults<T>(url: string): Promise<T[]> {
  const items: T[] = [];
  let nextUrl: string | null = url;

  while (nextUrl) {
    const res = await api.get(nextUrl);
    const data = res.data;

    if (Array.isArray(data)) {
      items.push(...data);
      break;
    }

    items.push(...(Array.isArray(data?.results) ? data.results : []));
    nextUrl = data?.next ?? null;
  }

  return items;
}

const UNCATEGORIZED_CATEGORY_ID = 'uncategorized';

export function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [newComment, setNewComment] = useState('');
  const [newCommentImage, setNewCommentImage] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [likedComments, setLikedComments] = useState<Set<number>>(new Set());
  const [commentLikes, setCommentLikes] = useState<Record<number, number>>({});
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: 'post' | 'comment'; id: string } | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  
  // Lightbox state
  const [lightbox, setLightbox] = useState<{
    isOpen: boolean;
    images: string[];
    index: number;
  }>({ isOpen: false, images: [], index: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [postRes, allCategories, allPosts] = await Promise.all([
          api.get(`posts/${id}/`),
          fetchAllResults<any>('categories/'),
          fetchAllResults<any>('posts/')
        ]);
        
        const postData = postRes.data;
        setPost(postData);
        setLikesCount(postData.likes_count || 0);
        setIsLiked(postData.is_liked || false);
        setIsSaved(postData.is_bookmarked || false);
        const approvedPosts = allPosts.filter((item) => item.status === 'APPROVED');
        const uncategorizedCount = approvedPosts.filter(
          (item) => !item.category_detail && !item.category
        ).length;
        const categoriesWithPublicCounts = allCategories.map((category) => ({
          ...category,
          post_count: approvedPosts.filter(
            (item) => item.category_detail?.id === category.id || item.category === category.id
          ).length,
        }));
        if (uncategorizedCount > 0) {
          categoriesWithPublicCounts.push({
            id: UNCATEGORIZED_CATEGORY_ID,
            category_name: 'Chưa phân loại',
            post_count: uncategorizedCount,
          });
        }
        setCategories(categoriesWithPublicCounts);
        
        // Fetch comments
        const commentRes = await api.get('comments/', { params: { post: id } });
        const commentData = Array.isArray(commentRes.data) ? commentRes.data : (commentRes.data.results || []);
        setComments(commentData);
      } catch (err: any) {
        toast.error('Không thể tải dữ liệu bài viết');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();

    return () => {
      if (newCommentImage) {
        URL.revokeObjectURL(newCommentImage.previewUrl);
      }
    };
  }, [id, newCommentImage]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 text-[#E01515] animate-spin" />
        <p className="text-[#99A1AF] font-medium">Đang tải nội dung bài viết...</p>
      </div>
    );
  }

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

  const maxCategoryCount = Math.max(...categories.map(c => c.post_count || 0), 1);
  const shouldMaskPostAuthor = Boolean(post.is_anonymous && !post.user_detail?.id);

  const handleAddComment = async () => {
    // Sửa lỗi logic: Kiểm tra an toàn xem có gửi chữ hoặc ảnh hay không
    const hasText = newComment.trim().length > 0;
    const hasImage = newCommentImage !== null && newCommentImage.file !== undefined;

    if ((!hasText && !hasImage) || !user) return;

    try {
      const formData = new FormData();
      formData.append('post', post.id.toString());

      // Nếu chỉ có ảnh, gửi chuỗi mặc định
      formData.append('content', hasText ? newComment.trim() : '[Hình ảnh đính kèm]');

      // Nếu có ảnh, đính kèm một cách an toàn
      if (hasImage) {
        formData.append('attachments', newCommentImage.file);
      }

      // BẮT BUỘC: Ép Axios gửi dưới định dạng file (tránh bị lỗi mất ảnh)
      await api.post('comments/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Lấy danh sách bình luận mới từ DB để render cả ảnh
      const commentRes = await api.get('comments/', { params: { post: post.id } });
      const commentData = Array.isArray(commentRes.data) ? commentRes.data : (commentRes.data.results || []);
      setComments(commentData);

      // Reset form
      setNewComment('');
      setNewCommentImage(null);
      toast.success('Đã gửi bình luận');
    } catch (err: any) {
      toast.error('Không thể gửi bình luận');
      console.error('Chi tiết lỗi:', err);
    }
  };

  const handleCommentImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const target = e.target;
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

//     // Cần lưu giữ trực tiếp đối tượng selectedFile (File gốc)
//     newCommentImage.value = {
//       file: selectedFile,
//       previewUrl: URL.createObjectURL(selectedFile)
//     };

      // Reset input
//     target.value = '';
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Chỉ hỗ trợ tệp ảnh cho bình luận.');
      target.value = '';
      return;
    }

    if (newCommentImage) {
      URL.revokeObjectURL(newCommentImage.previewUrl);
    }

    const previewUrl = URL.createObjectURL(selectedFile);
    setNewCommentImage({ file: selectedFile, previewUrl });
    target.value = '';
  };

  const removeCommentImage = () => {
    if (newCommentImage) {
      URL.revokeObjectURL(newCommentImage.previewUrl);
    }
    setNewCommentImage(null);
  };

  const handleAddReply = async (parentId: string | number) => {
    if (!replyText.trim() || !user) return;

    try {
      const res = await api.post('comments/', {
        content: replyText,
        post: post.id,
        parent_comment: parentId
      });

      setComments(prevComments => {
        return prevComments.map(comment => {
          if (comment.id === Number(parentId)) {
            return {
              ...comment,
              replies: [...(comment.replies || []), res.data],
            };
          }
          return comment;
        });
      });

      setReplyText('');
      setReplyTo(null);
      toast.success('Đã gửi phản hồi');
    } catch (err) {
      toast.error('Không thể gửi phản hồi');
    }
  };

  const handleLikeComment = async (commentId: string | number) => {
    if (!user) return;

    try {
      const res = await api.post('reactions/toggle/', {
        target_type: 'COMMENT',
        target_id: commentId,
        reaction_type: 'UPVOTE'
      });

      const isReacted = res.data.status === 'reacted';
      const newLikedComments = new Set(likedComments);
      
      if (isReacted) {
        newLikedComments.add(Number(commentId));
        setCommentLikes(prev => ({ ...prev, [Number(commentId)]: (prev[Number(commentId)] || 0) + 1 }));
      } else {
        newLikedComments.delete(Number(commentId));
        setCommentLikes(prev => ({ ...prev, [Number(commentId)]: (prev[Number(commentId)] || 0) - 1 }));
      }
      setLikedComments(newLikedComments);
    } catch (err) {
      toast.error('Lỗi khi thực hiện thích bình luận');
    }
  };

  const handleReportPost = () => {
    setReportTarget({ type: 'post', id: post.id });
    setIsReportDialogOpen(true);
  };

  const handleReportComment = (commentId: number) => {
    setReportTarget({ type: 'comment', id: String(commentId) });
    setIsReportDialogOpen(true);
  };

  const handleSubmitReport = async (reason: string) => {
    if (!reportTarget) return;

    try {
      await api.post('reports/', {
        target_type: reportTarget.type.toUpperCase(),
        target_id: reportTarget.id,
        reason: reason
      });
      toast.success('Báo cáo đã được gửi. Chúng tôi sẽ xem xét sớm nhất.');
      setIsReportDialogOpen(false);
      setReportTarget(null);
    } catch (err) {
      toast.error('Không thể gửi báo cáo');
    }
  };

  const handleLikePost = async () => {
    if (!user) return;
    
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

  const renderComment = (comment: Comment, isReply = false) => {
    const shouldMaskCommentAuthor = Boolean(comment.is_anonymous && !comment.user_detail?.id);

    return (
    <div key={comment.id} className={`${isReply ? 'ml-14' : ''}`}>
      <div className="flex gap-3">
        {shouldMaskCommentAuthor ? (
          <div className="flex-shrink-0 cursor-default">
            <Avatar name="?" size="md" className="grayscale" />
          </div>
        ) : (
          <Link to={`/user/${comment.user_detail.id}`} className="flex-shrink-0">
            <Avatar name={comment.user_detail.username} size="md" />
          </Link>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {shouldMaskCommentAuthor ? (
              <span className="font-semibold text-[#1E293B] italic text-gray-500">
                {comment.user_detail.username}
              </span>
            ) : (
              <>
                <Link to={`/user/${comment.user_detail.id}`} className="font-semibold text-[#1E293B] hover:text-[#E01515] transition-colors">
                  {comment.user_detail.username}
                </Link>

                <div className="px-1.5 py-0.5 bg-[#FFE2E2] rounded flex items-center gap-1">
                  <span className="text-[#C10007] text-xs font-semibold">⭐ {comment.user_detail.reputation_score}</span>
                </div>
              </>
            )}
              
            <span className="text-sm text-[#99A1AF]">
              • {formatDistanceToNow(new Date(comment.created_time), { addSuffix: true, locale: vi })}
            </span>
          </div>
          {comment.content && comment.content !== '[Hình ảnh đính kèm]' && (<p className="text-[#4A5565] mb-2">{comment.content}</p>)}
          {comment.images && comment.images.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {comment.images.map((img: string, idx: number) => {
                const src = img.startsWith('http') ? img : `http://127.0.0.1:8000${img}`;
                return (
                  <img
                    key={idx}
                    src={src}
                    alt="Ảnh bình luận"
                    className="max-h-32 w-auto rounded-lg border border-[#D1D5DC] object-cover cursor-zoom-in hover:opacity-90 transition-opacity"
                    onClick={() => setLightbox({
                      isOpen: true,
                      images: comment.images.map((u: string) => u.startsWith('http') ? u : `http://127.0.0.1:8000${u}`),
                      index: idx
                    })}
                  />
                );
              })}
            </div>
          )}
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
              <Heart className={`h-4 w-4 ${likedComments.has(comment.id) ? 'fill-current' : ''}`} />
              <span>{commentLikes[comment.id] || 0} </span>
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
              <span>
                {comment.replies && comment.replies.length > 0
                  ? `${comment.replies.length} Phản hồi`
                  : 'Phản hồi'}
              </span>
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
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="flex">
        {/* Sidebar - Categories */}
        <aside className="w-[320px] shrink-0 bg-white border-r border-[#D1D5DC] min-h-[calc(100vh-70px)] sticky top-[70px] h-[calc(100vh-70px)] overflow-y-auto">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-6 text-[#111827]">
              Danh mục lừa đảo
            </h2>

            <div className="space-y-3">
              <Link
                to="/"
                className={`group w-full flex items-center justify-between px-3 py-2 rounded-[10px] text-base border transition-all duration-200 bg-white border-transparent hover:bg-[#FFF5F5] hover:border-[#FFD6D6]`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-[12px] flex items-center justify-center font-semibold text-sm shrink-0 bg-[#F3F4F6] text-[#64748B] group-hover:bg-[#FEE2E2] group-hover:text-[#E01515]">
                    {categories.reduce((acc, c) => acc + (c.post_count || 0), 0)}
                  </div>

                  <span className="text-[#111827] group-hover:text-[#E01515] font-medium">
                    Tất cả
                  </span>
                </div>

                <ChevronRight className="h-5 w-5 text-[#99A1AF] group-hover:text-[#E01515]" />
              </Link>

              {/* Các danh mục */}
              {categories.map((category) => {
                const isActive = category.id === UNCATEGORIZED_CATEGORY_ID
                  ? !post.category_detail && !post.category
                  : String(category.id) === String(post.category ?? post.category_detail?.id);
                return (
                  <Link
                    key={category.id}
                    to={`/?category=${category.id}`}
                    className={`group w-full flex items-center justify-between px-3 py-2 rounded-[10px] text-base border transition-all duration-200 ${
                      isActive
                        ? 'bg-[#FFF1F1] border-[#F7BABA]'
                        : 'bg-white border-transparent hover:bg-[#FFF5F5] hover:border-[#FFD6D6]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-[12px] flex items-center justify-center font-semibold text-sm shrink-0 transition-all duration-200 ${
                          isActive
                            ? 'bg-[#E01515] text-white'
                            : 'bg-[#F3F4F6] text-[#64748B] group-hover:bg-[#FEE2E2] group-hover:text-[#E01515]'
                        }`}
                      >
                        {category.post_count || 0}
                      </div>

                      <span
                        className={`text-left font-medium transition-colors duration-200 ${
                          isActive
                            ? 'text-[#E01515] font-semibold'
                            : 'text-[#111827] group-hover:text-[#E01515]'
                        }`}
                      >
                        {category.category_name}
                      </span>
                    </div>

                    <ChevronRight
                      className={`h-5 w-5 shrink-0 transition-colors duration-200 ${
                        isActive
                          ? 'text-[#E01515]'
                          : 'text-[#99A1AF] group-hover:text-[#E01515]'
                      }`}
                    />
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
                  {shouldMaskPostAuthor ? (
                    <Avatar name="?" size="lg" className="grayscale" />
                  ) : (
                    <Link to={`/user/${post.user_detail?.id}`}>
                      <Avatar name={post.user_detail?.username || 'U'} size="lg" />
                    </Link>
                  )}
                  <div className="flex flex-col gap-1"> 
                      <div className="flex items-center gap-2">
                        {shouldMaskPostAuthor ? (
                          <span className="font-semibold text-[#1E293B] italic text-gray-500">Người dùng ẩn danh {post.user}</span>
                        ) : (
                          <Link to={`/user/${post.user_detail?.id}`} className="font-semibold text-[#1E293B] hover:text-[#E01515] transition-colors">
                            {post.user_detail?.username}
                          </Link>
                        )}
                        {!shouldMaskPostAuthor && (
                          <div className="px-1.5 py-0.5 bg-[#FFE2E2] rounded flex items-center gap-1">
                            <span className="text-[#C10007] text-xs font-semibold">⭐ {post.user_detail?.reputation_score || 0}</span>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-sm text-[#99A1AF]">
                        Đăng lúc {formatDistanceToNow(new Date(post.created_time), { addSuffix: true, locale: vi })}
                      </p>
                    </div>
                </div>

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
                        if (!user) {
                          toast.error('Vui lòng đăng nhập để lưu bài viết');
                          return;
                        }
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
                
                {!user && (
                   <div className="flex-1 flex justify-end">
                      <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 flex items-center gap-2 text-xs text-amber-700">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>Đăng nhập để tương tác</span>
                      </div>
                   </div>
                )}
              </div>

              {/* Category Tag */}
              <div className="mb-4">
                <span className="inline-block px-3 py-1 rounded-full border border-[#E01515] text-[#E01515] text-sm">
                  {post.category_detail?.category_name}
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

              {/* Post Images */}
              {post.images && post.images.length > 0 && (
                <div className={`mb-6 grid gap-2 ${
                  post.images.length === 1 ? 'grid-cols-1' :
                  post.images.length === 2 ? 'grid-cols-2' :
                  'grid-cols-2 sm:grid-cols-3'
                }`}>
                  {post.images.slice(0, 6).map((img: string, idx: number) => {
                    const src = img.startsWith('http') ? img : `http://127.0.0.1:8000${img}`;
                    return (
                    <div 
                      key={idx} 
                      className={`relative rounded-[12px] overflow-hidden border border-[#D1D5DC] cursor-zoom-in group aspect-square`}
                      onClick={() => setLightbox({ isOpen: true, images: post.images.map((u: string) => u.startsWith('http') ? u : `http://127.0.0.1:8000${u}`), index: idx })}
                    >
                      <img 
                        src={src} 
                        alt={`Attachment ${idx + 1}`} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                      />
                      {idx === 5 && post.images && post.images.length > 6 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-2xl font-bold">
                          +{post.images.length - 6}
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
              )}

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
                  className="ml-auto flex items-center gap-2 text-[#99A1AF] hover:text-[#E01515] transition-colors"
                >
                  <Share2 className="h-5 w-5" />
                  <span>Chia sẻ</span>
                </button>
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-white rounded-[10px] border border-[#D1D5DC] p-6">
              <h2 className="text-lg font-semibold mb-4">Bình luận</h2>

              {/* Add Comment */}
              {user ? (
                <div className="mb-6">
                  <div className="rounded-xl border border-[#D1D5DC] bg-[#FAFAFB] p-4">
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
                        className="w-full rounded-[10px] border border-[#D1D5DC] bg-white px-4 py-3 pr-24 focus:outline-none focus:border-[#E01515] transition-colors"
                      />
                      <label
                        title="Thêm 1 ảnh hoặc thêm 1 video"
                        className="absolute right-12 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#99A1AF] hover:text-[#E01515] transition-colors"
                      >
                        <Camera className="h-4.5 w-4.5" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleCommentImageChange}
                        />
                      </label>
                      <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim() && !newCommentImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#E01515] hover:bg-[#C10007] disabled:bg-gray-300 flex items-center justify-center transition-colors"
                      >
                        <Send className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  </div>

                  {newCommentImage && (
                    <div className="mt-3 relative w-fit">
                      <img
                        src={newCommentImage.previewUrl}
                        alt="Ảnh xem trước"
                        className="max-h-52 w-auto max-w-full rounded-lg border border-[#D1D5DC] object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeCommentImage}
                        className="absolute -right-2 -top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#111827] text-white hover:bg-[#E01515] transition-colors"
                        aria-label="Xóa ảnh"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
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
                  comments.filter(comment => !comment.parent_comment).map((comment) => (
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

      {/* Lightbox */}
      <Lightbox 
        images={lightbox.images}
        isOpen={lightbox.isOpen}
        initialIndex={lightbox.index}
        onClose={() => setLightbox({ ...lightbox, isOpen: false })}
      />
    </div>
  );
}
