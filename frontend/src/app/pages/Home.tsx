import { useState } from 'react';
import { Link } from 'react-router';
import { mockPosts, scamCategories } from '../data/mockData';
import { PostCard } from '../components/PostCard';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Search, ChevronRight, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getCategoryBadgeStyle } from '../utils/colorUtils';

export function Home() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('latest');
  const [searchQuery, setSearchQuery] = useState('');

  const approvedPosts = mockPosts.filter(post => post.status === 'approved');
  
  const categoryFilteredPosts = selectedCategory === 'all' 
    ? approvedPosts 
    : approvedPosts.filter(post => post.category.id === selectedCategory);

  const filteredPosts = searchQuery.trim() === ''
    ? categoryFilteredPosts
    : categoryFilteredPosts.filter(post => 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    if (sortBy === 'trending') {
      return b.likes - a.likes;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const categoryCounts = scamCategories.map(c => approvedPosts.filter(p => p.category.id === c.id).length);
  const maxCategoryCount = Math.max(...categoryCounts, 1);

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="flex">
        {/* Sidebar - Categories */}
        
        <aside className="w-[320px] shrink-0 bg-white border-r border-[#D1D5DC] min-h-screen">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-6 text-[#111827]">Danh mục lừa đảo</h2>

            <div className="space-y-3">
              {/* Tất cả */}
              <button
                onClick={() => setSelectedCategory('all')}
                className={`group w-full flex items-center justify-between px-3 py-2 rounded-[10px] text-base border transition-all duration-200 ${
                  selectedCategory === 'all'
                    ? 'bg-[#FFF1F1] border-[#F7BABA]'
                    : 'bg-white border-transparent hover:bg-[#FFF5F5] hover:border-[#FFD6D6]'
                }`}
              >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-[12px] flex items-center justify-center font-semibold text-sm shrink-0 transition-all duration-200 ${
                    selectedCategory === 'all'
                      ? 'bg-[#E01515] text-white'
                      : 'bg-[#F3F4F6] text-[#64748B] group-hover:bg-[#FEE2E2] group-hover:text-[#E01515]'
                  }`}
                >
                  {approvedPosts.length}
                </div>

                <span
                  className={`text-left font-medium transition-colors duration-200 ${
                    selectedCategory === 'all'
                      ? 'text-[#E01515] font-semibold'
                      : 'text-[#111827] group-hover:text-[#E01515]'
                  }`}
                >
                  Tất cả
                </span>
              </div>

              <ChevronRight
                className={`h-5 w-5 shrink-0 transition-colors duration-200 ${
                  selectedCategory === 'all'
                    ? 'text-[#E01515]'
                    : 'text-[#99A1AF] group-hover:text-[#E01515]'
                }`}
              />
              </button>

              {/* Các danh mục */}
              {scamCategories.map((category) => {
                const categoryPostCount = approvedPosts.filter(
                  (p) => p.category.id === category.id
                ).length;

                const isActive = selectedCategory === category.id;

                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
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
                        {categoryPostCount}
                      </div>

                      <span
                        className={`text-left font-medium transition-colors duration-200 ${
                          isActive
                            ? 'text-[#E01515] font-semibold'
                            : 'text-[#111827] group-hover:text-[#E01515]'
                        }`}
                      >
                        {category.name}
                      </span>
                    </div>

                    <ChevronRight
                      className={`h-5 w-5 shrink-0 transition-colors duration-200 ${
                        isActive
                          ? 'text-[#E01515]'
                          : 'text-[#99A1AF] group-hover:text-[#E01515]'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-[88px] py-8">
          <div className="max-w-[943px]">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-[28px] font-semibold mb-1">Cảnh báo lừa đảo</h1>
                  <p className="text-[#4A5565] text-sm">
                    Cập nhật các thông tin cảnh báo mới nhất từ cộng đồng
                  </p>
                </div>
                {user && (
                  <Link to="/create-post">
                    <Button className="flex items-center gap-2 bg-[#E01515] hover:bg-[#C10007] text-white rounded-[10px]">
                      <Plus className="h-5 w-5" />
                      Tạo bài viết
                    </Button>
                  </Link>
                )}
              </div>
              
              {/* Search and Filter */}
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#99A1AF]" />
                  <Input
                    placeholder="Tìm kiếm bài viết, danh mục..."
                    className="pl-10 bg-[#F3F3F5] border-[#D1D5DC] rounded-[10px] h-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[200px] bg-[#F3F3F5] border-[#D1D5DC] rounded-[10px] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">Mới nhất</SelectItem>
                    <SelectItem value="trending">Thịnh hành</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Posts */}
            <div className="space-y-4">
              {sortedPosts.length === 0 ? (
                <div className="bg-white rounded-[10px] border border-[#D1D5DC] p-8 text-center text-gray-500">
                  {searchQuery 
                    ? `Không tìm thấy kết quả nào cho "${searchQuery}"`
                    : 'Chưa có bài viết nào trong danh mục này'
                  }
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