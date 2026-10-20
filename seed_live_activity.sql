/*
 * seed_live_activity.sql
 * Sinh dữ liệu "đang hoạt động" quanh thời điểm chạy script:
 *   - 3 tuần vừa qua: buổi 1-1 đã hoàn thành, lớp nhóm đã kết thúc, đánh giá, thanh toán
 *   - Hiện tại     : lớp nhóm đang học (điểm danh các buổi đã qua)
 *   - 30 ngày tới  : lịch dạy 1-1 còn trống / đã đặt, lớp sắp khai giảng, chuyến du lịch
 *   - Đối soát     : vài khoản admin đã trả giáo viên (cần chạy migration AddTeacherPayouts trước)
 *
 * Chạy lại bao nhiêu lần cũng được: mọi bản ghi do script tạo được ghi vào dbo.__SeedLive
 * và bị xoá ở đầu mỗi lần chạy, rating giáo viên được khôi phục từ dbo.__SeedLiveProfile.
 * Dữ liệu người dùng thật tạo trên dữ liệu seed (đặt lịch, ghi danh, lời mời...) được giữ lại,
 * cùng với lịch / lớp / chuyến seed mà chúng phụ thuộc.
 *
 * Quy ước thời gian (theo code backend):
 *   - DateTime (lịch 1-1, booking, payment, review, enrollment...) lưu UTC
 *   - ClassSessions.StudyDate/StartTime/EndTime và TeacherClasses.StartTime/EndTime là giờ Việt Nam
 *
 * Cách chạy:
 *   sqlcmd -S localhost\SQLEXPRESS -E -C -d vietnamese -f 65001 -i seed_live_activity.sql
 */
:on error exit
SET NOCOUNT ON;
SET XACT_ABORT ON;
SET LANGUAGE us_english;
GO

IF OBJECT_ID('dbo.__SeedLive') IS NULL
    CREATE TABLE dbo.__SeedLive (TableName sysname NOT NULL, Id int NOT NULL);
IF OBJECT_ID('dbo.__SeedLiveProfile') IS NULL
    CREATE TABLE dbo.__SeedLiveProfile (TeacherProfileId int PRIMARY KEY, RatingAverage decimal(3,2) NULL, TotalReviews int NULL);
GO

/* ---------------------------------------------------------------
 * 1. Xoá dữ liệu seed của lần chạy trước
 * --------------------------------------------------------------- */
BEGIN TRAN;

/*
 * Chỉ xoá dữ liệu script đã tạo. Người dùng thật có thể đã đặt lịch / ghi danh / gửi lời mời
 * trên dữ liệu seed qua giao diện → những dòng đó (và dòng seed chúng phụ thuộc) được GIỮ LẠI,
 * trở thành dữ liệu thật; chỉ phần seed xung quanh bị xoá.
 *   - booking / enrollment là của seed khi có payment do seed tạo (payment được ghi vào __SeedLive)
 *   - lịch 1-1 / lớp nhóm chỉ bị xoá khi không còn booking / enrollment của người dùng
 *   - lời mời / chuyến du lịch chỉ bị xoá khi cả trip lẫn schedule đều là của seed
 */
DECLARE @seedPay TABLE (Id int PRIMARY KEY);
DECLARE @av TABLE (Id int PRIMARY KEY);
DECLARE @bk TABLE (Id int PRIMARY KEY);
DECLARE @cl TABLE (Id int PRIMARY KEY);
DECLARE @clKeep TABLE (Id int PRIMARY KEY);
DECLARE @se TABLE (Id int PRIMARY KEY);
DECLARE @en TABLE (Id int PRIMARY KEY);
DECLARE @tr TABLE (Id int PRIMARY KEY);
DECLARE @sc TABLE (Id int PRIMARY KEY);

INSERT @seedPay SELECT DISTINCT Id FROM dbo.__SeedLive WHERE TableName = 'Payments';

-- booking của seed: nằm trên lịch seed và có payment seed
INSERT @bk
SELECT b.BookingId
FROM dbo.Bookings b
WHERE b.AvailabilityId IN (SELECT Id FROM dbo.__SeedLive WHERE TableName = 'TeacherAvailabilities')
  AND EXISTS (SELECT 1 FROM dbo.Payments p
              WHERE p.RefName = 'PrivateLesson' AND p.RefId = b.BookingId
                AND p.PaymentId IN (SELECT Id FROM @seedPay));

-- lịch seed không còn booking nào của người dùng
INSERT @av
SELECT DISTINCT s.Id
FROM dbo.__SeedLive s
WHERE s.TableName = 'TeacherAvailabilities'
  AND NOT EXISTS (SELECT 1 FROM dbo.Bookings b
                  WHERE b.AvailabilityId = s.Id AND b.BookingId NOT IN (SELECT Id FROM @bk));

-- enrollment của seed: thuộc lớp seed và có payment seed
INSERT @en
SELECT ce.EnrollmentId
FROM dbo.ClassEnrollments ce
WHERE ce.ClassId IN (SELECT Id FROM dbo.__SeedLive WHERE TableName = 'TeacherClasses')
  AND EXISTS (SELECT 1 FROM dbo.Payments p
              WHERE p.RefName = 'CLASS' AND p.RefId = ce.EnrollmentId
                AND p.PaymentId IN (SELECT Id FROM @seedPay));

-- lớp seed: xoá hẳn nếu không còn học viên thật, ngược lại giữ lớp (chỉ bỏ học viên seed)
INSERT @cl
SELECT DISTINCT s.Id
FROM dbo.__SeedLive s
WHERE s.TableName = 'TeacherClasses'
  AND NOT EXISTS (SELECT 1 FROM dbo.ClassEnrollments ce
                  WHERE ce.ClassId = s.Id AND ce.EnrollmentId NOT IN (SELECT Id FROM @en));
INSERT @clKeep
SELECT DISTINCT s.Id FROM dbo.__SeedLive s
WHERE s.TableName = 'TeacherClasses' AND s.Id NOT IN (SELECT Id FROM @cl);
INSERT @se SELECT SessionId FROM dbo.ClassSessions WHERE ClassId IN (SELECT Id FROM @cl);

INSERT @tr SELECT DISTINCT Id FROM dbo.__SeedLive WHERE TableName = 'StudentTrips';
INSERT @sc SELECT DISTINCT Id FROM dbo.__SeedLive WHERE TableName = 'TeacherSchedules';

-- Payments/Reviews tham chiếu đa hình (RefName + RefId), DB gốc có bản ghi mồ côi
-- nên chỉ xoá đúng những dòng script đã tạo
IF OBJECT_ID('dbo.TeacherPayouts') IS NOT NULL
    DELETE FROM dbo.TeacherPayouts WHERE PayoutId IN (SELECT Id FROM dbo.__SeedLive WHERE TableName = 'TeacherPayouts');
DELETE FROM dbo.Reviews WHERE ReviewId IN (SELECT Id FROM dbo.__SeedLive WHERE TableName = 'Reviews');
DELETE FROM dbo.Payments WHERE PaymentId IN (SELECT Id FROM @seedPay);

-- điểm danh: buổi của lớp bị xoá + học viên seed trong lớp được giữ lại
DELETE FROM dbo.ClassAttendances WHERE SessionId IN (SELECT Id FROM @se);
DELETE a FROM dbo.ClassAttendances a
JOIN dbo.ClassSessions s ON s.SessionId = a.SessionId
JOIN dbo.ClassEnrollments ce ON ce.ClassId = s.ClassId AND ce.StudentId = a.StudentId
WHERE s.ClassId IN (SELECT Id FROM @clKeep) AND ce.EnrollmentId IN (SELECT Id FROM @en);

DELETE FROM dbo.ClassEnrollments WHERE EnrollmentId IN (SELECT Id FROM @en);
DELETE FROM dbo.ClassSessions WHERE SessionId IN (SELECT Id FROM @se);
DELETE FROM dbo.ClassScheduleDays WHERE ClassId IN (SELECT Id FROM @cl);
UPDATE dbo.MatchRequests SET ClassId = NULL WHERE ClassId IN (SELECT Id FROM @cl);
DELETE FROM dbo.TeacherClasses WHERE ClassId IN (SELECT Id FROM @cl);

-- lớp được giữ: sĩ số = học viên còn hiệu lực
UPDATE tc SET CurrentStudents =
    (SELECT COUNT(*) FROM dbo.ClassEnrollments ce WHERE ce.ClassId = tc.ClassId AND ce.Status IN (1, 2, 3))
FROM dbo.TeacherClasses tc WHERE tc.ClassId IN (SELECT Id FROM @clKeep);

DELETE FROM dbo.Bookings WHERE BookingId IN (SELECT Id FROM @bk);
DELETE FROM dbo.TeacherAvailabilities WHERE AvailabilityId IN (SELECT Id FROM @av);

-- du lịch: chỉ xoá lời mời / chuyến ghép giữa trip seed và schedule seed
DELETE FROM dbo.TravelBookings WHERE TripId IN (SELECT Id FROM @tr) AND ScheduleId IN (SELECT Id FROM @sc);
DELETE FROM dbo.MatchRequests WHERE TripId IN (SELECT Id FROM @tr) AND ScheduleId IN (SELECT Id FROM @sc);
-- trip / schedule seed còn dính lời mời hoặc chuyến của người dùng thật thì giữ lại
DELETE FROM @tr WHERE Id IN (SELECT TripId FROM dbo.MatchRequests UNION SELECT TripId FROM dbo.TravelBookings);
DELETE FROM @sc WHERE Id IN (SELECT ScheduleId FROM dbo.MatchRequests UNION SELECT ScheduleId FROM dbo.TravelBookings);
UPDATE dbo.TeacherClasses SET TripId = NULL, ReservedStudentId = NULL WHERE TripId IN (SELECT Id FROM @tr);
DELETE FROM dbo.StudentTrips WHERE TripId IN (SELECT Id FROM @tr);
DELETE FROM dbo.TeacherSchedules WHERE ScheduleId IN (SELECT Id FROM @sc);

UPDATE tp SET RatingAverage = b.RatingAverage, TotalReviews = b.TotalReviews
FROM dbo.TeacherProfiles tp
JOIN dbo.__SeedLiveProfile b ON b.TeacherProfileId = tp.TeacherProfileId;

DELETE FROM dbo.__SeedLive;
GO

/* ---------------------------------------------------------------
 * 2. Sinh dữ liệu mới
 * --------------------------------------------------------------- */
DECLARE @nowUtc  datetime = GETUTCDATE();
DECLARE @todayVN date     = CAST(DATEADD(hour, 7, @nowUtc) AS date);
DECLARE @demoLearner int  = (SELECT UserId FROM dbo.Users WHERE Email = 'demo.learner@example.test');

-- Giáo viên đã được duyệt (TeacherProfiles.Status = 4 ApprovedTeacher)
SELECT tp.TeacherProfileId, tp.UserId,
       CAST(ISNULL(NULLIF(tp.ApprovedPricePerHour, 0), 20) AS decimal(18,2)) AS Price,
       ROW_NUMBER() OVER (ORDER BY tp.TeacherProfileId) AS tn
INTO #t
FROM dbo.TeacherProfiles tp
JOIN dbo.Users u ON u.UserId = tp.UserId
WHERE tp.Status = 4 AND u.Status = 1;

INSERT dbo.__SeedLiveProfile (TeacherProfileId, RatingAverage, TotalReviews)
SELECT tp.TeacherProfileId, tp.RatingAverage, tp.TotalReviews
FROM dbo.TeacherProfiles tp
JOIN #t ON #t.TeacherProfileId = tp.TeacherProfileId
WHERE NOT EXISTS (SELECT 1 FROM dbo.__SeedLiveProfile b WHERE b.TeacherProfileId = tp.TeacherProfileId);

-- Học viên (RoleId = 1 User)
SELECT UserId, ROW_NUMBER() OVER (ORDER BY UserId) - 1 AS sn
INTO #s
FROM dbo.Users WHERE RoleId = 1 AND Status = 1;
DECLARE @studentCount int = (SELECT COUNT(*) FROM #s);

-- Nội dung đánh giá
DECLARE @cm TABLE (i int IDENTITY(0,1), Comment nvarchar(400));
INSERT @cm (Comment) VALUES
 (N'Cô dạy rất dễ hiểu, phát âm chuẩn. Mình đã tự tin hơn khi nói tiếng Việt.'),
 (N'Great lesson! The teacher corrected my tones patiently and gave useful examples.'),
 (N'Buổi học vui, nhiều tình huống thực tế khi đi chợ và gọi món.'),
 (N'Very well prepared. I finally understand the difference between dấu hỏi and dấu ngã.'),
 (N'Thầy nhiệt tình, giải thích ngữ pháp rõ ràng. Sẽ đặt thêm buổi nữa.'),
 (N'Good pace and lots of speaking practice. Highly recommended for beginners.'),
 (N'Lesson was fine, but I would like more homework between sessions.'),
 (N'The class materials were excellent and the teacher made everyone participate.'),
 (N'Học xong mình đã có thể tự hỏi đường và đi taxi ở Hà Nội.'),
 (N'Friendly teacher, clear explanations, and very punctual.');
DECLARE @cmCount int = (SELECT COUNT(*) FROM @cm);

DECLARE @newReviews TABLE (ReviewId int, InstructorId int, Rating int);

-- ID của các bảng được tham chiếu đa hình bắt đầu từ 1000 để không trùng RefId mồ côi trong DB gốc
-- (Payments.RefId tới 215, VideoRooms.RefId tới 168)
IF IDENT_CURRENT('dbo.Bookings') < 1000         DBCC CHECKIDENT ('dbo.Bookings', RESEED, 1000) WITH NO_INFOMSGS;
IF IDENT_CURRENT('dbo.ClassEnrollments') < 1000 DBCC CHECKIDENT ('dbo.ClassEnrollments', RESEED, 1000) WITH NO_INFOMSGS;
IF IDENT_CURRENT('dbo.TeacherClasses') < 1000   DBCC CHECKIDENT ('dbo.TeacherClasses', RESEED, 1000) WITH NO_INFOMSGS;

/* ---------- 2a. Lịch dạy 1-1, booking, thanh toán, đánh giá ---------- */
;WITH d AS (SELECT TOP (52) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) - 22 AS d FROM sys.all_objects), -- -21..+30 ngày
      h AS (SELECT v FROM (VALUES (9), (11), (14), (16), (19)) x(v))                                       -- giờ VN
SELECT t.UserId AS InstructorId, t.Price,
       DATEADD(hour, h.v - 7, CAST(DATEADD(day, d.d, @todayVN) AS datetime)) AS StartUtc,
       ABS(CHECKSUM(NEWID())) % 100 AS r1, ABS(CHECKSUM(NEWID())) % 100 AS r2,
       ABS(CHECKSUM(NEWID())) % 100 AS r3, ABS(CHECKSUM(NEWID())) % 1000 AS r4,
       ABS(CHECKSUM(NEWID())) % 100 AS r5, ABS(CHECKSUM(NEWID())) % 100 AS r6,
       ABS(CHECKSUM(NEWID())) % 100 AS r7, ABS(CHECKSUM(NEWID())) % 100 AS r8,
       ABS(CHECKSUM(NEWID())) % 100 AS pick
INTO #slotRaw
FROM #t t CROSS JOIN d CROSS JOIN h;

SELECT ROW_NUMBER() OVER (ORDER BY s.InstructorId, s.StartUtc) AS k,
       s.*, DATEADD(minute, 60, s.StartUtc) AS EndUtc, p.Phase,
       b.Booked
INTO #slotA
FROM (SELECT * FROM #slotRaw WHERE pick < 20) s
CROSS APPLY (SELECT CASE WHEN DATEADD(minute, 60, s.StartUtc) <= @nowUtc THEN 'P'   -- đã qua
                         WHEN s.StartUtc <= @nowUtc THEN 'N'                        -- đang diễn ra
                         ELSE 'F' END AS Phase) p                                   -- sắp tới
CROSS APPLY (SELECT CASE WHEN p.Phase = 'F' THEN CASE WHEN s.r1 < 35 THEN 1 ELSE 0 END
                         ELSE CASE WHEN s.r1 < 70 THEN 1 ELSE 0 END END AS Booked) b;

SELECT a.*,
       CASE a.Phase WHEN 'P' THEN CASE WHEN a.r2 < 6 THEN 4 ELSE 3 END
                    WHEN 'N' THEN 2 ELSE 1 END AS BkStatus,
       CASE WHEN a.r5 < 7 AND @demoLearner IS NOT NULL THEN @demoLearner
            ELSE (SELECT UserId FROM #s WHERE sn = a.r4 % @studentCount) END AS StudentId,
       bc.BkCreated
INTO #slotB
FROM #slotA a
CROSS APPLY (SELECT CASE WHEN DATEADD(hour, -(6 + a.r3 % 72), a.StartUtc) < @nowUtc
                         THEN DATEADD(hour, -(6 + a.r3 % 72), a.StartUtc)
                         ELSE DATEADD(minute, -(15 + a.r3 * 7), @nowUtc) END AS BkCreated) bc;

SELECT b.*,
       CASE WHEN b.Booked = 1 AND b.BkStatus <> 4 THEN 1 ELSE 0 END AS AvStatus,
       CASE WHEN b.Booked = 1 THEN DATEADD(day, -(1 + b.r6 % 5), b.BkCreated)
            WHEN DATEADD(day, -(2 + b.r6 % 6), b.StartUtc) < @nowUtc THEN DATEADD(day, -(2 + b.r6 % 6), b.StartUtc)
            ELSE DATEADD(hour, -(1 + b.r6 % 48), @nowUtc) END AS AvCreated
INTO #slot
FROM #slotB b;

CREATE TABLE #avmap (k int PRIMARY KEY, Id int);
MERGE dbo.TeacherAvailabilities AS t
USING #slot AS s ON 1 = 0
WHEN NOT MATCHED THEN
    INSERT (InstructorId, StartTime, EndTime, Status, CreatedDate, PricePerHour)
    VALUES (s.InstructorId, s.StartUtc, s.EndUtc, s.AvStatus, s.AvCreated, s.Price)
OUTPUT s.k, inserted.AvailabilityId INTO #avmap (k, Id);
INSERT dbo.__SeedLive (TableName, Id) SELECT 'TeacherAvailabilities', Id FROM #avmap;

CREATE TABLE #bkmap (k int PRIMARY KEY, Id int);
MERGE dbo.Bookings AS t
USING (SELECT s.*, m.Id AS AvailabilityId FROM #slot s JOIN #avmap m ON m.k = s.k WHERE s.Booked = 1) AS s ON 1 = 0
WHEN NOT MATCHED THEN
    INSERT (StudentId, InstructorId, AvailabilityId, StartTime, EndTime, TotalPrice, Note, Status, CompletedAt, CreatedDate)
    VALUES (s.StudentId, s.InstructorId, s.AvailabilityId, s.StartUtc, s.EndUtc, s.Price, NULL, s.BkStatus,
            CASE WHEN s.BkStatus = 3 THEN DATEADD(minute, 2 + s.r7 % 20, s.EndUtc) END, s.BkCreated)
OUTPUT s.k, inserted.BookingId INTO #bkmap (k, Id);

INSERT dbo.Payments (Amount, PaymentMethod, TransactionCode, Status, PaidAt, CreatedDate, RefName, RefId)
OUTPUT 'Payments', inserted.PaymentId INTO dbo.__SeedLive (TableName, Id)
SELECT s.Price,
       CASE WHEN s.r6 % 3 = 0 THEN 1 ELSE 0 END,
       CASE WHEN s.r6 % 3 = 0 THEN 'BANK_TRANSFER'
            ELSE 'pi_3Seed' + LEFT(REPLACE(CONVERT(varchar(36), NEWID()), '-', ''), 20) END,
       1, DATEADD(second, 60 + s.r8, s.BkCreated), DATEADD(second, 20, s.BkCreated),
       'PrivateLesson', m.Id
FROM #slot s JOIN #bkmap m ON m.k = s.k;

INSERT dbo.Reviews (StudentId, InstructorId, Rating, Comment, Reply, CreatedDate, RefName, RefId)
OUTPUT inserted.ReviewId, inserted.InstructorId, inserted.Rating INTO @newReviews (ReviewId, InstructorId, Rating)
SELECT s.StudentId, s.InstructorId,
       CASE WHEN s.r8 % 10 = 0 THEN 3 WHEN s.r8 % 10 < 4 THEN 4 ELSE 5 END,
       (SELECT Comment FROM @cm WHERE i = s.r4 % @cmCount),
       CASE WHEN s.r3 % 4 = 0 THEN N'Cảm ơn bạn đã học cùng mình! Hẹn gặp lại ở buổi sau nhé.' END,
       CASE WHEN DATEADD(hour, 1 + s.r8 % 30, s.EndUtc) < @nowUtc THEN DATEADD(hour, 1 + s.r8 % 30, s.EndUtc)
            ELSE DATEADD(minute, -5, @nowUtc) END,
       'PrivateLesson', m.Id
FROM #slot s JOIN #bkmap m ON m.k = s.k
WHERE s.BkStatus = 3 AND s.r7 < 55;

/* ---------- 2b. Lớp học nhóm ---------- */
DECLARE @tpl TABLE (i int IDENTITY(0,1), Title nvarchar(200), Description nvarchar(600), MainTopic nvarchar(100),
                    SubTopic nvarchar(255), Province nvarchar(100), Price decimal(18,2));
INSERT @tpl (Title, Description, MainTopic, SubTopic, Province, Price) VALUES
 (N'Tiếng Việt giao tiếp cơ bản', N'Khóa học cho người mới bắt đầu: chào hỏi, giới thiệu bản thân, mua sắm và hỏi đường.', 'Daily Communication', 'Basic Communication', NULL, 80),
 (N'Vietnamese for Expats - Living in Vietnam', N'Practical Vietnamese for daily life: markets, taxis, renting an apartment and making local friends.', 'Daily Communication', 'Living in Vietnam', NULL, 95),
 (N'Business Vietnamese for Office Workers', N'Meetings, emails, phone calls and small talk in a Vietnamese workplace.', 'Work', 'Office Vietnamese', NULL, 120),
 (N'Vietnamese for Hotel & Restaurant Staff', N'Welcoming guests, taking orders and handling requests in Vietnamese.', 'Work', 'Vietnamese for Hotel Staff', NULL, 90),
 (N'Luyện phát âm & 6 thanh điệu', N'Luyện khẩu hình, phân biệt thanh hỏi - ngã, đọc chuẩn các nguyên âm và phụ âm khó.', 'Study', 'Speaking Skills', NULL, 70),
 (N'Vietnamese Grammar Essentials A2', N'Word order, classifiers, tense markers and question patterns with plenty of practice.', 'Study', 'Vietnamese Grammar', NULL, 85),
 (N'Khám phá Hội An bằng tiếng Việt', N'Học tiếng Việt qua phố cổ, ẩm thực và làng nghề Hội An.', 'Travel', 'Hoi An', N'Quảng Nam', 60),
 (N'Hanoi Street Food & Language', N'Order street food, bargain at the market and chat with locals in Hanoi.', 'Travel', 'Hanoi', N'Hà Nội', 65),
 (N'Da Nang Beach Vietnamese', N'Travel Vietnamese for beaches, cafés and getting around Da Nang.', 'Travel', 'Da Nang', N'Đà Nẵng', 55),
 (N'Luyện thi VSTEP A2 cấp tốc', N'Ôn tập 4 kỹ năng nghe - nói - đọc - viết theo cấu trúc đề thi A2.', 'Exam Preparation', 'A2 Preparation', NULL, 110),
 (N'B1 Speaking Practice for Exams', N'Mock speaking tests, feedback on fluency and pronunciation for B1 candidates.', 'Exam Preparation', 'Speaking Practice', NULL, 100),
 (N'Ẩm thực & văn hoá Việt Nam', N'Tìm hiểu các món ăn, phong tục bữa cơm gia đình và từ vựng ẩm thực.', 'Vietnamese Culture', 'Vietnamese Cuisine', NULL, 75),
 (N'Traditional Festivals of Vietnam', N'Tết, Mid-Autumn and local festivals: vocabulary, customs and stories.', 'Vietnamese Culture', 'Traditional Festivals', NULL, 70),
 (N'Câu lạc bộ hội thoại trung cấp', N'Thảo luận các chủ đề thời sự, công việc và cuộc sống để nói trôi chảy hơn.', 'Daily Communication', 'Intermediate Communication', NULL, 90);
DECLARE @tplCount int = (SELECT COUNT(*) FROM @tpl);

DECLARE @topic TABLE (i int IDENTITY(0,1), Topic nvarchar(200));
INSERT @topic (Topic) VALUES
 (N'Chào hỏi & giới thiệu'), (N'Số đếm, giá cả & mua sắm'), (N'Hỏi đường & phương tiện'), (N'Gọi món ở nhà hàng'),
 (N'Thời gian & lịch hẹn'), (N'Gia đình & bạn bè'), (N'Thời tiết & mùa'), (N'Sức khỏe & đi khám'),
 (N'Công việc & nghề nghiệp'), (N'Sở thích & giải trí'), (N'Ôn tập & luyện nói'), (N'Kiểm tra cuối khóa');
DECLARE @topicCount int = (SELECT COUNT(*) FROM @topic);

-- Mỗi giáo viên: 1 lớp đang học (O), 1 lớp sắp khai giảng (U); 6 giáo viên đầu thêm 1 lớp vừa kết thúc (D)
SELECT ROW_NUMBER() OVER (ORDER BY t.tn, kd.kind) AS k, t.TeacherProfileId, t.UserId, t.tn, kd.kind,
       (t.tn * 3 + kd.ki) % @tplCount AS tplIdx,
       CASE kd.kind WHEN 'O' THEN DATEADD(day, -(8 + t.tn % 8), @todayVN)
                    WHEN 'U' THEN DATEADD(day, 2 + t.tn % 10, @todayVN)
                    ELSE DATEADD(day, -21, @todayVN) END AS FromDate,
       CASE kd.kind WHEN 'O' THEN 12 WHEN 'U' THEN 8 + (t.tn % 3) * 2 ELSE 6 END AS TotalSessions,
       CASE kd.kind WHEN 'O' THEN CAST('07:00' AS time) WHEN 'U' THEN CAST('17:30' AS time) ELSE CAST('20:15' AS time) END AS StartTime,
       CASE kd.kind WHEN 'O' THEN CAST('08:30' AS time) WHEN 'U' THEN CAST('19:00' AS time) ELSE CAST('21:45' AS time) END AS EndTime,
       CASE kd.kind WHEN 'U' THEN 8 ELSE 10 END AS MaxStudents,
       CASE kd.kind WHEN 'O' THEN 4 + ABS(CHECKSUM(NEWID())) % 5
                    WHEN 'U' THEN 2 + ABS(CHECKSUM(NEWID())) % 5
                    ELSE 4 + ABS(CHECKSUM(NEWID())) % 4 END AS EnrollCount
INTO #cls
FROM #t t
CROSS JOIN (VALUES ('O', 0), ('U', 1), ('D', 2)) kd(kind, ki)
WHERE kd.kind <> 'D' OR t.tn <= 6;

SELECT c.k, x.DayName
INTO #days
FROM #cls c
CROSS APPLY (
    SELECT DayName FROM (VALUES
        ('O', 1, 'Monday'), ('O', 1, 'Wednesday'), ('O', 1, 'Friday'),
        ('O', 0, 'Tuesday'), ('O', 0, 'Thursday'), ('O', 0, 'Saturday'),
        ('U', 1, 'Tuesday'), ('U', 1, 'Thursday'),
        ('U', 0, 'Saturday'), ('U', 0, 'Sunday'),
        ('D', 1, 'Tuesday'), ('D', 1, 'Thursday'), ('D', 1, 'Saturday'),
        ('D', 0, 'Monday'), ('D', 0, 'Wednesday'), ('D', 0, 'Friday')
    ) p(kind, odd, DayName)
    WHERE p.kind = c.kind AND p.odd = c.tn % 2
) x;

;WITH n AS (SELECT TOP (60) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) - 1 AS i FROM sys.all_objects)
SELECT c.k, DATEADD(day, n.i, c.FromDate) AS StudyDate,
       ROW_NUMBER() OVER (PARTITION BY c.k ORDER BY n.i) AS SessionNumber
INTO #sessAll
FROM #cls c CROSS JOIN n
WHERE EXISTS (SELECT 1 FROM #days dd WHERE dd.k = c.k AND dd.DayName = DATENAME(weekday, DATEADD(day, n.i, c.FromDate)));

SELECT sa.k, sa.StudyDate, sa.SessionNumber, c.StartTime, c.EndTime,
       DATEADD(hour, -7, CAST(sa.StudyDate AS datetime) + CAST(c.StartTime AS datetime)) AS StartUtc,
       DATEADD(hour, -7, CAST(sa.StudyDate AS datetime) + CAST(c.EndTime AS datetime)) AS EndUtc
INTO #sess
FROM #sessAll sa JOIN #cls c ON c.k = sa.k
WHERE sa.SessionNumber <= c.TotalSessions;

-- Học viên ghi danh
SELECT c.k, st.UserId AS StudentId, ABS(CHECKSUM(NEWID())) % 100 AS r1, ABS(CHECKSUM(NEWID())) % 100000 AS r2
INTO #enr
FROM #cls c
CROSS APPLY (SELECT TOP (c.EnrollCount) UserId FROM #s ORDER BY NEWID()) st;

-- Demo Learner: luôn có 1 lớp đang học và 1 lớp sắp học
INSERT #enr (k, StudentId, r1, r2)
SELECT c.k, @demoLearner, 50, 5000
FROM #cls c
WHERE @demoLearner IS NOT NULL
  AND ((c.kind = 'O' AND c.tn = 1) OR (c.kind = 'U' AND c.tn = 2))
  AND NOT EXISTS (SELECT 1 FROM #enr e WHERE e.k = c.k AND e.StudentId = @demoLearner);

SELECT e.k, e.StudentId, e.r1,
       CASE c.kind WHEN 'O' THEN 2 WHEN 'U' THEN 1 ELSE 3 END AS Status,
       CASE WHEN c.kind = 'U' THEN DATEADD(minute, -(10 + e.r2 % 14000), @nowUtc)
            ELSE DATEADD(hour, -(24 + e.r2 % 240), DATEADD(hour, -7, CAST(c.FromDate AS datetime))) END AS EnrolledDate
INTO #enroll
FROM #enr e JOIN #cls c ON c.k = e.k;

CREATE TABLE #clmap (k int PRIMARY KEY, Id int);
MERGE dbo.TeacherClasses AS t
USING (
    SELECT c.*, tp.Title, tp.Description, tp.MainTopic, tp.SubTopic, tp.Province, tp.Price,
           (SELECT MIN(StudyDate) FROM #sess s WHERE s.k = c.k) AS FirstDate,
           (SELECT COUNT(*) FROM #enroll e WHERE e.k = c.k) AS Cnt,
           (SELECT DATEADD(day, -(3 + c.tn % 5), MIN(EnrolledDate)) FROM #enroll e WHERE e.k = c.k) AS Created
    FROM #cls c JOIN @tpl tp ON tp.i = c.tplIdx
) AS s ON 1 = 0
WHEN NOT MATCHED THEN
    INSERT (TeacherProfileId, Title, Description, Price, MaxStudents, Status, CreatedDate, MainTopic, SubTopic,
            TotalSessions, StartDate, StartTime, EndTime, CurrentStudents, ThumbnailUrl, Province, SpecificLocation,
            ReservedStudentId, TripId)
    VALUES (s.TeacherProfileId, s.Title + N' - Khóa ' + FORMAT(s.FirstDate, 'dd/MM'), s.Description, s.Price,
            s.MaxStudents, 1, ISNULL(s.Created, DATEADD(day, -7, @nowUtc)), s.MainTopic, s.SubTopic,
            s.TotalSessions, s.FirstDate, s.StartTime, s.EndTime, s.Cnt, NULL, s.Province, NULL, NULL, NULL)
OUTPUT s.k, inserted.ClassId INTO #clmap (k, Id);
INSERT dbo.__SeedLive (TableName, Id) SELECT 'TeacherClasses', Id FROM #clmap;

INSERT dbo.ClassScheduleDays (ClassId, DayOfWeek)
SELECT m.Id, d.DayName FROM #days d JOIN #clmap m ON m.k = d.k;

CREATE TABLE #semap (k int, SessionNumber int, Id int);
MERGE dbo.ClassSessions AS t
USING (SELECT s.*, m.Id AS ClassId FROM #sess s JOIN #clmap m ON m.k = s.k) AS s ON 1 = 0
WHEN NOT MATCHED THEN
    INSERT (ClassId, StudyDate, StartTime, EndTime, Topic, SessionNumber, Status)
    VALUES (s.ClassId, s.StudyDate, s.StartTime, s.EndTime,
            N'Buổi ' + CAST(s.SessionNumber AS nvarchar(5)) + N': ' +
                (SELECT Topic FROM @topic WHERE i = (s.SessionNumber - 1) % @topicCount),
            s.SessionNumber,
            CASE WHEN s.EndUtc <= @nowUtc THEN 'Completed' ELSE 'Upcoming' END)
OUTPUT s.k, s.SessionNumber, inserted.SessionId INTO #semap (k, SessionNumber, Id);

CREATE TABLE #enmap (k int, StudentId int, Id int);
MERGE dbo.ClassEnrollments AS t
USING (SELECT e.*, m.Id AS ClassId FROM #enroll e JOIN #clmap m ON m.k = e.k) AS s ON 1 = 0
WHEN NOT MATCHED THEN
    INSERT (ClassId, StudentId, Status, EnrolledDate)
    VALUES (s.ClassId, s.StudentId, s.Status, s.EnrolledDate)
OUTPUT s.k, s.StudentId, inserted.EnrollmentId INTO #enmap (k, StudentId, Id);

INSERT dbo.Payments (Amount, PaymentMethod, TransactionCode, Status, PaidAt, CreatedDate, RefName, RefId)
OUTPUT 'Payments', inserted.PaymentId INTO dbo.__SeedLive (TableName, Id)
SELECT tp.Price,
       CASE WHEN e.r1 % 3 = 0 THEN 1 ELSE 0 END,
       CASE WHEN e.r1 % 3 = 0 THEN 'BANK_TRANSFER'
            ELSE 'pi_3Seed' + LEFT(REPLACE(CONVERT(varchar(36), NEWID()), '-', ''), 20) END,
       1, DATEADD(second, 60 + e.r1, e.EnrolledDate), DATEADD(second, 20, e.EnrolledDate),
       'CLASS', em.Id
FROM #enroll e
JOIN #enmap em ON em.k = e.k AND em.StudentId = e.StudentId
JOIN #cls c ON c.k = e.k
JOIN @tpl tp ON tp.i = c.tplIdx;

-- Điểm danh các buổi đã học
INSERT dbo.ClassAttendances (SessionId, StudentId, IsPresent, CheckedAt)
SELECT sm.Id, e.StudentId,
       CASE WHEN ABS(CHECKSUM(NEWID())) % 100 < 90 THEN 1 ELSE 0 END,
       DATEADD(minute, 3 + ABS(CHECKSUM(NEWID())) % 10, s.StartUtc)
FROM #sess s
JOIN #semap sm ON sm.k = s.k AND sm.SessionNumber = s.SessionNumber
JOIN #enroll e ON e.k = s.k
WHERE s.EndUtc <= @nowUtc;

-- Đánh giá lớp đã kết thúc (RefName = CLASS, RefId = ClassId)
INSERT dbo.Reviews (StudentId, InstructorId, Rating, Comment, Reply, CreatedDate, RefName, RefId)
OUTPUT inserted.ReviewId, inserted.InstructorId, inserted.Rating INTO @newReviews (ReviewId, InstructorId, Rating)
SELECT e.StudentId, c.UserId,
       CASE WHEN e.r1 % 10 = 0 THEN 3 WHEN e.r1 % 10 < 4 THEN 4 ELSE 5 END,
       (SELECT Comment FROM @cm WHERE i = (e.r1 + c.tn) % @cmCount),
       NULL,
       CASE WHEN DATEADD(hour, 2 + e.r1 % 72, le.LastEnd) < @nowUtc THEN DATEADD(hour, 2 + e.r1 % 72, le.LastEnd)
            ELSE DATEADD(minute, -5, @nowUtc) END,
       'CLASS', m.Id
FROM #enroll e
JOIN #cls c ON c.k = e.k AND c.kind = 'D'
JOIN #clmap m ON m.k = e.k
CROSS APPLY (SELECT MAX(EndUtc) AS LastEnd FROM #sess s WHERE s.k = e.k) le
WHERE e.r1 < 65;

INSERT dbo.__SeedLive (TableName, Id) SELECT 'Reviews', ReviewId FROM @newReviews;

-- Cập nhật rating giáo viên giống cách ReviewService cộng dồn
UPDATE tp
SET TotalReviews  = ISNULL(b.TotalReviews, 0) + x.n,
    RatingAverage = ROUND((ISNULL(b.RatingAverage, 0) * ISNULL(b.TotalReviews, 0) + x.s) / (ISNULL(b.TotalReviews, 0) + x.n), 2)
FROM dbo.TeacherProfiles tp
JOIN dbo.__SeedLiveProfile b ON b.TeacherProfileId = tp.TeacherProfileId
JOIN (SELECT InstructorId, COUNT(*) AS n, SUM(Rating * 1.0) AS s FROM @newReviews GROUP BY InstructorId) x
  ON x.InstructorId = tp.UserId;

/* ---------- 2c. Du lịch cùng giáo viên ---------- */
DECLARE @dest TABLE (i int, Destination nvarchar(200), Location nvarchar(300));
INSERT @dest VALUES
 (1, N'Hội An',    N'Phố cổ Hội An - Chùa Cầu'),
 (2, N'Nha Trang', N'Vịnh Nha Trang - Tháp Bà Ponagar'),
 (3, N'Phú Quốc',  N'Bãi Sao - Chợ đêm Dinh Cậu'),
 (4, N'Sa Pa',     N'Bản Cát Cát - Đỉnh Fansipan'),
 (5, N'Hạ Long',   N'Vịnh Hạ Long - Hang Sửng Sốt'),
 (6, N'Huế',       N'Đại Nội Huế - Chùa Thiên Mụ');

SELECT t.UserId AS TeacherId, t.tn, d.Destination, d.Location
INTO #sch
FROM #t t JOIN @dest d ON d.i = t.tn;

CREATE TABLE #scmap (tn int PRIMARY KEY, Id int);
MERGE dbo.TeacherSchedules AS x
USING #sch AS s ON 1 = 0
WHEN NOT MATCHED THEN
    INSERT (TeacherId, Destination, AvailableFrom, AvailableTo, CreatedAt, Status)
    VALUES (s.TeacherId, s.Destination, DATEADD(day, -3, @todayVN), DATEADD(day, 60, @todayVN),
            DATEADD(day, -(20 + s.tn * 2), @nowUtc), 1)
OUTPUT s.tn, inserted.ScheduleId INTO #scmap (tn, Id);
INSERT dbo.__SeedLive (TableName, Id) SELECT 'TeacherSchedules', Id FROM #scmap;

-- Chuyến đi: 'M' đã ghép giáo viên (có TravelBooking), 'F' đang tìm giáo viên (có lời mời chờ phản hồi)
-- Demo Learner chỉ có 1 chuyến 'F' nên loại khỏi danh sách chọn ngẫu nhiên để không trùng lịch
SELECT UserId, ROW_NUMBER() OVER (ORDER BY UserId) - 1 AS sn
INTO #s2
FROM #s WHERE UserId <> ISNULL(@demoLearner, -1);
DECLARE @student2Count int = (SELECT COUNT(*) FROM #s2);

SELECT s.tn, s.Destination, s.Location, v.kind, v.j,
       ABS(CHECKSUM(NEWID())) % 100 AS r1, ABS(CHECKSUM(NEWID())) % 100000000 AS r2,
       ABS(CHECKSUM(NEWID())) % 1000 AS r3
INTO #tripRaw
FROM #sch s
CROSS JOIN (VALUES ('M', 0), ('M', 1), ('F', 0)) v(kind, j)
WHERE NOT (v.kind = 'M' AND v.j = 1 AND s.tn > 4);

SELECT ROW_NUMBER() OVER (ORDER BY r.tn, r.kind, r.j) AS k, r.tn, r.Destination, r.Location, r.kind,
       CASE r.kind WHEN 'M' THEN DATEADD(day, 3 + r.j * 11 + r.tn, @todayVN)
                   -- sau mọi chuyến đã ghép của cùng lịch (kết thúc muộn nhất +23) để lời mời chấp nhận được
                   ELSE DATEADD(day, 24 + r.tn % 5, @todayVN) END AS StartDate,
       3 + r.tn % 3 AS Days,
       CASE WHEN r.kind = 'F' AND r.tn = 1 AND @demoLearner IS NOT NULL THEN @demoLearner
            ELSE (SELECT UserId FROM #s2 WHERE sn = r.r3 % @student2Count) END AS StudentId,
       r.r1, r.r2
INTO #trip
FROM #tripRaw r;

CREATE TABLE #trmap (k int PRIMARY KEY, Id int);
MERGE dbo.StudentTrips AS x
USING (SELECT tr.*,
              DATEADD(hour, tr.r1 % 14, CAST(DATEADD(day, -(31 + tr.r1 % 8), tr.StartDate) AS datetime)) AS CreatedAt
       FROM #trip tr) AS s ON 1 = 0
WHEN NOT MATCHED THEN
    INSERT (StudentId, Destination, StartDate, EndDate, CreatedAt, Status, SpecificLocation, PhoneNumber)
    VALUES (s.StudentId, s.Destination, s.StartDate, DATEADD(day, s.Days, s.StartDate),
            CASE WHEN s.CreatedAt < @nowUtc THEN s.CreatedAt ELSE DATEADD(day, -1, @nowUtc) END,
            CASE s.kind WHEN 'M' THEN 1 ELSE 0 END, s.Location,
            '09' + RIGHT('00000000' + CAST(s.r2 AS varchar(8)), 8))
OUTPUT s.k, inserted.TripId INTO #trmap (k, Id);
INSERT dbo.__SeedLive (TableName, Id) SELECT 'StudentTrips', Id FROM #trmap;

INSERT dbo.MatchRequests (ScheduleId, TripId, RequestType, Status, CreatedAt, RespondedAt, ClassId)
SELECT sm.Id, tm.Id, tr.r1 % 2,
       CASE tr.kind WHEN 'M' THEN 1 ELSE 0 END,
       CASE tr.kind WHEN 'M' THEN DATEADD(day, 1 + tr.r1 % 3, st.CreatedAt)
                    ELSE DATEADD(hour, -(1 + tr.r1 % 72), @nowUtc) END,
       CASE tr.kind WHEN 'M' THEN DATEADD(hour, 2 + tr.r1 % 18, DATEADD(day, 1 + tr.r1 % 3, st.CreatedAt)) END,
       NULL
FROM #trip tr
JOIN #trmap tm ON tm.k = tr.k
JOIN #scmap sm ON sm.tn = tr.tn
JOIN dbo.StudentTrips st ON st.TripId = tm.Id;

INSERT dbo.TravelBookings (ScheduleId, TripId, Destination, StartDate, EndDate, Status, CreatedAt)
SELECT mr.ScheduleId, mr.TripId, st.Destination, st.StartDate, st.EndDate, 1, mr.RespondedAt
FROM dbo.MatchRequests mr
JOIN dbo.StudentTrips st ON st.TripId = mr.TripId
WHERE mr.TripId IN (SELECT Id FROM #trmap) AND mr.Status = 1;

/* ---------- 2d. Admin đã trả giáo viên (bảng TeacherPayouts, migration AddTeacherPayouts) ----------
 * Phải trả = thanh toán thành công của buổi 1-1 đã xong + học viên còn hiệu lực ở lớp đã kết thúc
 * (cùng cách tính với StatsServiceImpl). Mỗi giáo viên một tỉ lệ để có đủ: trả đủ / trả thừa / còn thiếu.
 */
IF OBJECT_ID('dbo.TeacherPayouts') IS NOT NULL
BEGIN
    ;WITH bk AS (
        SELECT b.InstructorId AS TeacherUserId, p.Amount
        FROM dbo.Bookings b
        JOIN dbo.Payments p ON p.RefName = 'PrivateLesson' AND p.RefId = b.BookingId AND p.Status = 1
        WHERE b.Status = 3 OR (b.Status IN (1, 2) AND b.EndTime <= @nowUtc)
    ), cls AS (
        SELECT tp.UserId AS TeacherUserId, p.Amount
        FROM dbo.ClassEnrollments ce
        JOIN dbo.TeacherClasses tc ON tc.ClassId = ce.ClassId
        JOIN dbo.TeacherProfiles tp ON tp.TeacherProfileId = tc.TeacherProfileId
        JOIN dbo.Payments p ON p.RefName = 'CLASS' AND p.RefId = ce.EnrollmentId AND p.Status = 1
        -- buổi cuối (ngày + giờ kết thúc của chính buổi đó), giống ClassStatus trong StatsServiceImpl
        CROSS APPLY (SELECT TOP 1 s.StudyDate AS LastDate, s.EndTime AS LastEnd
                     FROM dbo.ClassSessions s WHERE s.ClassId = tc.ClassId
                     ORDER BY s.StudyDate DESC, s.EndTime DESC) ls
        WHERE ce.Status IN (1, 2, 3)
          AND (ce.Status = 3
               OR DATEADD(hour, -7, CAST(ls.LastDate AS datetime) + CAST(ls.LastEnd AS datetime)) <= @nowUtc)
    ), owed AS (
        SELECT TeacherUserId, SUM(Amount) AS Owed
        FROM (SELECT TeacherUserId, Amount FROM bk UNION ALL SELECT TeacherUserId, Amount FROM cls) x
        GROUP BY TeacherUserId
    )
    INSERT dbo.TeacherPayouts (TeacherUserId, Amount, PaidAt, Note, CreatedBy, CreatedDate)
    OUTPUT 'TeacherPayouts', inserted.PayoutId INTO dbo.__SeedLive (TableName, Id)
    SELECT t.UserId, ROUND(o.Owed * f.Factor, 2), DATEADD(day, -f.DaysAgo, @nowUtc), f.Note,
           'demo.admin@example.test', DATEADD(day, -f.DaysAgo, @nowUtc)
    FROM #t t
    JOIN owed o ON o.TeacherUserId = t.UserId
    JOIN (VALUES
        (1, 1.00,  3, N'Thanh toán đủ đến cuối tháng'),
        (2, 1.10,  5, N'Chuyển khoản nhầm số tiền'),
        (3, 0.60,  7, N'Trả đợt 1'),
        (4, 0.50, 10, N'Trả đợt 1'),
        (5, 0.75,  4, N'Trả đợt 1'),
        (6, 0.30, 12, N'Tạm ứng')
    ) f(tn, Factor, DaysAgo, Note) ON f.tn = t.tn
    WHERE o.Owed > 0;
END

/* ---------- Tóm tắt ---------- */
SELECT 'Lịch 1-1' AS Item, COUNT(*) AS Total,
       SUM(CASE WHEN Phase = 'F' AND Booked = 0 THEN 1 ELSE 0 END) AS ConTrongSapToi,
       SUM(CASE WHEN Phase = 'F' AND Booked = 1 THEN 1 ELSE 0 END) AS DaDatSapToi,
       SUM(CASE WHEN Phase <> 'F' AND Booked = 1 THEN 1 ELSE 0 END) AS DaHocHoacDangHoc
FROM #slot;
SELECT 'Lớp nhóm' AS Item, kind, COUNT(*) AS Classes,
       (SELECT COUNT(*) FROM #enroll e JOIN #cls c2 ON c2.k = e.k WHERE c2.kind = c.kind) AS Enrollments
FROM #cls c GROUP BY kind;
SELECT 'Du lịch' AS Item, kind, COUNT(*) AS Trips FROM #trip GROUP BY kind;
SELECT 'Đánh giá mới' AS Item, COUNT(*) AS Reviews FROM @newReviews;

COMMIT;
GO
