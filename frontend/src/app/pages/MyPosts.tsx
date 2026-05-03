import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { Search, Plus, Edit, Trash2, Heart, MessageCircle, Share2, Calendar, History, Shield, Loader2 } from 'lucide-react';
import api from '../../api/axiosInstance';
import { toast } from 'sonner';
import { Avatar } from '../components/Avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';

// NOTE VAN DAP:
// MyPosts hien cac bai cua user dang dang nhap, ke ca bai PENDING/REJECTED.
// FE goi /api/posts/mine/; backend loc theo request.user trong PostViewSet.mine.

export function MyPosts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      fetchMyPosts();
    }
  }, [user, navigate, refreshKey]);

  const fetchMyPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get('posts/mine/');
      // API return: { count, next, previous, results: [...] } OR directly [...]
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setPosts(data);
    } catch (error) {
      console.error("Lỗi khi tải bài viết của tôi:", error);
      toast.error("Không thể tải danh sách bài viết.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Chưa có ngày';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleDelete = async (postId: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      try {
        await api.delete(`posts/${postId}/`);
        toast.success("Xóa bài viết thành công!");
        setRefreshKey(prev => prev + 1);
      } catch (error) {
        toast.error("Xóa thất bại. Vui lòng thử lại.");
      }
    }
  };

  const handleEdit = (postId: number) => {
    navigate(`/edit-post/${postId}`);
  };

  const getPostStatusBadge = (status?: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-2.5 py-1 rounded-[6px] bg-[#DCFCE7] text-[#16A34A] text-[13px] font-medium">Đã đăng</span>;
      case 'PENDING':
        return <span className="px-2.5 py-1 rounded-[6px] bg-[#DBEAFE] text-[#2563EB] text-[13px] font-medium">Chờ duyệt</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 rounded-[6px] bg-[#FEE2E2] text-[#DC2626] text-[13px] font-medium">Từ chối</span>;
      default:
        return <span className="px-2.5 py-1 rounded-[6px] bg-[#F1F5F9] text-[#475569] text-[13px] font-medium">{status || 'Lạ'}</span>;
    }
  };

  // Helper để lấy tên viết tắt (Avatar)
  const getInitials = (name: string) => {
    if (!name) return '??';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[parts.length - 2].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-[1200px] mx-auto px-6 py-8">

        {/* ===== PROFILE HEADER ===== */}
        <div className="bg-[#FFF7F7] rounded-[18px] border border-[#F3C4C4] px-8 py-5 mb-6 shadow-[0_4px_4px_rgba(0,0,0,0.25)]">
          <div className="flex items-center justify-between gap-6">

            {/* LEFT */}
            <div className="flex items-center gap-5">
              <Avatar name={user.name || user.username} size="xl" className="shadow-md" />

              <div>
                <h1 className="text-[22px] font-bold text-[#111827] mb-1">
                  {user.name || user.username}
                </h1>

                <div className="flex items-center gap-2 text-[14px] text-[#4B5563]">
                  <Calendar className="w-4 h-4 text-[#6B7280]" />
                  <span>Tham gia từ {user.created_date ? new Date(user.created_date).toLocaleDateString('vi-VN') : '10/03/2026'}</span>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 rounded-[16px] border border-[#F3C4C4] bg-white px-4 py-2">
                <div className="w-10 h-10 rounded-full bg-[#F0000F] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div className="leading-tight">
                  <div className="text-[13px] text-[#4B5563]">Điểm uy tín</div>
                  <div className="text-[20px] font-bold text-[#F0000F]">
                    {user.reputationScore ?? user.reputation_score ?? 0}
                  </div>
                </div>
              </div>

              <Link to="/reputation-history" className="h-[42px] px-5 rounded-[14px] border border-[#D1D5DB] bg-[#F3F4F6] flex items-center gap-2 text-[14px] font-medium text-[#374151] transition-all hover:bg-[#FFECEC] hover:text-[#E01515] hover:border-[#E01515]">
                <History className="w-4 h-4" />
                Xem lịch sử
              </Link>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#99A1AF]" />
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-[10px] border border-[#D1D5DC]"
            />
          </div>

          <Link to="/create-post" className="flex items-center gap-2 px-6 py-3 rounded-[10px] bg-[#E01515] text-white">
            <Plus className="h-5 w-5" />
            Tạo bài viết
          </Link>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-[#E01515] mb-2" />
              <p className="text-gray-500">Đang tải bài viết...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-white rounded-[10px] border p-12 text-center">
              <p className="text-[#99A1AF] mb-4">
                {searchQuery ? 'Không tìm thấy bài viết nào' : 'Bạn chưa có bài viết nào'}
              </p>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-[10px] border p-6 hover:shadow-sm transition-all duration-200">
                <div className="flex justify-between mb-4">
                  <div>
                    <Link to={`/post/${post.id}`} className="text-[18px] font-bold hover:text-[#E01515] transition-colors">
                      {post.title}
                    </Link>
                    <div className="mt-1 flex items-center gap-3">
                      {getPostStatusBadge(post.status)}
                      <span className="text-[13px] text-[#99A1AF]">{formatDate(post.created_time)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => post.status !== 'APPROVED' && handleEdit(post.id)}
                            disabled={post.status === 'APPROVED'}
                            className={`p-2 rounded-full transition-all ${post.status === 'APPROVED'
                                ? 'text-gray-200 cursor-not-allowed'
                                : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'
                              }`}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </TooltipTrigger>
                        {post.status === 'APPROVED' && (
                          <TooltipContent>
                            <p className="text-xs">Không thể chỉnh sửa bài viết đã được đăng</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>

                    <button onClick={() => handleDelete(post.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="text-[#64748B] mb-4 line-clamp-2">{post.content}</p>

                <div className="flex gap-6 text-[#99A1AF]">
                  <div className="flex gap-1 items-center"><Heart className="h-4 w-4" />{post.likes_count || 0}</div>
                  <div className="flex gap-1 items-center"><MessageCircle className="h-4 w-4" />{post.comments_count || 0}</div>
                  <div className="flex gap-1 items-center"><Share2 className="h-4 w-4" />0</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
