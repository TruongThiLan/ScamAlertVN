import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { mockPosts } from '../data/mockData';
import { Search, Plus, Edit, Trash2, Heart, MessageCircle, Share2, Calendar } from 'lucide-react';

export function MyPosts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  // Filter posts by current user
  const myPosts = mockPosts.filter(post => post.author.id === user.id);
  
  // Filter by search query
  const filteredPosts = searchQuery
    ? myPosts.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : myPosts;

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

  const handleDelete = (postId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      // Vì đang dùng mockData, để xóa thật bạn có thể filter mockPosts
      const index = mockPosts.findIndex(p => p.id === postId);
      if (index !== -1) {
        mockPosts.splice(index, 1);
      }
      alert('Đã xóa bài viết');
      // Ép re-render bằng cách reload hoặc dùng state (tạm thời để alert)
      window.location.reload(); 
    }
  };

  const handleEdit = (postId: string) => {
    alert('Chức năng chỉnh sửa đang được phát triển');
  };

  const getPostStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2.5 py-1 rounded-[6px] bg-[#DCFCE7] text-[#16A34A] text-[13px] font-medium whitespace-nowrap">Đã đăng</span>;
      case 'pending':
        return <span className="px-2.5 py-1 rounded-[6px] bg-[#DBEAFE] text-[#2563EB] text-[13px] font-medium whitespace-nowrap">Chờ duyệt</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 rounded-[6px] bg-[#FEE2E2] text-[#DC2626] text-[13px] font-medium whitespace-nowrap">Từ chối</span>;
      case 'draft':
      default:
        return <span className="px-2.5 py-1 rounded-[6px] bg-[#F1F5F9] text-[#475569] text-[13px] font-medium whitespace-nowrap">Nháp</span>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-[#E01515] to-[#C10007] rounded-[10px] p-8 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-[#E01515] font-bold text-3xl">
                {user.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">{user.name}</h1>
                <div className="flex items-center gap-2 text-white/90">
                  <Calendar className="h-4 w-4" />
                  <span>Tham gia từ 20/1/2025</span>
                </div>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-[10px] px-4 py-2 flex items-center gap-2">
              <span className="text-sm">Điểm uy tín:</span>
              <span className="text-2xl font-bold">{user.reputationScore}</span>
            </div>
          </div>
        </div>

        {/* Search and Create */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#99A1AF]" />
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-[10px] border border-[#D1D5DC] focus:outline-none focus:border-[#E01515] transition-colors"
            />
          </div>
          <Link
            to="/create-post"
            className="flex items-center gap-2 px-6 py-3 rounded-[10px] bg-[#E01515] text-white hover:bg-[#C10007] transition-colors whitespace-nowrap"
          >
            <Plus className="h-5 w-5" />
            Tạo bài viết
          </Link>
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {filteredPosts.length === 0 ? (
            <div className="bg-white rounded-[10px] border border-[#D1D5DC] p-12 text-center">
              <p className="text-[#99A1AF] mb-4">
                {searchQuery ? 'Không tìm thấy bài viết nào' : 'Bạn chưa có bài viết nào'}
              </p>
              {!searchQuery && (
                <Link
                  to="/create-post"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-[10px] bg-[#E01515] text-white hover:bg-[#C10007] transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  Tạo bài viết đầu tiên
                </Link>
              )}
            </div>
          ) : (
            filteredPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-[10px] border border-[#D1D5DC] p-6 hover:shadow-md transition-shadow"
              >
                {/* Post Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Link
                        to={`/post/${post.id}`}
                        className="text-[18px] font-bold text-[#1E293B] hover:text-[#E01515] transition-colors"
                      >
                        {post.title || 'Bài viết chưa có tiêu đề'}
                      </Link>
                      {getPostStatusBadge(post.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-[#64748B]">
                      <span>Tạo: {formatDate(post.createdAt)}</span>
                      {post.status === 'approved' && post.updatedAt && (
                        <span>Đăng: {formatDate(post.updatedAt)}</span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-full border border-[#E01515] text-[#E01515] text-[13px]">
                        {post.category?.name || 'Chưa phân loại'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {post.status !== 'approved' && (
                      <button
                        onClick={() => handleEdit(post.id)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] border border-[#E2E8F0] text-[#475569] hover:bg-gray-50 transition-colors text-[13px] font-medium"
                      >
                        <Edit className="h-4 w-4" />
                        Sửa
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-[6px] border border-[#E2E8F0] text-[#475569] hover:bg-gray-50 hover:text-[#E01515] transition-colors text-[13px] font-medium"
                    >
                      <Trash2 className="h-4 w-4" />
                      Xóa
                    </button>
                  </div>
                </div>

                {/* Post Content Preview */}
                <p className="text-[#64748B] text-[15px] leading-relaxed mb-5 line-clamp-2">{post.content}</p>

                {/* Post Stats */}
                <div className="flex items-center gap-6 pt-4 border-t border-[#D1D5DC]">
                  <div className="flex items-center gap-2 text-[#99A1AF]">
                    <Heart className="h-5 w-5" />
                    <span>{post.likes}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#99A1AF]">
                    <MessageCircle className="h-5 w-5" />
                    <span>{post.comments?.length || 0}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#99A1AF]">
                    <Share2 className="h-5 w-5" />
                    <span>28</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}