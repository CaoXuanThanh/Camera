# Diễn tập Camera Access trong 180 phút

Mỗi người dựng và giải thích được một luồng từ thao tác giao diện đến service. Cả nhóm ghép thành một ca trường học cụ thể. Quản trị nhận hai thay đổi hồ sơ, xem trước quyền camera bị tác động, duyệt và kiểm chứng kết quả ở cổng phụ huynh.

Luyện trước trên bản local. Buổi có giám sát bắt đầu từ thư mục trống theo phân công v1.1. Việc mang tài liệu hoặc prompt vào buổi làm theo hướng dẫn của giảng viên.

## Năm phần việc chạy song song

| Thành viên | Phần việc theo phân công | Ca tự chạy và giải thích |
| --- | --- | --- |
| Cao Xuân Thành | Core, Admin và tích hợp. Cấp fixture, service và helper phiên sớm. Dùng một hàm tính quyền cho danh sách, Viewer và bản xem trước. | Đổi lớp một học sinh và cho thấy cùng một camera bị thu hồi với một phụ huynh nhưng vẫn còn với phụ huynh khác có con đang học lớp đó. |
| Nguyễn Minh Thiên | Parent Dashboard. Dùng service để render con, lớp, camera được cấp và tìm theo tên. | Tìm một camera đang có, tìm từ khóa rỗng kết quả, xóa từ khóa. Sau khi chuyển lớp, tìm theo tên camera cũ rồi kiểm tra kết quả. |
| Lương Minh Đạt | Login. Kiểm tra form, nhận lỗi từ service và điều hướng theo vai trò. | Thử thiếu dữ liệu, sai mật khẩu, đăng nhập đúng và mở đường dẫn Quản trị bằng tài khoản phụ huynh. |
| Tất Huy Tuấn | Camera Viewer. Hiển thị đúng camera theo mã, trạng thái phát và điều kiện cấp nguồn. Dùng helper khi quyền thay đổi. | Mở 3A1 khi có quyền, kiểm tra video đang phát, sau đó xác nhận player dừng và bỏ nguồn khi bị thu hồi. Thử thêm camera ngoại tuyến. |
| Đào Nhựt Quang Minh | Profile và QA. Kiểm tra form liên hệ, lưu qua service, ghi ca kiểm thử của nhóm. | Lưu thông tin hợp lệ, tải lại để kiểm tra. Thử giá trị sai và xác nhận bản đã lưu vẫn còn. Chạy kịch bản chung sau mỗi lượt tích hợp. |

Thành chốt tên trường dữ liệu, mã lỗi và URL ngay đầu giờ. Bốn phần giao diện có thể dựng trước với dữ liệu mẫu theo đúng hợp đồng. Khi core sẵn sàng, mỗi người nối phần của mình và kiểm thử một ca thành công, một ca lỗi.

## Mốc làm việc

| Phút | Công việc | Điều kiện để chuyển bước |
| --- | --- | --- |
| 0–15 | Dựng khung, chia quyền sửa file, chốt fixture và hợp đồng service. | Mọi người biết mình gọi hàm nào và dữ liệu trả về có cấu trúc gì. |
| 15–45 | Thành dựng đăng nhập, quyền và dữ liệu mẫu. Bốn bạn dựng HTML/CSS và trạng thái giao diện. | Mở được cổng và chạy được ca đăng nhập, danh sách quyền mẫu đầu tiên. Nếu chậm, giảm số hồ sơ mẫu để các trang bắt đầu tích hợp. |
| 45–90 | Nối service vào form, dashboard, Viewer và Profile. Thành tích hợp từng phần ngay khi chạy được. | Luồng vào cổng phụ huynh rồi mở video mẫu chạy trên cùng một bộ dữ liệu. |
| 90–120 | Nghiệm thu đổi lớp, thu hồi quyền và lưu hồ sơ. Thử thêm đối soát lô dữ liệu nếu luồng chính đã chạy. | Mốc tối thiểu là đổi lớp một học sinh có kết quả ở cả Dashboard lẫn Viewer. Nếu còn lỗi, dùng ca đổi lớp đơn lẻ để trình bày. |
| 120–150 | Dừng thêm tính năng. Kiểm thử tích hợp ở 375 px và 1280 px, sửa lỗi chặn demo và ghi minh chứng thật. | Test đăng nhập, quyền, phát video và Profile. Ghi ca nào đã chạy, ca nào còn lỗi. |
| 150–180 | Trình bày, phản biện hoặc dự phòng theo lịch giảng viên. | Mỗi người dẫn được một phần của luồng và giải thích phần mình sửa. |

## Cách làm việc với AI

Mỗi người chọn một task, khai báo file được sửa, hàm service và một ca lỗi cụ thể. Nhờ AI đề xuất thay đổi nhỏ hoặc tạo ca kiểm thử. Sau đó tự đọc diff, tự sửa một điều kiện và chạy lại ca đó. Ghi prompt, đoạn mình chỉnh và kết quả thực tế. Ví dụ, Thiên đổi từ khóa từ camera đang được cấp sang camera vừa bị thu hồi và giải thích vì sao bộ lọc vẫn tôn trọng danh sách từ service.

Với đối soát lô, QA kiểm tra ba thời điểm. Trước khi xác nhận, quyền cũ vẫn giữ. Sau khi xác nhận, Viewer đang xem 3A1 dừng và quyền hành lang của phụ huynh vẫn còn. Nếu dữ liệu đổi ở tab khác sau khi xem trước, quản trị bấm **Đối soát lại** rồi xác nhận bản mới.

## Bước thử với một đơn vị

Giả thuyết của bản thử là cán bộ có thể duyệt một lô thay đổi hồ sơ nhanh hơn khi thấy trước tài khoản nào được cấp và thu hồi quyền. Dùng cùng một tập hồ sơ giả để bấm giờ hai lượt, một lượt đối chiếu thủ công và một lượt dùng màn hình đối soát. Ghi thời gian từ lúc nhận hồ sơ đến khi xác nhận và số quyết định cấp hoặc thu hồi sai theo bộ đáp án.

Trong bản local, kiểm tra vai trò ở service chứng minh quy tắc của luồng mô phỏng. CSP giới hạn nguồn tài nguyên trình duyệt có thể nạp. Khi dùng dữ liệu và luồng camera thật, backend phải xác thực, kiểm tra quyền với từng yêu cầu và dịch vụ phát video phải áp dụng quyền đó cho luồng. Mốc kỹ thuật đầu tiên sau môn là kiểm tra quyền xem và thu hồi trên một kênh thử được cấp phép trong mạng trường.

[Kịch bản thao tác 3 phút](demo-script.md) · [Hợp đồng dữ liệu](data-contract.md)
