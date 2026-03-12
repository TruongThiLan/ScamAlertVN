9. Đăng bài chia sẻ
9.1. UC Tạo bài viết 
Use case ID
9.1
Use case Name
Tạo bài viết
Description
Là một người dùng đã đăng ký, tôi muốn tạo bài viết cảnh báo lừa đảo trên diễn đàn ScamAlert VN để chia sẻ thông tin và cảnh báo cộng đồng về các hành vi lừa đảo.
Actors
Người dùng đã đăng nhập
Priority
Cao
Triggers
Người dùng chọn chức năng “Tạo bài viết”.
Pre-conditions
Người dùng đã đăng nhập vào hệ thống.
Tài khoản người dùng đang ở trạng thái hoạt động (không bị khóa).
Người dùng có quyền đăng bài.
Post-conditions
Bài viết được lưu trong hệ thống với trạng thái Chờ duyệt hoặc Nháp.
Người dùng được thông báo kết quả tạo bài viết.
Main flow
Người dùng chọn chức năng Tạo bài viết.
Hệ thống hiển thị màn hình tạo bài viết.
Người dùng nhập thông tin bài viết, bao gồm:
Ẩn danh/Công khai
Tiêu đề bài viết 
Nội dung bài viết
Danh mục / hình thức lừa đảo
Thông tin liên quan (đường dẫn, hình ảnh/video minh chứng - nếu có)
Người dùng chọn Đăng bài.
Hệ thống kiểm tra tính hợp lệ của dữ liệu nhập vào.
Hệ thống lưu bài viết vào cơ sở dữ liệu với trạng thái Chờ duyệt.
Hệ thống hiển thị thông báo “Tạo bài viết thành công” 
Alternative flows
4.a. Nếu người dùng thoát khỏi màn hình tạo bài viết khi chưa đăng bài thì hệ thống hiển thị hộp thoại xác nhận với các lựa chọn:
Lưu bản nháp
Bỏ bài viết
Tiếp tục chỉnh sửa
4.a.1. Nếu người dùng chọn lưu bản nháp thì hệ thống lưu bài viết với trạng thái “Nháp” và hiển thị thông báo “Lưu bản nháp thành công”.
4.a.2. Nếu người dùng chọn bỏ bài viết thì hệ thống thoát ra khỏi màn hình tạo bài viết và dữ liệu bài viết không được lưu.
4.a.3. Nếu người dùng chọn tiếp tục chỉnh sửa thì hệ thống quay lại màn hình tạo bài viết, cho phép tiếp tục chỉnh sửa nội dung
Exception flows
5.a.Nếu người dùng nhập thông tin không hợp lệ thì hệ thống hiển thị thông báo lỗi, chỉ rõ các trường chưa hợp lệ (thiếu tiêu đề, nội dung rỗng, định dạng sai…) và yêu cầu nhập lại.
6.a. Nếu hệ thống gặp lỗi khi lưu bài viết thì hệ thống hiển thị thông báo “Không thể tạo bài viết, vui lòng thử lại sau.” và bài viết được lưu dưới dạng bản nháp
Business rules
Nội dung bài viết không được chứa các từ khóa bị cấm, vi phạm pháp luật, nội dung quảng cáo hoặc spam
Bài viết phải được Admin kiểm duyệt trước khi hiển thị công khai 
Người dùng chỉ được chỉnh sửa, xóa bài viết do chính mình tạo
Non-functional Requirements
N/A



9.2. UC Chỉnh sửa bài viết
Use case ID
9.2
Use case Name
Chỉnh sửa bài viết
Description
Là một người dùng, tôi muốn chỉnh sửa bài viết do mình đã tạo trên diễn đàn để cập nhật hoặc điều chỉnh thông tin cho chính xác hơn
Actors
Người dùng đã đăng nhập
Priority
Cao
Triggers
Người dùng chọn chức năng “Chỉnh sửa” đối với bài viết của mình
Pre-conditions
- Người dùng đã đăng nhập vào hệ thống.
- Tài khoản người dùng đang ở trạng thái hoạt động (Không bị khóa).
- Bài viết do chính người dùng tạo.
- Bài viết đang ở trạng thái Nháp, Chờ duyệt.
Post-conditions
- Nội dung bài viết được cập nhật thành công
Main flow
Người dùng truy cập danh sách bài viết của mình.
Người dùng chọn bài viết cần chỉnh sửa và chọn chức năng “Chỉnh sửa”.
Hệ thống hiển thị màn hình chỉnh sửa bài viết với dữ liệu hiện tại.
Người dùng chỉnh sửa thông tin bài viết, 1 số thông tin có thể chỉnh sửa bao gồm:
Tiêu đề bài viết
Nội dung bài viết
Danh mục / hình thức lừa đảo
Thông tin liên quan (đường dẫn, website, hình ảnh/video minh chứng - nếu có)
Người dùng chọn “Lưu thay đổi”.
Hệ thống kiểm tra tính hợp lệ của dữ liệu đã chỉnh sửa.
Hệ thống cập nhật bài viết vào cơ sở dữ liệu và hiển thị thông báo “Cập nhật bài viết thành công”.
Alternative flows
5.a. Nếu người dùng thoát khỏi màn hình chỉnh sửa khi chưa lưu thì hệ thống hiển thị hộp thoại xác nhận với các lựa chọn:
Lưu bản nháp
Bỏ thay đổi
Tiếp tục chỉnh sửa
5.a.1. Nếu người dùng chọn Lưu bản nháp thì hệ thống lưu nội dung đã chỉnh sửa với trạng thái Nháp và kết thúc
5.a.2. Nếu người dùng chọn bỏ bài viết thì hệ thống thoát ra khỏi màn hình tạo bài viết và dữ liệu bài viết không được lưu.
5.a.3. Nếu người dùng chọn tiếp tục chỉnh sửa thì hệ thống quay lại màn hình tạo bài viết, cho phép tiếp tục chỉnh sửa nội dung
Exception flows
5.b. Nếu người dùng nhập thông tin không hợp lệ thì hệ thống hiển thị thông báo lỗi, chỉ rõ các trường chưa hợp lệ (thiếu tiêu đề, nội dung rỗng, định dạng sai…) và yêu cầu nhập đầy đủ
7.a. Nếu hệ thống gặp lỗi khi lưu bài viết thì hệ thống hiển thị thông báo “Không thể chỉnh sửa bài viết, vui lòng thử lại sau.” và kết thúc
Business rules
- Người dùng chỉ được chỉnh sửa bài viết có trạng thái là Nháp hoặc Chờ duyệt và do chính mình tạo.
- Nội dung chỉnh sửa phải phù hợp với Điều khoản sử dụng (Không chứa các từ khóa cấm, không vi phạm pháp luật, không chứa nội dung quảng cáo hoặc spam).
- Người dùng không được phép chỉnh sửa nội dung bài viết có trạng thái “Đã đăng”.
Non-functional Requirements
N/A




9.3. Xóa bài viết 

Use case ID
9.3
Use case Name
Xóa bài viết
Description
Là một người dùng, tôi muốn xóa bài viết do mình đã tạo trên diễn đàn khi bài viết không còn phù hợp hoặc được tạo nhầm.
Actors
Người dùng đã đăng nhập
Priority
Trung bình
Triggers
Người dùng chọn chức năng “Xóa bài viết” đối với bài viết của mình.
Pre-conditions
- Người dùng đã đăng nhập vào hệ thống.
- Tài khoản người dùng đang ở trạng thái hoạt động (không bị khóa).
- Bài viết do chính người dùng tạo 
Post-conditions
- Bài viết được xóa khỏi hệ thống.
- Hệ thống cập nhật lại danh sách bài viết của người dùng.
Main flow
Người dùng truy cập danh sách bài viết của mình.
Người dùng chọn bài viết cần xóa.
Người dùng chọn chức năng “Xóa bài viết”.
Hệ thống hiển thị hột bái xác nhận xóa bài viết..
Người dùng chọn Xác nhận xóa.
Hệ thống xóa bài viết khỏi cơ sở dữ liệu và hiển thị thông báo “Xóa bài viết thành công”.
Alternative flows
5.a. Người dùng chọn Hủy tại hộp thoại xác nhận thì bài viết không bị xóa và hệ thống quay lại màn hình danh sách bài viết
Exception flows
6.a. Hệ thống gặp lỗi khi xóa bài viết thì hiển thị thông báo “Không thể xóa bài viết, vui lòng thử lại sau.”
Business rules
- Người dùng chỉ được xóa bài viết do chính mình tạo.
- Admin có quyền xóa bài viết nếu bài viết bị vi phạm.
Non-functional Requirements
N/A





9.4. Xem danh sách các bài đăng của chính mình / của 1 người dùng cụ thể

Use case ID
9.4
Use case Name
Xem danh sách bài đăng của người dùng
Description
Là một người dùng, tôi muốn xem danh sách các bài viết của chính tôi hoặc một người dùng cụ thể đã đăng, để dễ theo dõi, quản lý hoặc xem lại các nội dung đã chia sẻ trên diễn đàn.
Actors
Người dùng
Priority
Trung bình
Triggers
Người dùng truy cập trang cá nhân và chọn chức năng xem danh sách bài viết của một người dùng cụ thể.
Pre-conditions
- Người dùng đã đăng nhập vào diễn đàn
Post-conditions
- Danh sách các bài viết của người dùng được hiển thị.
Main flow
Người dùng truy cập trang cá nhân của mình.
Người dùng chọn mục “Bài viết của tôi”.
Hệ thống lấy danh sách tất cả bài viết do người dùng tạo.
Hệ thống hiển thị danh sách bài viết bao gồm những thông tin sau:
Tiêu đề bài viết
Thời gian tạo
Thời gian đăng
Trạng thái bài viết (Nháp / Chờ duyệt / Đã đăng)
Số lượng bày tỏ cảm xúc
Số bình luận
Số lượt chia sẻ
Alternative flows
1.a. Người dùng xem danh sách bài viết của người khác:
1.a.1. Người dùng truy cập trang cá nhân của một người dùng khác
1.a.2. Người dùng chọn mục “Bài viết”
1.a.3. Hệ thống chỉ lấy các bài viết của người dùng đó ở trạng thái “Đã đăng”
1.a.4. Hệ thống hiển thị danh sách bài viết, bao gồm:
Tiêu đề bài viết
Thời gian đăng
Số bình luận
3.a. Nếu người dùng không có bài viết nào thì hệ thống hiển thị thông báo “Danh sách bài viết trống”
Exception flows
3.b. Nếu hệ thống bị lỗi khi tải dữ liệu thì hệ thống hiển thị thông báo “Lỗi hệ thống, vui lòng thử lại sau.”
Business rules
- Người dùng chỉ được xem bài nháp và bài chờ duyệt của chính mình.
- Người dùng của được xem bài đã đăng của người dùng khác.
- Quyền chỉnh sửa, xóa bài viết chỉ áp dụng cho chủ sở hữu bài viết hoặc quản trị viên.
- Danh sách bài viết được sắp xếp theo mặc định thời gian giảm dần.
Non-functional Requirements
N/A



11. Đăng xuất
Use case ID
11
Use case name
Đăng xuất
Description
Là một người dùng tôi muốn đăng xuất khỏi web ScamAlert VN – Diễn đàn chia sẻ thông tin chống lừa đảo để kết thúc phiên làm việc của mình.
Actors
Người dùng đã đăng nhập
Priority
Trung bình
Triggers
Người dùng chọn chức năng đăng xuất trên giao diện hệ thống.
Pre-conditions
- Người dùng đã đăng nhập vào hệ thống.
Post-conditions
- Phiên đăng nhập của người dùng được kết thúc.
- Hệ thống chuyển về màn hình trang chủ dành cho khách.
Main flow
1. Người dùng chọn chức năng Đăng xuất.
2. Hệ thống hiển thị hộp thoại xác nhận đăng xuất.
3. Người dùng chọn Xác nhận.
4. Hệ thống hủy phiên đăng nhập  của người dùng và quay trở về màn hình trang chủ dành cho khách.
Alternative flows
3.a. Nếu người dùng chọn “Hủy” thì hệ thống quay lại màn hình đang sử dụng.
Exception flows
4.a. Nếu hệ thống gặp lỗi trong quá trình đăng xuất thì hệ thống hiển thị thông báo:”Đăng xuất không thành công, vui lòng thử lại sau.”
Business rules
N/A
Non-functional requirements
N/A





