import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import api from '../../api/axiosInstance';
import { Post, User } from '../types';
import { PostCard } from '../components/PostCard';
import { ArrowLeft, ShieldAlert, Loader2 } from 'lucide-react';
import { ReportUserDialog } from '../components/ReportUserDialog';
import { toast } from 'sonner';
import { Avatar } from '../components/Avatar';

export function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      try {
        setIsLoading(true);
        const [userRes, postsRes] = await Promise.all([
          api.get(`users/${userId}/`),
          api.get(`posts/`, { params: { user: userId } })
        ]);
        setProfileUser(userRes.data);
        setUserPosts(Array.isArray(postsRes.data) ? postsRes.data : postsRes.data.results || []);
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        toast.error('Không thể tải thông tin người dùng');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 text-[#E01515] animate-spin" />
        <p className="text-[#64748B]">Đang tải hồ sơ...</p>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Không tìm thấy người dùng</h2>
          <button
            onClick={() => navigate('/')}
            className="text-[#E01515] hover:underline"
          >
            Quay về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === Number(userId);

  const handleReportUser = async (reason: string) => {
    try {
      await api.post('reports/', {
        target_type: 'USER',
        target_id: userId,
        reason: reason
      });
      toast.success('Báo cáo người dùng đã được gửi. Chúng tôi sẽ xem xét trong thời gian sớm nhất.');
      setIsReportDialogOpen(false);
    } catch (err) {
      toast.error('Lỗi khi gửi báo cáo');
    }
  };

  const stats = {
    posts: userPosts.length,
    likes: userPosts.reduce((sum, post) => sum + (post.likes_count || 0), 0),
    comments: userPosts.reduce((sum, post) => sum + (post.comments_count || 0), 0),
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#4A5565] hover:text-[#E01515] mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Quay lại</span>
        </button>

        <div className="bg-[#FFF7F7] rounded-[18px] border border-[#F3C4C4] px-8 py-5 mb-6 shadow-[0_4px_4px_rgba(0,0,0,0.25)]">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <Avatar name={profileUser.username} size="xl" className="shadow-md" />

              <div>
                <h1 className="text-[22px] font-bold text-[#111827] mb-1">
                  {profileUser.username}
                </h1>

                <div className="flex items-center gap-2 text-[14px] text-[#4B5563]">
                  <span>
                    Tham gia từ {profileUser.created_date ? new Date(profileUser.created_date).toLocaleDateString('vi-VN') : 'Gần đây'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 rounded-[16px] border border-[#F3C4C4] bg-white px-4 py-2">
                <div className="w-10 h-10 rounded-full bg-[#F0000F] flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-white" />
                </div>

                <div className="leading-tight">
                  <div className="text-[13px] text-[#4B5563]">
                    Điểm uy tín
                  </div>
                  <div className="text-[20px] font-bold text-[#F0000F]">
                    {profileUser.reputation_score}
                  </div>
                </div>
              </div>

              {!isOwnProfile && currentUser && (
                <button
                  onClick={() => setIsReportDialogOpen(true)}
                  className="h-[42px] px-5 rounded-[14px] border border-[#D1D5DC] bg-[#F3F4F6]
                  flex items-center gap-2
                  text-[14px] font-medium text-[#374151]
                  transition-all duration-200
                  hover:bg-[#FFECEC] hover:text-[#E01515] hover:border-[#E01515]"
                >
                  <ShieldAlert className="w-4 h-4" />
                  Báo cáo người dùng
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-[10px] border border-[#D1D5DC] p-6 text-center">
            <div className="text-4xl font-bold text-[#E01515] mb-2">{stats.posts}</div>
            <div className="text-[#99A1AF]">Bài viết đã đăng</div>
          </div>
          <div className="bg-white rounded-[10px] border border-[#D1D5DC] p-6 text-center">
            <div className="text-4xl font-bold text-[#E01515] mb-2">{stats.likes}</div>
            <div className="text-[#99A1AF]">Lượt thích nhận được</div>
          </div>
          <div className="bg-white rounded-[10px] border border-[#D1D5DC] p-6 text-center">
            <div className="text-4xl font-bold text-[#E01515] mb-2">{stats.comments}</div>
            <div className="text-[#99A1AF]">Bình luận nhận được</div>
          </div>
        </div>

        <div className="bg-white rounded-[10px] border border-[#D1D5DC] p-6">
          <h2 className="text-xl font-semibold mb-6">Bài viết của {profileUser.username}</h2>

          {userPosts.length === 0 ? (
            <p className="text-center text-[#99A1AF] py-12">Người dùng chưa có bài viết nào</p>
          ) : (
            <div className="space-y-2">
              {userPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </div>

      <ReportUserDialog
        isOpen={isReportDialogOpen}
        onClose={() => setIsReportDialogOpen(false)}
        onSubmit={handleReportUser}
        userName={profileUser.username}
      />
    </div>
  );
}
