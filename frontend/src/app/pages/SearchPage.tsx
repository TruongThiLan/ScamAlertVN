import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { mockPosts } from '../data/mockData';
import { PostCard } from '../components/PostCard';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Search } from 'lucide-react';

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  
  const approvedPosts = mockPosts.filter(post => post.status === 'approved');
  
  const searchResults = query.trim() 
    ? approvedPosts.filter(post =>
        post.title.toLowerCase().includes(query.toLowerCase()) ||
        post.content.toLowerCase().includes(query.toLowerCase()) ||
        post.category.name.toLowerCase().includes(query.toLowerCase())
      )
    : approvedPosts;

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Tìm kiếm cảnh báo</h1>

      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Tìm kiếm cảnh báo lừa đảo..."
            className="pl-10 text-lg h-12"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="mb-4">
        <p className="text-gray-600">
          {query.trim() ? (
            <>
              Tìm thấy <strong>{searchResults.length}</strong> kết quả cho &quot;{query}&quot;
            </>
          ) : (
            <>Hiển thị tất cả <strong>{searchResults.length}</strong> bài viết</>
          )}
        </p>
      </div>

      <div className="space-y-4">
        {searchResults.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500">Không tìm thấy kết quả phù hợp</p>
              <p className="text-sm text-gray-400 mt-2">
                Thử tìm kiếm với từ khóa khác
              </p>
            </CardContent>
          </Card>
        ) : (
          searchResults.map(post => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
