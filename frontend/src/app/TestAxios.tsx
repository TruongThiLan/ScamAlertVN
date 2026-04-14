import { useEffect, useState } from 'react';
import api from '../api/axiosInstance'; // Nhớ check lại đường dẫn file này
import { Post } from '../types';
import { PostCard } from '../components/PostCard';

export default function TestAxios() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Dùng Axios Instance để gọi API
    api.get<Post[]>('posts/')
      .then(res => {
        console.log("Dữ liệu về rồi Nguyệt ơi:", res.data);
        setPosts(res.data);
      })
      .catch(err => {
        console.error("Lỗi kết nối:", err);
        setError(err.message);
      });
  }, []);

  return (
    <div className="p-10">
      <h1 className="text-xl font-bold mb-4">Kiểm tra kết nối Axios</h1>

      {error && <p className="text-red-500">Lỗi: {error}</p>}

      <div className="grid gap-4">
        {posts.length > 0 ? (
          posts.map(p => <PostCard key={p.id} post={p} />)
        ) : (
          <p>Đang tải dữ liệu hoặc danh sách Approved đang trống...</p>
        )}
      </div>
    </div>
  );
}