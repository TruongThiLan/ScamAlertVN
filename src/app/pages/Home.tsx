import { useState } from 'react';
import { Link } from 'react-router';
import { mockPosts, scamCategories } from '../data/mockData';
import { PostCard } from '../components/PostCard';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Search, ChevronRight, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

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

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="flex">
        {/* Sidebar - Categories */}
        <aside className="w-[320px] shrink-0 bg-white border-r border-[#D1D5DC] min-h-screen">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-6">Danh mục lừa đảo</h2>
            <div className="space-y-2">
              {/* All Categories Button */}
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full flex items-center justify-between px-3 py-3 rounded-[10px] text-base transition-colors ${
                  selectedCategory === 'all' 
                    ? 'bg-gray-100 font-semibold' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center text-white font-semibold text-sm"
                    style={{ backgroundColor: '#E01515' }}
                  >
                    {approvedPosts.length}
                  </div>
                  <span className="text-left">Tất cả</span>
                </div>
                <ChevronRight className="h-5 w-5 text-[#99A1AF]" />
              </button>

              {scamCategories.map(category => {
                const categoryPostCount = approvedPosts.filter(p => p.category.id === category.id).length;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center justify-between px-3 py-3 rounded-[10px] text-base transition-colors ${
                      selectedCategory === category.id 
                        ? 'bg-gray-100 font-semibold' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-[10px] flex items-center justify-center text-white font-semibold text-sm"
                        style={{ backgroundColor: '#E01515' }}
                      >
                        {categoryPostCount}
                      </div>
                      <span className="text-left">{category.name}</span>
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