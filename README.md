# Camera Access

Frontend demo bằng HTML, CSS và JavaScript thuần cho cổng phụ huynh và trang quản trị quyền camera theo lớp.

## Chạy trên máy

Mở trực tiếp `FE-developer/index.html` trong Chrome hoặc Edge. Tất cả ảnh, CSS và JavaScript được đọc từ thư mục dự án.

Mật khẩu dùng thử chung là `CameraDemo26`. Tên đăng nhập `admin` mở cổng Quản trị. Dùng `trang@example.test` để thử tài khoản có hai con và `nam@example.test` để thử camera ngoại tuyến.

Bản này dùng để luyện tập tại nhà theo tài liệu phân công v1.1. Buổi diễn tập có giám sát sẽ dựng lại theo quy định của buổi.

## Đối soát quyền khi hồ sơ học sinh thay đổi

Mở **Tổng quan → Đối soát quyền** bằng tài khoản quản trị. Bản cập nhật mẫu chuyển Nguyễn Minh Anh sang 3A2 và ghi nhận Trần Khánh Linh nghỉ học. Trước khi áp dụng, hệ thống cho xem lớp trước và sau, cùng danh sách quyền sẽ được cấp hoặc thu hồi. Khi dữ liệu đổi sau lúc đối soát, quản trị phải xem lại kết quả mới.

Kết quả mẫu gồm hai hồ sơ thay đổi, một quyền được cấp và hai quyền bị thu hồi. Hành lang dùng chung vẫn được cấp qua lớp của con đang học. Mở sẵn camera 3A1 ở tab phụ huynh để thấy Viewer dừng phát ngay sau khi quản trị duyệt.

- [Kịch bản trình bày 3 phút](docs/demo-script.md)
- [Kế hoạch diễn tập 180 phút cho 5 người](docs/dien-tap-180-phut.md)

## Tra cứu quyền camera

Trong Quản trị, mở **Tra cứu quyền** rồi chọn tài khoản phụ huynh và camera. Kết quả giải thích quyết định bằng hồ sơ học sinh liên kết, trạng thái đang học và lớp được gán cho camera. Có thể mở thẳng ca Nguyễn Thu Trang và camera 3A1 bằng phần đường dẫn `#/quan-tri/tra-cuu?parentId=PH001&cameraId=cam-3a1`.

Trong màn hình tra cứu, chọn Trần Hoàng Nam và camera sân sinh hoạt trước khi áp dụng lô. Tài khoản có quyền qua Trần Khánh Linh ở lớp 4A1. Thiết bị đang ngoại tuyến nên Viewer báo chưa thể phát.

## Quy tắc quyền

- Một tài khoản nhận quyền qua tất cả con đang học. Camera được gán cho một hay nhiều lớp và xuất hiện một lần trong danh sách.
- Chuyển lớp, nghỉ học hoặc thay đổi lớp gắn với camera sẽ tính lại quyền ngay trong phiên demo. Dashboard đang mở tự cập nhật danh sách. Camera ngoại tuyến vẫn nằm trong danh sách của tài khoản được cấp quyền.
- Viewer cho biết học sinh nào tạo quyền xem, hiển thị tình trạng thiết bị và trạng thái phát. **Dùng webcam máy này** xem hình trực tiếp sau khi người dùng cấp quyền trình duyệt. Webcam chỉ hiển thị trên máy hiện tại và được tắt khi rời Viewer. Khi mất quyền, Viewer dừng phát và bỏ nguồn video.
- **Tài khoản demo** trong Quản trị cho phép tạo tài khoản, liên kết học sinh và khóa/mở quyền riêng từng phụ huynh. Dùng email mẫu kết thúc bằng `.test` khi tạo. Profile cho phép đổi tên, email liên hệ và số điện thoại.
- Bản chạy local lưu hồ sơ, cấu hình và nhật ký trong trình duyệt. Phiên đăng nhập dùng bộ nhớ phiên, còn nút khôi phục đưa lớp, camera và nhật ký về mẫu. Tài khoản đã tạo và Profile vẫn dùng được.

## Mã nguồn

- `index.html` chứa điểm mở cổng và các khung giao diện. Điều hướng dùng phần sau dấu `#` trên cùng tệp để đổi vai trò trong một phiên. Các đường dẫn HTML cũ chuyển về điểm mở tương ứng.
- `assets/js/mock-data.js` chứa dữ liệu mẫu theo mã học sinh, lớp, phụ huynh và camera.
- `assets/js/camera-access.js` cung cấp hàm đọc dữ liệu, tính quyền, xem trước tác động và ghi thay đổi. Khi trình duyệt cho phép, phiên demo được lưu qua tải lại trong cùng tab.
- `assets/js/service.js` cung cấp Promise, mã lỗi và kiểm tra vai trò cho giao diện. Xem [hợp đồng dữ liệu](docs/data-contract.md).
- `assets/js/pages/` chứa giao diện từng màn hình.

## An toàn trong bản frontend

- Trang chính dùng Content Security Policy (CSP) để chỉ nạp mã, CSS và clip từ nguồn local của app, đồng thời chặn script inline và các yêu cầu kết nối mạng do giao diện tạo. Webcam local vẫn dùng được sau khi người dùng cấp quyền. Xem [CSP trên MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP).
- Route và service mô phỏng kiểm tra vai trò và quyền theo từng camera. Dữ liệu bản luyện nằm trong trình duyệt và dùng cho mục đích diễn tập. Khi tích hợp thật, máy chủ xác thực người dùng và áp dụng quyền ở cả API và đường phát video. Xem [OWASP về kiểm tra quyền](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html).

## Chuẩn bị nối nguồn thật

- **Quản trị → Danh mục camera → Nguồn để thử tích hợp** có liên kết tới camera giao thông WVCams và các nguồn kiểm thử. Viewer chính phát video local.
- Khi có tài liệu OpenAPI của hệ thống trường, [nhập vào Postman](https://learning.postman.com/v11/docs/getting-started/importing-and-exporting/importing-from-swagger) để kiểm tra response và đối chiếu ID học sinh, lớp, liên kết phụ huynh với contract trước khi thay mock bằng request thật.
- Quyền truy cập thật, địa chỉ thiết bị nội bộ và khóa truy cập camera thuộc phần backend/tích hợp được nhà trường cấp. Sau khi kiểm tra quyền, backend cung cấp nguồn phát phù hợp cho trình duyệt.

## Nguồn video diễn tập

Ví dụ camera 3A1 và 3A2 dùng clip lớp học trống. Hành lang và sân chơi dùng clip quay mẫu ở khu vực tương ứng. Các clip đi kèm bản diễn tập theo [giấy phép Pexels](https://www.pexels.com/license/).

- Lớp 3A1. [Pavel Danilyuk](https://www.pexels.com/video/an-empty-classroom-8342689/)
- Lớp 3A2. [Erkan Avanoğlu](https://www.pexels.com/video/empty-classroom-with-desks-and-tables-20421536/)
- Hành lang. [Joseph Park](https://www.pexels.com/video/empty-hallway-in-school-13008039/)
- Sân chơi. [James Cover](https://www.pexels.com/video/an-empty-playground-7009336/)
