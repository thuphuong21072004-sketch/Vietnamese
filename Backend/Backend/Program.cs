using Backend.Common;
using Backend.Data;
using Backend.Mapper;
using Backend.Repository;
using Backend.Repository.impl;
using Backend.Services;
using Backend.Services.impl;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);


var key = Encoding.UTF8.GetBytes(
    "vietnamese_learning_system_super_secret_key_2026_project"
);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = false,
        ValidateAudience = false,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(key)
    };
});


// ADD CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular",
        policy => policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod()
            // header X-Timezone-Offset làm mọi request cần preflight → cho trình duyệt cache kết quả OPTIONS
            .SetPreflightMaxAge(TimeSpan.FromHours(2)));
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    ));
builder.Services.AddScoped<JwtService>();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.Converters.Add(new UtcDateTimeConverter());
    });

builder.Services.AddScoped<UserService, UserServiceImpl>();
builder.Services.AddScoped<VideoService, VideoServiceImpl>();
builder.Services.AddScoped<LearningService, LearningServiceImpl>();
builder.Services.AddScoped<TestService, TestServiceImpl>();

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<UserContextUtil>();
builder.Services.AddScoped<UserRepository, UserRepositoryImpl>();
builder.Services.AddScoped<VideoRepository, VideoRepositoryImpl>();
builder.Services.AddScoped<LevelRepository, LevelRepositoryImpl>();
builder.Services.AddScoped<CourseRepository, CourseRepositoryImpl>();
builder.Services.AddScoped<UnitRepository, UnitRepositoryImpl>();
builder.Services.AddScoped<ProgressRepository, ProgressRepositoryImpl>();

builder.Services.AddAutoMapper(typeof(MappingProfile));
builder.Services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());
builder.Services.AddScoped<QuizRepository, QuizRepositoryImpl>();
builder.Services.AddScoped<PlacementRepository, PlacementRepositoryImpl>();

builder.Services.AddScoped<PartRepository, PartRepositoryImpl>();

builder.Services.AddScoped<PassageRepository, PassageRepositoryImpl>();

builder.Services.AddScoped<QuestionRepository, QuestionRepositoryImpl>();

builder.Services.AddScoped<AnswerRepository, AnswerRepositoryImpl>();

builder.Services.AddScoped<UserAnswerRepository, UserAnswerRepositoryImpl>();

builder.Services.AddScoped<UserSpecialAnswerRepository, UserSpecialAnswerRepositoryImpl>();

builder.Services.AddScoped<UserQuizRepository, UserQuizRepositoryImpl>();

builder.Services.AddScoped<
    TeacherProfileRepository,
    TeacherProfileRepositoryImpl>();

builder.Services.AddScoped<
    TeacherProfileService,
    TeacherProfileServiceImpl>();
builder.Services.AddScoped<
    TeacherAvailabilityRepository,
    TeacherAvailabilityRepositoryImpl>();

builder.Services.AddScoped<
    TeacherAvailabilityService,
    TeacherAvailabilityServiceImpl>();
builder.Services.AddScoped<
    BookingRepository,
    BookingRepositoryImpl>();

builder.Services.AddScoped<
    BookingService,
    BookingServiceImpl>();
builder.Services.AddScoped<
    PaymentRepository,
    PaymentRepositoryImpl>();

builder.Services.AddScoped<
    PaymentService,
    PaymentServiceImpl>();
builder.Services.AddScoped<
    VideoRoomRepository,
    VideoRoomRepositoryImpl>();

builder.Services.AddScoped<
    VideoRoomService,
    VideoRoomServiceImpl>();
builder.Services.AddScoped<
    ReviewRepository,
    ReviewRepositoryImpl>();

builder.Services.AddScoped<
    ReviewService,
    ReviewServiceImpl>();
builder.Services.AddScoped<
    RoleRepository,
    RoleRepositoryImpl
>();

builder.Services.AddScoped<TextToSpeechService, GttsTextToSpeechService>();
builder.Services.AddSingleton<SpeechToTextService, Wav2VecSpeechToTextService>();
builder.Services.AddHttpClient("asr")
    .ConfigureHttpClient(c => c.Timeout = TimeSpan.FromSeconds(120));

builder.Services.AddScoped<StripeService>();

builder.Services.AddHttpClient<ExchangeRateService>();
builder.Services.Configure<StripeConfig>(
 builder.Configuration.GetSection("Stripe"));
builder.Services.AddScoped<
    TeacherClassRepository,
    TeacherClassRepositoryImpl>();

builder.Services.AddScoped<
    ClassScheduleDayRepository,
    ClassScheduleDayRepositoryImpl>();

builder.Services.AddScoped<
    ClassSessionRepository,
    ClassSessionRepositoryImpl>();
builder.Services.AddScoped<
    TeacherClassService,
    TeacherClassServiceImpl>();
builder.Services.AddScoped<
    ClassEnrollmentRepository,
    ClassEnrollmentRepositoryImpl>();

builder.Services.AddScoped<
    ClassEnrollmentService,
    ClassEnrollmentServiceImpl>();

builder.Services.Configure<Backend.Common.BankConfig>(
    builder.Configuration.GetSection("BankTransfer"));
builder.Services.AddHostedService<Backend.Services.impl.AutoCancelService>();

builder.Services.AddScoped<Backend.Services.StatsService, Backend.Services.impl.StatsServiceImpl>();

builder.Services.AddScoped<TeacherScheduleRepository, TeacherScheduleRepositoryImpl>();
builder.Services.AddScoped<StudentTripRepository, StudentTripRepositoryImpl>();
builder.Services.AddScoped<MatchRequestRepository, MatchRequestRepositoryImpl>();
builder.Services.AddScoped<TravelBookingRepository, TravelBookingRepositoryImpl>();
builder.Services.AddScoped<TravelService, TravelServiceImpl>();

var app = builder.Build();


app.UseMiddleware<ExceptionMiddleware>();
app.UseMiddleware<UserTimeZoneMiddleware>();

app.UseCors("AllowAngular");
app.UseStaticFiles();

// Bản build Angular (run-demo chép vào ClientApp) -> backend phục vụ luôn giao diện trên cùng cổng.
// Khi code bình thường không có thư mục này nên khối dưới không chạy.
var clientAppPath = Path.Combine(app.Environment.ContentRootPath, "ClientApp");
var clientAppFiles = Directory.Exists(clientAppPath) ? new PhysicalFileProvider(clientAppPath) : null;
if (clientAppFiles != null)
    app.UseStaticFiles(new StaticFileOptions { FileProvider = clientAppFiles });

if (!app.Environment.IsDevelopment())
    app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Ảnh trong uploads bị thiếu (vd. chuyển máy nhưng không chép thư mục) -> trả avatar mặc định thay vì 404
// (endpoint này khớp trước UseStaticFiles nên phải tự trả file thật khi có)
var uploadContentTypes = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider();
app.MapGet("/uploads/{**file}", (string file, IWebHostEnvironment env) =>
{
    var uploadsRoot = Path.GetFullPath(Path.Combine(env.WebRootPath, "uploads"));
    var fullPath = Path.GetFullPath(Path.Combine(uploadsRoot, file));

    if (fullPath.StartsWith(uploadsRoot + Path.DirectorySeparatorChar) && File.Exists(fullPath))
    {
        uploadContentTypes.TryGetContentType(fullPath, out var contentType);
        return Results.File(fullPath, contentType ?? "application/octet-stream");
    }

    return Results.File(
        Path.Combine(env.WebRootPath, "images", "default-avatar.svg"),
        "image/svg+xml");
});

if (clientAppFiles != null)
{
    // /api sai đường dẫn vẫn trả 404 thay vì trang Angular
    app.MapFallback("/api/{**path}", () => Results.NotFound());
    // route của Angular (/my-bookings, /user/myclass...) khi F5 -> trả index.html để Angular tự điều hướng
    app.MapFallbackToFile("index.html", new StaticFileOptions { FileProvider = clientAppFiles });
}

app.Run();