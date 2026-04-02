import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { mockPosts } from '../data/mockData';
import { PostCard } from '../components/PostCard';
import { Search, Bookmark } from 'lucide-react';

export function SavedPosts() {
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

  // Tạm thời dùng mockPosts.slice(1, 3) để giả lập danh sách đã lưu
  const savedPostsList = mockPosts.slice(1, 3);
  
  const filteredPosts = searchQuery
    ? savedPostsList.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : savedPostsList;

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-12">
      <div className="max-w-[768px] mx-auto px-6 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-amber-100 p-2 rounded-lg">
              <Bookmark className="h-6 w-6 text-amber-600 fill-amber-600" />
            </div>
            <h1 className="text-[28px] font-bold text-[#1E293B]">Bài viết đã lưu</h1>
          </div>
          <p className="text-[#4A5565] text-sm">
            Xem lại những bài viết quan trọng bạn đã đánh dấu
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#99A1AF]" />
          <input
            type="text"
            placeholder="Tìm kiếm bài viết đã lưu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-[10px] bg-white border border-[#D1D5DC] focus:outline-none focus:border-[#E01515] transition-colors shadow-sm"
          />
        </div>

        {/* Posts List */}
        <div className="space-y-4">
          {filteredPosts.length === 0 ? (
            <div className="bg-white rounded-[12px] border border-[#D1D5DC] p-12 text-center shadow-sm">
              <p className="text-[#99A1AF] mb-4">
                {searchQuery ? 'Không tìm thấy bài viết đã lưu phù hợp' : 'Bạn chưa lưu bài viết nào'}
              </p>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} defaultSaved={true} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
