import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { mockPosts, mockUsers } from '../data/mockData';
import { ArrowLeft, Flag, Heart, MessageCircle, Share2, ShieldAlert } from 'lucide-react';
import { ReportUserDialog } from '../components/ReportUserDialog';
import { ReportDialog } from '../components/ReportDialog';
import { toast } from 'sonner';

export function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);

  const profileUser = mockUsers.find(u => u.id === userId);
  const userPosts = mockPosts.filter(post => post.author.id === userId);

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

  const isOwnProfile = currentUser?.id === userId;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getReputationColor = (score: number) => {
    if (score >= 100) return '#22C55E';
    if (score >= 50) return '#F59E0B';
    return '#E01515';
  };

  const handleReportUser = (reason: string) => {
    console.log('Report user:', { userId, reason });
    toast.success('Báo cáo người dùng đã được gửi. Chúng tôi sẽ xem xét trong thời gian sớm nhất.');
  };

  const handleReportPostSubmit = (reason: string) => {
    toast.success('Báo cáo bài viết đã được gửi. Chúng tôi sẽ xem xét trong thời gian sớm nhất.');
    setReportingPostId(null);
  };

  // Mock stats
  const stats = {
    posts: userPosts.length,
    likes: userPosts.reduce((sum, post) => sum + post.likes, 0),
    comments: userPosts.reduce((sum, post) => sum + (post.comments?.length || 0), 0),
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#4A5565] hover:text-[#E01515] mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Quay lại</span>
        </button>

        {/* Profile Header */}
        <div className="bg-gradient-to-r from-[#E01515] to-[#C10007] rounded-[10px] p-8 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-[#E01515] font-bold text-3xl">
                {profileUser.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">{profileUser.name}</h1>
                <p className="text-white/90">Tham gia từ 20/1/2025</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-[10px] px-4 py-2 flex items-center gap-2">
                <span className="text-sm">Điểm uy tín:</span>
                <span className="text-2xl font-bold">{profileUser.reputationScore}</span>
              </div>
              {!isOwnProfile && currentUser && (
                <button
                  onClick={() => setIsReportDialogOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-white text-[#E01515] hover:bg-white/90 transition-colors"
                >
                  <ShieldAlert className="h-5 w-5" />
                  Báo cáo người dùng
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
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

        {/* User Posts */}
        <div className="bg-white rounded-[10px] border border-[#D1D5DC] p-6">
          <h2 className="text-xl font-semibold mb-6">Bài viết của {profileUser.name}</h2>

          {userPosts.length === 0 ? (
            <p className="text-center text-[#99A1AF] py-12">Người dùng chưa có bài viết nào</p>
          ) : (
            <div className="space-y-6">
              {userPosts.map((post) => (
                <div key={post.id} className="border-b border-[#D1D5DC] pb-6 last:border-0 last:pb-0">
                  {/* Post Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-[#E01515] flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                      {profileUser.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-[#1E293B]">{profileUser.name}</span>
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded"
                          style={{
                            backgroundColor: `${getReputationColor(profileUser.reputationScore)}15`,
                            color: getReputationColor(profileUser.reputationScore),
                          }}
                        >
                          {profileUser.reputationScore}
                        </span>
                        <span className="text-sm text-[#99A1AF]">
                          • 5 ngày trước
                        </span>
                        <span className="px-3 py-1 rounded-full border border-[#E01515] text-[#E01515] text-sm">
                          {post.category.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <Link
                    to={`/post/${post.id}`}
                    className="block mb-4 hover:text-[#E01515] transition-colors"
                  >
                    <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                    <p className="text-[#4A5565] line-clamp-2">{post.content}</p>
                  </Link>

                  {/* Post Stats */}
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-[#99A1AF]">
                      <Heart className="h-5 w-5" />
                      <span>{post.likes}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#99A1AF]">
                      <MessageCircle className="h-5 w-5" />
                      <span>{post.comments?.length || 0} bình luận</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#99A1AF]">
                      <Share2 className="h-5 w-5" />
                      <span>32 chia sẻ</span>
                    </div>
                    <button
                      onClick={() => setReportingPostId(post.id)}
                      className="ml-auto text-sm text-[#99A1AF] hover:text-[#E01515] transition-colors"
                    >
                      <ShieldAlert className="inline h-4 w-4 mr-1" />
                      Báo cáo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Report User Dialog */}
      <ReportUserDialog
        isOpen={isReportDialogOpen}
        onClose={() => setIsReportDialogOpen(false)}
        onSubmit={handleReportUser}
        userName={profileUser.name}
      />

      {/* Report Post Dialog */}
      <ReportDialog
        isOpen={reportingPostId !== null}
        onClose={() => setReportingPostId(null)}
        onSubmit={handleReportPostSubmit}
        title="Báo cáo bài viết"
      />
    </div>
  );
}
