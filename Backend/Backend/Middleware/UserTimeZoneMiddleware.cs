using Backend.common;

/*
 * đọc múi giờ trình duyệt (header X-Timezone-Offset do auth.interceptor gửi)
 * để lọc theo ngày / thống kê theo tháng đúng lịch của người dùng
 */
public class UserTimeZoneMiddleware
{
    private readonly RequestDelegate _next;

    public UserTimeZoneMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task Invoke(HttpContext context)
    {
        UserTime.SetForCurrentRequest(
            context.Request.Headers[UserTime.HeaderName].FirstOrDefault());

        await _next(context);
    }
}
