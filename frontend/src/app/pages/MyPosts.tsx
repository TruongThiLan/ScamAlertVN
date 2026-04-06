import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { mockPosts } from '../data/mockData';
import { Search, Plus, Edit, Trash2, Heart, MessageCircle, Share2, Calendar, History, Shield } from 'lucide-react';

export function MyPosts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showDeleteSuccessDialog, setShowDeleteSuccessDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user) return null;

  const myPosts = mockPosts.filter(post => post.author.id === user.id);

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

  const handleDelete = (postId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      const index = mockPosts.findIndex(p => p.id === postId);
      if (index !== -1) {
        mockPosts.splice(index, 1);
        setShowDeleteSuccessDialog(true);
        setRefreshKey(prev => prev + 1);
      }
    }
  };

  const handleEdit = (postId: string) => {
    navigate(`/edit-post/${postId}`);
  };

  const getPostStatusBadge = (status?: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2.5 py-1 rounded-[6px] bg-[#DCFCE7] text-[#16A34A] text-[13px] font-medium">Đã đăng</span>;
      case 'pending':
        return <span className="px-2.5 py-1 rounded-[6px] bg-[#DBEAFE] text-[#2563EB] text-[13px] font-medium">Chờ duyệt</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 rounded-[6px] bg-[#FEE2E2] text-[#DC2626] text-[13px] font-medium">Từ chối</span>;
      default:
        return <span className="px-2.5 py-1 rounded-[6px] bg-[#F1F5F9] text-[#475569] text-[13px] font-medium">Nháp</span>;
    }
  };

  return (
    <div key={refreshKey} className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-[1200px] mx-auto px-6 py-8">

        {/* ===== PROFILE HEADER (UPDATED) ===== */}
        <div className="bg-[#FFF7F7] rounded-[18px] border border-[#F3C4C4] px-8 py-5 mb-6 shadow-[0_4px_4px_rgba(0,0,0,0.25)]">
          <div className="flex items-center justify-between gap-6">

            {/* LEFT */}
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-[#E60012] flex items-center justify-center text-white font-bold text-xl shadow-md">
                {user.name
                  .split(' ')
                  .slice(-2)
                  .map(word => word.charAt(0).toUpperCase())
                  .join('')}
              </div>

              <div>
                <h1 className="text-[22px] font-bold text-[#111827] mb-1">
                  {user.name}
                </h1>

                <div className="flex items-center gap-2 text-[14px] text-[#4B5563]">
                  <Calendar className="w-4 h-4 text-[#6B7280]" />
                  <span>Tham gia từ 20/1/2025</span>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-3">

              {/* Reputation */}
              <div className="flex items-center gap-3 rounded-[16px] border border-[#F3C4C4] bg-white px-4 py-2">
                <div className="w-10 h-10 rounded-full bg-[#F0000F] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>

                <div className="leading-tight">
                  <div className="text-[13px] text-[#4B5563]">
                    Điểm uy tín
                  </div>
                  <div className="text-[20px] font-bold text-[#F0000F]">
                    {user.reputationScore}
                  </div>
                </div>
              </div>

              {/* History */}
              <Link
                to="/reputation-history"
                className="h-[42px] px-5 rounded-[14px] border border-[#D1D5DB] bg-[#F3F4F6]
                  flex items-center gap-2

                  text-[14px] font-medium
                  text-[#374151]

                  transition-all duration-200 ease-in-out

                  hover:bg-[#FFECEC]
                  hover:text-[#E01515]
                  hover:border-[#E01515]
                  hover:shadow-sm
                  hover:-translate-y-[1px]
                "
              >
                <History
                  className="w-4 h-4 transition-colors duration-200"
                />
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

          <Link
            to="/create-post"
            className="flex items-center gap-2 px-6 py-3 rounded-[10px] bg-[#E01515] text-white"
          >
            <Plus className="h-5 w-5" />
            Tạo bài viết
          </Link>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {filteredPosts.length === 0 ? (
            <div className="bg-white rounded-[10px] border p-12 text-center">
              <p className="text-[#99A1AF] mb-4">
                {searchQuery ? 'Không tìm thấy bài viết nào' : 'Bạn chưa có bài viết nào'}
              </p>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <div key={post.id} className="bg-white rounded-[10px] border p-6">

                <div className="flex justify-between mb-4">
                  <div>
                    <Link to={`/post/${post.id}`} className="text-[18px] font-bold">
                      {post.title}
                    </Link>
                    {getPostStatusBadge(post.status)}
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(post.id)}>
                      <Edit className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(post.id)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="text-[#64748B] mb-4">{post.content}</p>

                <div className="flex gap-6 text-[#99A1AF]">
                  <div className="flex gap-1"><Heart className="h-5 w-5" />{post.likes}</div>
                  <div className="flex gap-1"><MessageCircle className="h-5 w-5" />{post.comments?.length || 0}</div>
                  <div className="flex gap-1"><Share2 className="h-5 w-5" />28</div>
                </div>

              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}