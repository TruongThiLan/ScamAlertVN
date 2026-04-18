import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeft, MessageCircle, Send, Share2 } from 'lucide-react';
import publicApi from '../../api/publicApi';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';

type PublicPost = {
  id: number;
  title: string;
  content: string;
  created_time: string;
  published_time?: string | null;
  comments_count?: number;
  user_detail?: {
    id: number;
    username: string;
    reputation_score?: number;
  };
  category_detail?: {
    id: number;
    category_name: string;
  } | null;
};

type PublicComment = {
  id: number;
  content: string;
  created_time: string;
  post: number;
  parent_comment?: number | null;
  user_detail?: {
    id: number;
    username: string;
    reputation_score?: number;
  };
};

const getResults = <T,>(payload: T[] | { results?: T[] }) => {
  return Array.isArray(payload) ? payload : payload.results ?? [];
};

const formatDate = (dateString?: string | null) => {
  if (!dateString) return 'Dang cap nhat';
  return new Date(dateString).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export function PostDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [post, setPost] = useState<PublicPost | null>(null);
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const topLevelComments = useMemo(() => {
    return comments.filter((comment) => !comment.parent_comment);
  }, [comments]);

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();

    const fetchPublicPostDetail = async () => {
      setLoading(true);
      setError('');

      try {
        // Lay chi tiet bai viet public bang axios khong co Authorization header.
        const [postResponse, commentResponse] = await Promise.all([
          publicApi.get<PublicPost>(`public/posts/${id}/`, { signal: controller.signal }),
          publicApi.get<PublicComment[] | { results?: PublicComment[] }>('public/comments/', {
            params: { post: id },
            signal: controller.signal,
          }),
        ]);

        setPost(postResponse.data);
        setComments(getResults(commentResponse.data));
      } catch (err: any) {
        if (err.name !== 'CanceledError') {
          setError('Khong the tai bai viet. Bai viet co the khong ton tai hoac chua duoc duyet.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchPublicPostDetail();
    return () => controller.abort();
  }, [id]);

  const handleSubmitComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAuthenticated || !newComment.trim() || !post) return;

    // Khu vuc nay danh cho luong tao comment co token sau nay.
    // Hien tai them tam vao UI de nguoi da dang nhap thay duoc phan hoi vua nhap.
    setComments((currentComments) => [
      ...currentComments,
      {
        id: Date.now(),
        content: newComment.trim(),
        created_time: new Date().toISOString(),
        post: post.id,
        parent_comment: null,
        user_detail: {
          id: user?.id ?? 0,
          username: user?.username || user?.name || 'Ban',
          reputation_score: user?.reputation_score ?? user?.reputationScore ?? 0,
        },
      },
    ]);
    setNewComment('');
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: post?.title, url: shareUrl });
      return;
    }
    await navigator.clipboard.writeText(shareUrl);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] px-4 py-12">
        <div className="mx-auto max-w-4xl rounded-[10px] border border-[#D1D5DC] bg-white p-8 text-center text-[#4A5565]">
          Dang tai bai viet...
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] px-4 py-12">
        <div className="mx-auto max-w-4xl rounded-[10px] border border-[#D1D5DC] bg-white p-8 text-center">
          <h1 className="mb-3 text-2xl font-semibold text-[#1E293B]">Khong tim thay bai viet</h1>
          <p className="mb-6 text-[#4A5565]">{error}</p>
          <Button onClick={() => navigate('/search')} className="bg-[#E01515] text-white hover:bg-[#C10007]">
            Quay ve tim kiem
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-[#4A5565] transition-colors hover:text-[#E01515]"
        >
          <ArrowLeft className="h-5 w-5" />
          Quay lai
        </button>

        <article className="mb-6 rounded-[10px] border border-[#D1D5DC] bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-[#6A7282]">
            {post.category_detail?.category_name && (
              <span className="rounded-full border border-[#E01515] px-3 py-1 text-[#E01515]">
                {post.category_detail.category_name}
              </span>
            )}
            <span>{post.user_detail?.username ?? 'Nguoi dung an danh'}</span>
            <span>Dang luc {formatDate(post.published_time || post.created_time)}</span>
          </div>

          <h1 className="mb-4 text-3xl font-bold leading-tight text-[#101828]">{post.title}</h1>

          <div className="whitespace-pre-wrap text-base leading-7 text-[#364153]">{post.content}</div>

          <div className="mt-6 flex items-center gap-6 border-t border-[#D1D5DC] pt-4 text-[#6A7282]">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              {comments.length} binh luan
            </div>
            <button onClick={handleShare} className="ml-auto flex items-center gap-2 transition-colors hover:text-[#E01515]">
              <Share2 className="h-5 w-5" />
              Chia se
            </button>
          </div>
        </article>

        <section className="rounded-[10px] border border-[#D1D5DC] bg-white p-6 shadow-sm">
          <h2 className="mb-5 text-xl font-semibold text-[#1E293B]">Binh luan cong dong</h2>

          {isAuthenticated ? (
            <form onSubmit={handleSubmitComment} className="mb-6 rounded-[10px] border border-[#D1D5DC] bg-[#FAFAFB] p-4">
              {/* Chi user da dang nhap moi thay textarea va nut gui binh luan. */}
              <Textarea
                value={newComment}
                onChange={(event) => setNewComment(event.target.value)}
                placeholder="Viet binh luan cua ban..."
                className="mb-3 min-h-28 resize-y rounded-[10px] bg-white"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="gap-2 rounded-[8px] bg-[#E01515] text-white hover:bg-[#C10007]"
                >
                  <Send className="h-4 w-4" />
                  Gui
                </Button>
              </div>
            </form>
          ) : (
            <div className="mb-6 rounded-[10px] border border-[#F7BABA] bg-[#FFF1F1] p-5 text-center text-[#4A5565]">
              Bạn có thông tin về vụ lừa đảo này? Hãy{' '}
              <Link to="/login" className="font-semibold text-[#E01515] hover:underline">
                Đăng nhập
              </Link>{' '}
              hoặc{' '}
              <Link to="/register" className="font-semibold text-[#E01515] hover:underline">
                Đăng ký
              </Link>{' '}
              ngay để cảnh báo cộng đồng!
            </div>
          )}

          <div className="space-y-5">
            {topLevelComments.length === 0 ? (
              <p className="py-8 text-center text-[#99A1AF]">Chua co binh luan nao.</p>
            ) : (
              topLevelComments.map((comment) => (
                <div key={comment.id} className="border-b border-[#E5E7EB] pb-5 last:border-0 last:pb-0">
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E01515] font-semibold text-white">
                      {(comment.user_detail?.username ?? 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-[#1E293B]">{comment.user_detail?.username ?? 'Nguoi dung'}</p>
                      <p className="text-xs text-[#99A1AF]">{formatDate(comment.created_time)}</p>
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap text-[#4A5565]">{comment.content}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
