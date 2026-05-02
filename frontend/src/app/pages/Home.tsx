import { FormEvent, useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
// 1. Nhảy ra 2 lần (../../) để từ pages -> app -> src rồi vào api
import api from '../../api/axiosInstance';
import type { Post, ScamCategory } from '../types';
import { PostCard } from '../components/PostCard';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Search, ChevronRight, Plus } from 'lucide-react';
// 4. Contexts cũng nằm trong src/app/ nên dùng ../
import { useAuth } from '../contexts/AuthContext';

const UNCATEGORIZED_CATEGORY_ID = 'uncategorized';

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

export function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // --- STATE DỮ LIỆU THẬT ---
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<ScamCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // --- STATE UI ---
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') ?? 'all');
  const [sortBy, setSortBy] = useState<string>('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState('');

  // --- GỌI API KHI VÀO TRANG ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [allPosts, allCategories] = await Promise.all([
          fetchAllResults<Post>('posts/'),
          fetchAllResults<ScamCategory>('categories/')
        ]);

        // Load all paginated records so sidebar counts match the visible feed.
        setPosts(allPosts.filter((post) => post.status === 'APPROVED'));
        setCategories(allCategories);
      } catch (err) {
        console.error("Lỗi lấy dữ liệu từ Backend:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    setSelectedCategory(searchParams.get('category') ?? 'all');
  }, [searchParams]);

  // --- LOGIC LỌC & SẮP XẾP ---
  const categoryFilteredPosts = selectedCategory === 'all'
    ? posts
    : selectedCategory === UNCATEGORIZED_CATEGORY_ID
      ? posts.filter(post => !post.category_detail)
      : posts.filter(post => post.category_detail?.id.toString() === selectedCategory);
  const uncategorizedCount = posts.filter(post => !post.category_detail).length;

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    if (categoryId === 'all') {
      setSearchParams({});
    } else {
      setSearchParams({ category: categoryId });
    }
  };

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

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      setSearchError('Vui lòng nhập từ khóa tìm kiếm.');
      return;
    }

    navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
  };

  if (loading) return <div className="p-10 text-center">Đang tải dữ liệu từ hệ thống...</div>;

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="flex items-start">
        {/* Sidebar - Categories */}
        <aside className="sticky top-[70px] h-[calc(100vh-70px)] w-[320px] shrink-0 overflow-y-auto bg-white border-r border-[#D1D5DC]">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-6 text-[#111827]">Danh mục lừa đảo</h2>
            <div className="space-y-3">
              <button
                onClick={() => handleCategorySelect('all')}
                className={`group w-full flex items-center justify-between px-3 py-2 rounded-[10px] border transition-all ${selectedCategory === 'all' ? 'bg-[#FFF1F1] border-[#F7BABA]' : 'bg-white border-transparent hover:bg-[#FFF5F5]'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-[12px] flex items-center justify-center font-semibold text-sm ${selectedCategory === 'all' ? 'bg-[#E01515] text-white' : 'bg-[#F3F4F6] text-[#64748B]'
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
                    onClick={() => handleCategorySelect(category.id.toString())}
                    className={`group w-full flex items-center justify-between px-3 py-2 rounded-[10px] border transition-all ${isActive ? 'bg-[#FFF1F1] border-[#F7BABA]' : 'bg-white border-transparent hover:bg-[#FFF5F5]'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-[12px] flex items-center justify-center font-semibold text-sm ${isActive ? 'bg-[#E01515] text-white' : 'bg-[#F3F4F6] text-[#64748B]'
                        }`}>
                        {count}
                      </div>
                      <span className={`font-medium ${isActive ? 'text-[#E01515]' : 'text-[#111827]'}`}>{category.category_name}</span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-[#99A1AF]" />
                  </button>
                );
              })}

              {uncategorizedCount > 0 && (
                <button
                  onClick={() => handleCategorySelect(UNCATEGORIZED_CATEGORY_ID)}
                  className={`group w-full flex items-center justify-between px-3 py-2 rounded-[10px] border transition-all ${selectedCategory === UNCATEGORIZED_CATEGORY_ID ? 'bg-[#FFF1F1] border-[#F7BABA]' : 'bg-white border-transparent hover:bg-[#FFF5F5]'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-[12px] flex items-center justify-center font-semibold text-sm ${selectedCategory === UNCATEGORIZED_CATEGORY_ID ? 'bg-[#E01515] text-white' : 'bg-[#F3F4F6] text-[#64748B]'
                      }`}>
                      {uncategorizedCount}
                    </div>
                    <span className={`font-medium ${selectedCategory === UNCATEGORIZED_CATEGORY_ID ? 'text-[#E01515]' : 'text-[#111827]'}`}>Chưa phân loại</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-[#99A1AF]" />
                </button>
              )}
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
                <form onSubmit={handleSearchSubmit} className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#99A1AF]" />
                    <Input
                      placeholder="Tìm kiếm bài viết..."
                      className={`pl-10 bg-[#F3F3F5] rounded-[10px] ${
                        searchError ? 'border-[#E01515] focus-visible:ring-[#E01515]' : ''
                      }`}
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        if (searchError) setSearchError('');
                      }}
                      aria-invalid={Boolean(searchError)}
                    />
                  </div>
                  {searchError && <p className="mt-2 text-sm font-medium text-[#E01515]">{searchError}</p>}
                </form>
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
