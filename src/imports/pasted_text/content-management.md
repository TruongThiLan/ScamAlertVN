3. Kiểm duyệt và quản lý nội dung
3.1. Duyệt hoặc từ chối bài viết

Use case ID
3.1
Use case name
Duyệt hoặc từ chối bài viết
Description
Là quản trị viên, tôi muốn duyệt hoặc từ chối các bài viết do người dùng đăng để đảm bảo nội dung hiển thị trên diễn đàn là chính xác và phù hợp với mục tiêu chống lừa đảo.
Actors
Quản trị viên
Priority
Cao
Triggers
Quản trị viên chọn chức năng “Kiểm duyệt và quản lý nội dung”.
Pre-conditions
- Quản trị viên đã đăng nhập hệ thống.
- Bài viết đang ở trạng thái chờ duyệt.
Post-conditions
- Bài viết được duyệt và hiển thị công khai hoặc bài viết bị từ chối và không hiển thị.
Main flow
1. Quản trị viên chọn chức năng “Kiểm duyệt và quản lý nội dung”.
2. Hệ thống hiển thị danh sách bài viết chờ duyệt.
3. Quản trị viên chọn bài viết cần xem.
4. Quản trị viên chọn “Duyệt bài viết”.
5. Hệ thống cập nhật trạng thái bài viết thành “Đã duyệt”.
6. Hệ thống hiển thị bài viết công khai.
Alternative flows
4a. Quản trị viên chọn “Từ chối bài viết”.
4a.1 Quản trị viên nhập lý do từ chối.
4a.2 Hệ thống cập nhật trạng thái bài viết thành “Bị từ chối”.
4a.3 Hệ thống gửi thông báo cho người đăng bài.
Exception flows
3a. Bài viết không tồn tại → Hệ thống thông báo lỗi.
Business rules
- Chỉ người dùng có vai trò quản trị viên mới được phép duyệt hoặc từ chối bài viết.
- Chỉ các bài viết đang ở trạng thái chờ duyệt mới được phép xử lý duyệt hoặc từ chối.
- Mỗi bài viết tại một thời điểm chỉ được tồn tại ở một trạng thái duy nhất.
- Khi bài viết được duyệt, hệ thống phải cập nhật trạng thái thành đã duyệt và cho phép hiển thị công khai.
- Khi bài viết bị từ chối, quản trị viên bắt buộc phải nhập lý do từ chối.
- Bài viết bị từ chối không được hiển thị công khai trên hệ thống.
- Hệ thống phải gửi thông báo kèm lý do từ chối cho người đăng bài.
- Mỗi bài viết chỉ được duyệt hoặc từ chối một lần trong trạng thái chờ duyệt.
- Hệ thống phải lưu thông tin người xử lý và thời điểm duyệt hoặc từ chối bài viết.
Non-functional Requirements
N/A











3.2. Xóa bài viết vi phạm nghiêm trọng

Use case ID
3.2
Use case name
Xóa bài viết 
Description
Là quản trị viên, tôi muốn xóa các bài viết vi phạm nghiêm trọng để ngăn chặn thông tin sai lệch hoặc gây ảnh hưởng xấu đến cộng đồng.
Actors
Quản trị viên
Priority
Cao
Triggers
Quản trị viên chọn chức năng “Xóa bài viết”.
Pre-conditions
- Quản trị viên đã đăng nhập.
- Bài viết tồn tại trong hệ thống.
Post-conditions
Bài viết bị xóa khỏi hệ thống và không còn hiển thị.
Main flow
1. Quản trị viên truy cập danh sách bài viết.
2. Quản trị viên chọn bài viết vi phạm.
3. Quản trị viên chọn “Xóa bài viết”.
4. Quản trị viên chọn/nhập lý do xoá.
5. Hệ thống yêu cầu xác nhận.
6. Quản trị viên xác nhận xóa.
7. Hệ thống xóa bài viết khỏi hệ thống.
Alternative flows
5a. Quản trị viên hủy thao tác → Hệ thống không xóa bài viết.
Exception flows
N/A.
Business rules
- Chỉ người dùng có vai trò quản trị viên mới được phép xóa bài viết.
- Chỉ các bài viết tồn tại trong hệ thống mới được phép thực hiện thao tác xóa.
- Chỉ bài viết được xác định là vi phạm nghiêm trọng mới được phép xóa khỏi hệ thống.
- Khi thực hiện xóa bài viết, quản trị viên bắt buộc phải chọn hoặc nhập lý do xóa.
- Hệ thống phải yêu cầu quản trị viên xác nhận trước khi thực hiện xóa bài viết.
- Khi quản trị viên hủy thao tác xác nhận, hệ thống không được xóa bài viết.
- Sau khi xóa, bài viết phải bị loại bỏ hoàn toàn khỏi hệ thống và không còn hiển thị.
- Hệ thống phải lưu thông tin người xóa, lý do xóa và thời điểm xóa bài viết.
Non-functional Requirements
N/A









3.3. Ẩn hoặc khóa bài viết có nội dung không phù hợp

Use case ID
3.3
Use case name
Ẩn hoặc khóa bài viết
Description
Là quản trị viên, tôi muốn ẩn hoặc khóa các bài viết có nội dung không phù hợp để tạm thời ngăn người dùng truy cập hoặc tương tác.
Actors
Quản trị viên
Priority
Trung bình
Triggers
Quản trị viên chọn chức năng “Ẩn bài viết” hoặc “Khóa bài viết”.
Pre-conditions
- Quản trị viên đã đăng nhập.
- Bài viết tồn tại trên hệ thống.
Post-conditions
- Bài viết bị ẩn hoặc bị khóa.
- Người dùng không thể xem hoặc tương tác.
Main flow
1. Quản trị viên chọn bài viết.
2. Chọn “Ẩn” hoặc “Khóa”.
3. Hệ thống yêu cầu nhập lý do.
4. Quản trị viên nhập lý do và xác nhận.
5. Hệ thống cập nhật trạng thái & lưu lý do.
6. Hệ thống gửi thông báo cho người đăng bài.
Alternative flows
3a. Quản trị viên không nhập lý do → Hệ thống không cho tiếp tục và yêu cầu nhập lý do.
Exception flows
2a. Bài viết đã bị khóa trước đó → Hệ thống thông báo trạng thái hiện tại.
Business rules
- Chỉ người dùng có vai trò quản trị viên mới được phép ẩn hoặc khóa bài viết.
- Chỉ các bài viết tồn tại trong hệ thống mới được phép thực hiện thao tác ẩn hoặc khóa.
- Khi bài viết bị ẩn, bài viết không được hiển thị cho người dùng thông thường.
- Khi bài viết bị khóa, người dùng không được phép tương tác với bài viết dưới mọi hình thức.
- Bài viết bị khóa vẫn có thể hiển thị nhưng không cho phép bình luận hoặc chỉnh sửa.
- Hệ thống phải cập nhật trạng thái bài viết ngay sau khi quản trị viên thực hiện thao tác.
- Hệ thống phải thông báo cho người đăng bài khi bài viết bị ẩn hoặc bị khóa (nếu có).
- Không được phép khóa bài viết đã ở trạng thái khóa.
Non-functional Requirements
N/A













4. Quản lý hệ thống
4.1. Quản lý danh mục lừa đảo

Use case ID
4.1
Use case name
Quản lý danh mục các hình thức lừa đảo
Description
Là quản trị viên, tôi muốn thêm, sửa hoặc xóa các danh mục hình thức lừa đảo để hỗ trợ phân loại và tra cứu thông tin.
Actors
Quản trị viên
Priority
Trung bình
Triggers
Quản trị viên chọn chức năng “Quản lý danh mục”.
Pre-conditions
Quản trị viên đã đăng nhập hệ thống.
Post-conditions
Danh mục hình thức lừa đảo được cập nhật.
Main flow
1. Quản trị viên truy cập chức năng quản lý danh mục.
2. Hệ thống hiển thị danh sách danh mục.
3. Quản trị viên chọn thao tác thêm, sửa hoặc xóa danh mục.
4. Hệ thống lưu các thông tin được cập nhật (nếu có).
Alternative flows
3a. Thêm danh mục mới.
3b. Sửa danh mục hiện có.
3c. Xóa danh mục.
Exception flows
3c.1 Danh mục đang được sử dụng → Hệ thống thông báo không thể xóa.
Business rules
- Chỉ người dùng có vai trò quản trị viên mới được phép quản lý danh mục hình thức lừa đảo.
- Hệ thống chỉ cho phép quản lý danh mục khi quản trị viên đã đăng nhập.
- Mỗi danh mục hình thức lừa đảo phải có tên duy nhất trong hệ thống.
- Khi thêm danh mục mới, hệ thống phải kiểm tra trùng lặp trước khi lưu.
- Khi sửa danh mục, hệ thống chỉ cập nhật các thông tin được thay đổi.
- Chỉ các danh mục tồn tại trong hệ thống mới được phép chỉnh sửa hoặc xóa.
- Không cho phép xóa danh mục đang được sử dụng để phân loại bài viết.
- Hệ thống phải lưu lại các thay đổi đối với danh mục hình thức lừa đảo.
Non-functional Requirements
N/A



4.2. Xem báo cáo thống kê

Use case ID
4.2
Use case name
Báo cáo thống kê
Description
Là quản trị viên, tôi muốn xem và quản lý các báo cáo thống kê của hệ thống như số lượng truy cập, số lượng bài đăng, bình luận và người dùng để đánh giá tình trạng hoạt động của diễn đàn chia sẻ thông tin chống lừa đảo.
Actors
Quản trị viên
Priority
Trung bình
Triggers
Quản trị viên chọn chức năng “Báo cáo thống kê”.
Pre-conditions
- Quản trị viên đã đăng nhập hệ thống.
Post-conditions
- Quản trị viên xem được các báo cáo thống kê theo từng tiêu chí.
- Dữ liệu báo cáo được hiển thị chính xác và cập nhật.
Main flow
1. Quản trị viên truy cập chức năng báo cáo thống kê.
2. Hệ thống hiển thị các loại báo cáo thống kê (lượt truy cập, số lượng bài đăng, số lượng bình luận, số lượng người dùng…).
3. Quản trị viên chọn loại báo cáo cần xem.
4. Hệ thống tổng hợp dữ liệu thống kê tương ứng.
5. Hệ thống hiển thị báo cáo dưới dạng bảng hoặc biểu đồ.
6. Quản trị viên xem và phân tích dữ liệu báo cáo.
Alternative flows
3a. Xem báo cáo theo khoảng thời gian
3a1. Quản trị viên chọn khoảng thời gian thống kê.
3a2. Hệ thống lọc và hiển thị dữ liệu theo thời gian đã chọn.
3b. Xuất báo cáo
3b1. Quản trị viên chọn chức năng xuất báo cáo.
3b2. Hệ thống xuất báo cáo ra file (PDF/Excel).
Exception flows
4a. Không có dữ liệu thống kê => Hệ thống thông báo “Không có dữ liệu phù hợp”.
Business rules
- Chỉ người dùng có vai trò quản trị viên mới được phép xem và quản lý báo cáo thống kê hệ thống.
- Hệ thống chỉ cho phép truy cập chức năng báo cáo khi quản trị viên đã đăng nhập.
- Dữ liệu thống kê phải được tổng hợp từ dữ liệu thực tế đang tồn tại trong hệ thống.
- Hệ thống phải hiển thị báo cáo theo đúng loại thống kê mà quản trị viên đã chọn.
- Hệ thống phải cho phép lọc và xem báo cáo theo khoảng thời gian xác định.
- Báo cáo thống kê phải được hiển thị dưới dạng bảng hoặc biểu đồ để hỗ trợ phân tích.
- Hệ thống phải đảm bảo dữ liệu báo cáo được cập nhật và hiển thị chính xác tại thời điểm xem.
- Hệ thống phải cho phép xuất báo cáo ra file PDF hoặc Excel.
- Khi không có dữ liệu phù hợp, hệ thống phải thông báo cho quản trị viên.
Non-functional Requirements
N/A



