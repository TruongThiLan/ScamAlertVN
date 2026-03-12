10. Tương tác và phản hồi
10.1. Chia sẻ bài viết
Use case ID
10.1
Use case name
Chia sẻ bài viết
Description
Là người dùng, tôi muốn chia sẻ bài viết cảnh báo lừa đảo lên các nền tảng khác để nhiều người biết và phòng tránh.
Actors
Người dùng
Priority
Cao
Triggers
Người dùng chọn chức năng “Chia sẻ”.
Pre-conditions
Người dùng đã đăng nhập hệ thống.
Bài viết đã tồn tại.
Post-conditions
Liên kết bài viết được hệ thống cung cấp để người dùng chia sẻ ra nền tảng bên ngoài.
Main flow
Người dùng truy cập bài viết.
Người dùng chọn chức năng “Chia sẻ”.
Hệ thống hiển thị liên kết của bài viết.
Người dùng sao chép liên kết.
Alternative flows
4a. Người dùng không sao chép liên kết
4a.1. Người dùng đóng chức năng chia sẻ.
Exception flows
4b. Nếu hệ thống gặp lỗi khi nhấn sao chép → Hệ thống hiển thị thông báo “Đã xảy ra lỗi. Vui lòng thử lại sau.”
Business rule
N/A
Non-functional requirements
N/A



10.2. Bình luận bài viết
Use case ID
10.2
Use case name
Bình luận bài viết
Description
Là người dùng, tôi muốn bình luận bài viết để trao đổi và bổ sung thông tin về vụ lừa đảo.
Actors
Người dùng
Priority
Cao
Triggers
Người dùng chọn chức năng “Bình luận”
Pre-conditions
Người dùng đã đăng nhập hệ thống.
Bài viết đã tồn tại.
Post-conditions
Bình luận được lưu và hiển thị (hoặc chờ duyệt).
Main flow
Người dùng truy cập bài viết.
Người dùng chọn chức năng “Bình luận”.
Người dùng nhập nội dung bình luận.
Người dùng nhấn “Gửi bình luận”.
Hệ thống kiểm tra nội dung.
Hệ thống lưu bình luận.
Hiển thị bình luận trong bài viết.
Alternative flows
N/A
Exception flows
5a. Nội dung vi phạm → Hệ thống từ chối và thông báo “Nội dung không hợp lệ!” và kết thúc.
Business rule
N/A
Non-functional requirements
N/A






10.3. Thả cảm xúc
Use case ID
10.3
Use case name
Thả cảm xúc
Description
Là người dùng, tôi muốn thả cảm xúc vào bài viết hoặc bình luận để thể hiện mức độ hữu ích; hệ thống sẽ tự động cập nhật điểm uy tín cho tài khoản sở hữu nội dung theo các chính sách đã định nghĩa.
Actors
Người dùng
Priority
Cao
Triggers
Người dùng chọn chức năng “Thích” tại bài viết hoặc bình luận
Pre-conditions
Người dùng đã đăng nhập hệ thống.
Bài viết hoặc bình luận đã tồn tại.
Post-conditions
Trạng thái “Thích” của người dùng được ghi nhận.
Số lượt “Thích” được cập nhật.
Điểm uy tín của tài khoản sở hữu bài viết hoặc bình luận được hệ thống cập nhật tương ứng.
Main flow
Người dùng truy cập bài viết hoặc bình luận.
Người dùng nhấn nút “Thích”.
Hệ thống kiểm tra trạng thái “Thích” của người dùng.
Hệ thống ghi nhận lượt “Thích”.
Hệ thống cập nhật và hiển thị số lượt “Thích”.
Hệ thống cập nhật điểm uy tín cho tài khoản sở hữu bài viết/bình luận theo chính sách.
Alternative flows
3a. Người dùng đã “Thích” trước đó
3a.1. Hệ thống hủy trạng thái “Thích”.
3a.2. Hệ thống trừ lại số điểm uy tín đã cộng trước đó cho tài khoản sở hữu bài viết/bình luận.
3a.3. Hệ thống cập nhật lại số lượt “Thích”.
Exception flows
3b. Nếu hệ thống gặp lỗi khi nhấn “Thích” → Hệ thống hiển thị thông báo “Không thể thả cảm xúc. Vui lòng thử lại sau.” và kết thúc.
Business rule
6a. Bài viết được nhiều người đánh giá hữu ích:
>1000 upvote: +1
>3000 upvote: +3
>5000 upvote: +5
Non-functional requirements
N/A





10.4. Báo cáo bài viết, bình luận
Use case ID
10.4
Use case name
Báo cáo bài viết hoặc bình luận
Description
Là người dùng, tôi muốn báo cáo bài viết hoặc bình luận có dấu hiệu vi phạm hoặc sai lệch thông tin để quản trị hệ thống xem xét và xử lý kịp thời.
Actors
Người dùng
Priority
Cao
Triggers
Người dùng nhấn “Báo cáo” tại bài viết hoặc bình luận.
Pre-conditions
Người dùng đã đăng nhập hệ thống.
Bài viết, bình luận đã tồn tại.
Post-conditions
Báo cáo bài viết, bình luận được chuyển cho quản trị hệ thống.
Main flow
Người dùng truy cập bài viết, bình luận.
Người dùng chọn chức năng “Báo cáo”.
Hệ thống hiển thị danh sách lý do báo cáo.
Chọn lý do báo cáo.
Người dùng nhấn nút “Gửi báo cáo”.
Hệ thống lưu thông tin báo cáo.
Alternative flows
5a. Người dùng hủy gửi báo cáo
5a.1. Người dùng nhấn nút “Huỷ”
Exception flows
3a. Nếu người dùng không chọn lý do báo cáo → Hệ thống hiển thị thông báo “Vui lòng chọn lý do báo cáo.”
Business rule
Báo cáo lừa đảo có bằng chứng rõ ràng và được duyệt: +5
Non-functional requirements
N/A




