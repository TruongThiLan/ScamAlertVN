import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Search } from 'lucide-react';
import publicApi from '../../api/publicApi';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

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

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const keyword = searchParams.get('q')?.trim() ?? '';
  const [query, setQuery] = useState(keyword);
  const [posts, setPosts] = useState<PublicPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const title = useMemo(() => {
    return keyword ? `Ket qua tim kiem cho "${keyword}"` : 'Tim kiem canh bao cong khai';
  }, [keyword]);

  useEffect(() => {
    setQuery(keyword);
  }, [keyword]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchPublicPosts = async () => {
      setLoading(true);
      setError('');

      try {
        // API public dung axios rieng, khong gui Authorization header.
        const response = await publicApi.get<PublicPost[] | { results?: PublicPost[] }>('public/posts/', {
          params: keyword ? { search: keyword } : undefined,
          signal: controller.signal,
        });
        setPosts(getResults(response.data));
      } catch (err: any) {
        if (err.name !== 'CanceledError') {
          setError('Khong the tai ket qua tim kiem. Vui long thu lai sau.');
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedQuery = query.trim();

    // Dong bo tu khoa tren o nhap vao Browser URL: /search?q=...
    navigate(trimmedQuery ? `/search?q=${encodeURIComponent(trimmedQuery)}` : '/search');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-3 text-3xl font-bold text-[#101828]">{title}</h1>
          <p className="text-[#4A5565]">
            Tra cuu cac bai canh bao da duoc duyet theo tieu de va noi dung.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mb-8 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#99A1AF]" />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Nhap tu khoa hoac noi dung can tim..."
              className="h-12 rounded-[10px] border-[#D1D5DC] bg-white pl-10 text-base"
            />
          </div>
          <Button type="submit" className="h-12 rounded-[10px] bg-[#E01515] px-6 text-white hover:bg-[#C10007]">
            Tim kiem
          </Button>
        </form>

        <div className="mb-4 text-sm text-[#4A5565]">
          {loading ? 'Dang tim kiem...' : `Tim thay ${posts.length} ket qua`}
        </div>

        {error && (
          <Card className="mb-4 border-[#F7BABA] bg-[#FFF1F1]">
            <CardContent className="py-4 text-[#C10007]">{error}</CardContent>
          </Card>
        )}

        {!loading && !error && posts.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="font-medium text-[#1E293B]">Khong tim thay ket qua phu hop</p>
              <p className="mt-2 text-sm text-[#6A7282]">Thu lai voi tu khoa hoac noi dung khac.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
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
                  <span>{post.user_detail?.username ?? 'Nguoi dung an danh'}</span>
                  <span>{post.comments_count ?? 0} binh luan</span>
                </div>

                <h2 className="mb-2 text-xl font-semibold text-[#1E293B]">{post.title}</h2>
                <p className="mb-4 text-[#4A5565]">{makeExcerpt(post.content)}</p>

                <span className="text-sm font-medium text-[#E01515]">Xem chi tiet canh bao</span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
