import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ChevronRight, Search } from 'lucide-react';
import publicApi from '../../api/publicApi';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

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

const getResults = (payload: PublicPost[] | { results?: PublicPost[] }) => {
  return Array.isArray(payload) ? payload : payload.results ?? [];
};

const makeExcerpt = (content: string) => {
  const text = content.replace(/\s+/g, ' ').trim();
  return text.length > 180 ? `${text.slice(0, 180)}...` : text;
};

const UNCATEGORIZED_CATEGORY_ID = 'uncategorized';

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const keyword = searchParams.get('q')?.trim() ?? '';
  const [query, setQuery] = useState(keyword);
  const [posts, setPosts] = useState<PublicPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchError, setSearchError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('latest');

  const title = useMemo(() => {
    return keyword ? `Kết quả tìm kiếm cho "${keyword}"` : 'Tìm kiếm cảnh báo công khai';
  }, [keyword]);

  const categories = useMemo(() => {
    const categoryMap = new Map<number, { id: number; category_name: string; count: number }>();

    posts.forEach((post) => {
      const category = post.category_detail;
      if (!category) return;

      const existingCategory = categoryMap.get(category.id);
      if (existingCategory) {
        existingCategory.count += 1;
      } else {
        categoryMap.set(category.id, { id: category.id, category_name: category.category_name, count: 1 });
      }
    });

    return Array.from(categoryMap.values());
  }, [posts]);

  const uncategorizedCount = useMemo(() => {
    return posts.filter((post) => !post.category_detail).length;
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (selectedCategory === 'all') return posts;
    if (selectedCategory === UNCATEGORIZED_CATEGORY_ID) {
      return posts.filter((post) => !post.category_detail);
    }
    return posts.filter((post) => post.category_detail?.id.toString() === selectedCategory);
  }, [posts, selectedCategory]);

  const sortedPosts = useMemo(() => {
    return [...filteredPosts].sort((a, b) => {
      if (sortBy === 'trending') {
        return (b.comments_count || 0) - (a.comments_count || 0);
      }

      const bTime = new Date(b.published_time || b.created_time).getTime();
      const aTime = new Date(a.published_time || a.created_time).getTime();
      return bTime - aTime;
    });
  }, [filteredPosts, sortBy]);

  useEffect(() => {
    setQuery(keyword);
    setSelectedCategory('all');
  }, [keyword]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchPublicPosts = async () => {
      if (!keyword) {
        setPosts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await publicApi.get<PublicPost[] | { results?: PublicPost[] }>('public/posts/', {
          params: { search: keyword },
          signal: controller.signal,
        });
        setPosts(getResults(response.data));
      } catch (err: any) {
        if (err.name !== 'CanceledError') {
          setError('Hệ thống đang gặp vấn đề. Vui lòng thử lại sau.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchPublicPosts();
    return () => controller.abort();
  }, [keyword]);

  // Live Search Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      const trimmedQuery = query.trim();
      // Chỉ cập nhật URL nếu từ khóa khác với từ khóa hiện tại trong URL
      if (trimmedQuery !== keyword) {
        if (trimmedQuery) {
          navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`, { replace: true });
        } else if (keyword) {
          // Nếu xóa hết chữ thì quay về trang search trống
          navigate('/search', { replace: true });
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, keyword, navigate]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setSearchError('Vui lòng nhập từ khóa tìm kiếm.');
      return;
    }

    setSearchError('');
    navigate(`/search?q=${encodeURIComponent(trimmedQuery)}`);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="flex items-start">
        <aside className="sticky top-[70px] h-[calc(100vh-70px)] w-[320px] shrink-0 overflow-y-auto border-r border-[#D1D5DC] bg-white">
          <div className="p-6">
            <h2 className="mb-6 text-lg font-semibold text-[#111827]">Danh mục lừa đảo</h2>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`group flex w-full items-center justify-between rounded-[10px] border px-3 py-2 transition-all ${
                  selectedCategory === 'all' ? 'border-[#F7BABA] bg-[#FFF1F1]' : 'border-transparent bg-white hover:bg-[#FFF5F5]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-[12px] text-sm font-semibold ${
                      selectedCategory === 'all' ? 'bg-[#E01515] text-white' : 'bg-[#F3F4F6] text-[#64748B]'
                    }`}
                  >
                    {posts.length}
                  </div>
                  <span className={`font-medium ${selectedCategory === 'all' ? 'text-[#E01515]' : 'text-[#111827]'}`}>
                    Tất cả
                  </span>
                </div>
                <ChevronRight className="h-5 w-5 text-[#99A1AF]" />
              </button>

              {categories.map((category) => {
                const isActive = selectedCategory === category.id.toString();
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.id.toString())}
                    className={`group flex w-full items-center justify-between rounded-[10px] border px-3 py-2 transition-all ${
                      isActive ? 'border-[#F7BABA] bg-[#FFF1F1]' : 'border-transparent bg-white hover:bg-[#FFF5F5]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-[12px] text-sm font-semibold ${
                          isActive ? 'bg-[#E01515] text-white' : 'bg-[#F3F4F6] text-[#64748B]'
                        }`}
                      >
                        {category.count}
                      </div>
                      <span className={`font-medium ${isActive ? 'text-[#E01515]' : 'text-[#111827]'}`}>
                        {category.category_name}
                      </span>
                    </div>
                    <ChevronRight className="h-5 w-5 text-[#99A1AF]" />
                  </button>
                );
              })}

              {uncategorizedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory(UNCATEGORIZED_CATEGORY_ID)}
                  className={`group flex w-full items-center justify-between rounded-[10px] border px-3 py-2 transition-all ${
                    selectedCategory === UNCATEGORIZED_CATEGORY_ID ? 'border-[#F7BABA] bg-[#FFF1F1]' : 'border-transparent bg-white hover:bg-[#FFF5F5]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-[12px] text-sm font-semibold ${
                        selectedCategory === UNCATEGORIZED_CATEGORY_ID ? 'bg-[#E01515] text-white' : 'bg-[#F3F4F6] text-[#64748B]'
                      }`}
                    >
                      {uncategorizedCount}
                    </div>
                    <span className={`font-medium ${selectedCategory === UNCATEGORIZED_CATEGORY_ID ? 'text-[#E01515]' : 'text-[#111827]'}`}>
                      Chưa phân loại
                    </span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-[#99A1AF]" />
                </button>
              )}
            </div>
          </div>
        </aside>

        <main className="flex-1 px-[88px] py-8">
          <div className="max-w-[943px]">
            <div className="mb-8">
              <h1 className="mb-3 text-3xl font-bold text-[#101828]">{title}</h1>
              <p className="text-[#4A5565]">Tra cứu các bài cảnh báo đã được duyệt theo tiêu đề và nội dung.</p>
            </div>

            <div className="mb-8 flex gap-4">
              <form onSubmit={handleSubmit} className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#99A1AF]" />
                  <Input
                    type="search"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      if (searchError) setSearchError('');
                    }}
                    placeholder="Nhập từ khóa hoặc nội dung cần tìm..."
                    className={`h-12 rounded-[10px] border-[#D1D5DC] bg-white pl-10 text-base ${
                      searchError ? 'border-[#E01515] focus-visible:ring-[#E01515]' : ''
                    }`}
                    aria-invalid={Boolean(searchError)}
                  />
                </div>
              </form>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-12 w-[200px] rounded-[10px] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Mới nhất</SelectItem>
                  <SelectItem value="trending">Thịnh hành</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {searchError && <p className="-mt-6 mb-6 text-sm font-medium text-[#E01515]">{searchError}</p>}

            <div className="mb-4 text-sm text-[#4A5565]">
              {loading ? 'Đang tìm kiếm...' : `Tìm thấy ${sortedPosts.length} kết quả`}
            </div>

            {error && (
              <Card className="mb-4 border-[#F7BABA] bg-[#FFF1F1]">
                <CardContent className="py-4 text-[#C10007]">{error}</CardContent>
              </Card>
            )}

            {!loading && !error && sortedPosts.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  {keyword ? (
                    <>
                      <p className="font-medium text-[#1E293B]">Không tìm thấy kết quả.</p>
                      <p className="mt-2 text-sm text-[#6A7282]">Vui lòng nhập lại.</p>
                    </>
                  ) : (
                    <p className="font-medium text-[#1E293B]">Nhập từ khóa để tìm kiếm bài viết công khai.</p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {sortedPosts.map((post) => (
                  <Link
                    key={post.id}
                    to={`/posts/${post.id}`}
                    className="block rounded-[10px] border border-[#D1D5DC] bg-white p-5 shadow-sm transition hover:border-[#E01515] hover:shadow-md"
                  >
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-[#6A7282]">
                      {post.category_detail?.category_name && (
                        <span className="rounded-full border border-[#E01515] px-3 py-1 text-[#E01515]">
                          {post.category_detail.category_name}
                        </span>
                      )}
                      <span>{post.user_detail?.username ?? 'Người dùng ẩn danh'}</span>
                      <span>{post.comments_count ?? 0} bình luận</span>
                    </div>

                    <h2 className="mb-2 text-xl font-semibold text-[#1E293B]">{post.title}</h2>
                    <p className="mb-4 text-[#4A5565]">{makeExcerpt(post.content)}</p>

                    <span className="text-sm font-medium text-[#E01515]">Xem chi tiết cảnh báo</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
