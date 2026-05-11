using Backend.Data;
using Backend.Repository;
using Backend.Repository.impl;
using Backend.Services;
using Backend.Services.impl;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Backend.Common;
using Backend.Mapper;

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
            .WithOrigins("http://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod());
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    ));
builder.Services.AddScoped<JwtService>();

builder.Services.AddControllers();

builder.Services.AddScoped<UserService, UserServiceImpl>();
builder.Services.AddScoped<VideoService, VideoServiceImpl>();
builder.Services.AddScoped<LearningService, LearningServiceImpl>();
builder.Services.AddScoped<TestService, TestServiceImpl>();

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<UserContextUtil>();
builder.Services.AddScoped<UserRepository, UserRepositoryImpl>();
builder.Services.AddHttpClient<VideoRepositoryImpl>();
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

builder.Services.AddScoped<UserQuizRepository, UserQuizRepositoryImpl>();
var app = builder.Build();

app.UseMiddleware<ExceptionMiddleware>();

app.UseCors("AllowAngular");
app.UseStaticFiles();
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();