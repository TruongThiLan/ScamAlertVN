import { useState, useEffect } from 'react';
import { Link } from 'react-router';
// 1. Nhảy ra 2 lần (../../) để từ pages -> app -> src rồi vào api
import api from '../../api/axiosInstance';
// 2. Tương tự cho file types
import { Post, ScamCategory } from '../../types';
// 3. Vì components nằm trong src/app/ nên chỉ cần nhảy ra 1 lần (../)
import { PostCard } from '../components/PostCard';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Search, ChevronRight, Plus } from 'lucide-react';
// 4. Contexts cũng nằm trong src/app/ nên dùng ../
import { useAuth } from '../contexts/AuthContext';

export function Home() {
  const { user } = useAuth();

  // --- STATE DỮ LIỆU THẬT ---
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<ScamCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // --- STATE UI ---
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('latest');
  const [searchQuery, setSearchQuery] = useState('');

  // --- GỌI API KHI VÀO TRANG ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [postsRes, categoriesRes] = await Promise.all([
          api.get('posts/'),
          api.get('categories/')
        ]);

        // Trích xuất mảng results từ response đã phân trang
        setPosts(postsRes.data.results || []);
        setCategories(categoriesRes.data.results || []);
      } catch (err) {
        console.error("Lỗi lấy dữ liệu từ Backend:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- LOGIC LỌC & SẮP XẾP ---
  const categoryFilteredPosts = selectedCategory === 'all'
    ? posts
    : posts.filter(post => post.category_detail?.id.toString() === selectedCategory);

  const filteredPosts = searchQuery.trim() === ''
    ? categoryFilteredPosts
    : categoryFilteredPosts.filter(post =>
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'trending') {
      return (b.likes_count || 0) - (a.likes_count || 0);
    }
    return new Date(b.created_time).getTime() - new Date(a.created_time).getTime();
  });

  if (loading) return <div className="p-10 text-center">Đang tải dữ liệu từ hệ thống...</div>;

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="flex">
        {/* Sidebar - Categories */}
        <aside className="w-[320px] shrink-0 bg-white border-r border-[#D1D5DC] min-h-screen">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-6 text-[#111827]">Danh mục lừa đảo</h2>
            <div className="space-y-3">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`group w-full flex items-center justify-between px-3 py-2 rounded-[10px] border transition-all ${
                  selectedCategory === 'all' ? 'bg-[#FFF1F1] border-[#F7BABA]' : 'bg-white border-transparent hover:bg-[#FFF5F5]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-[12px] flex items-center justify-center font-semibold text-sm ${
                    selectedCategory === 'all' ? 'bg-[#E01515] text-white' : 'bg-[#F3F4F6] text-[#64748B]'
                  }`}>
                    {posts.length}
                  </div>
                  <span className={`font-medium ${selectedCategory === 'all' ? 'text-[#E01515]' : 'text-[#111827]'}`}>Tất cả</span>
                </div>
                <ChevronRight className="h-5 w-5 text-[#99A1AF]" />
              </button>

              {categories.map((category) => {
                const count = posts.filter(p => p.category_detail?.id === category.id).length;
                const isActive = selectedCategory === category.id.toString();
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id.toString())}
                    className={`group w-full flex items-center justify-between px-3 py-2 rounded-[10px] border transition-all ${
                      isActive ? 'bg-[#FFF1F1] border-[#F7BABA]' : 'bg-white border-transparent hover:bg-[#FFF5F5]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-[12px] flex items-center justify-center font-semibold text-sm ${
                        isActive ? 'bg-[#E01515] text-white' : 'bg-[#F3F4F6] text-[#64748B]'
                      }`}>
                        {count}
                      </div>
                      <span className={`font-medium ${isActive ? 'text-[#E01515]' : 'text-[#111827]'}`}>{category.category_name}</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-[#99A1AF]" />
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-[88px] py-8">
          <div className="max-w-[943px]">
            <div className="mb-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-[28px] font-semibold mb-1">Cảnh báo lừa đảo</h1>
                  <p className="text-[#4A5565] text-sm">Dữ liệu thời gian thực từ Backend</p>
                </div>
                {user && (
                  <Link to="/create-post">
                    <Button className="bg-[#E01515] text-white rounded-[10px] gap-2">
                      <Plus className="h-5 w-5" /> Tạo bài viết
                    </Button>
                  </Link>
                )}
              </div>

              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#99A1AF]" />
                  <Input
                    placeholder="Tìm kiếm bài viết..."
                    className="pl-10 bg-[#F3F3F5] rounded-[10px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[200px] bg-[#F3F3F5] rounded-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">Mới nhất</SelectItem>
                    <SelectItem value="trending">Thịnh hành</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              {sortedPosts.length === 0 ? (
                <div className="bg-white rounded-[10px] border p-8 text-center text-gray-500">
                  Không tìm thấy bài viết nào phù hợp.
                </div>
              ) : (
                sortedPosts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}