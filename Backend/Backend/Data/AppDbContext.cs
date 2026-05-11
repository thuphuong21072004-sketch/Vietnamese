using Microsoft.EntityFrameworkCore;
using Backend.Models;

namespace Backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        public DbSet<Role> Roles { get; set; }

        public DbSet<User> Users { get; set; }

        public DbSet<Video> Videos { get; set; }

        public DbSet<Transcript> Transcripts { get; set; }


        public DbSet<Level> Levels { get; set; }
        public DbSet<Course> Courses { get; set; }
        public DbSet<Unit> Units { get; set; }
        public DbSet<Quiz> Quizzes { get; set; }
        public DbSet<Part> Parts { get; set; }
        public DbSet<Passage> Passages { get;set; }
        public DbSet<Question> Questions { get; set; }
        public DbSet<Answer> Answers { get; set; }

        public DbSet<UserProgress> UserProgress { get; set; }
        public DbSet<UserQuiz> UserQuiz { get; set; }
        
        public DbSet<UserAnswer> UserAnswer { get; set; }
        public DbSet<PlacementTest> PlacementTests { get; set; }

        /* * Cấu hình các ràng buộc Cascade Delete 
         * thuphuong21072004 
         */
        protected override void OnModelCreating(
    ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Course>()
                .HasOne(c => c.Level)
                .WithMany(l => l.Courses)
                .HasForeignKey(c => c.LevelId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Unit>()
                .HasOne(u => u.Course)
                .WithMany(c => c.Units)
                .HasForeignKey(u => u.CourseId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Part>()
                .HasOne(p => p.Quiz)
                .WithMany(q => q.Parts)
                .HasForeignKey(p => p.QuizId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Question>()
                .HasOne(q => q.Quiz)
                .WithMany(qz => qz.Questions)
                .HasForeignKey(q => q.QuizId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Passage>()
                .HasOne(p => p.Part)
                .WithMany(p => p.Passages)
                .HasForeignKey(p => p.PartId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Question>()
                .HasOne(q => q.Part)
                .WithMany(p => p.Questions)
                .HasForeignKey(q => q.PartId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Question>()
                .HasOne(q => q.Passage)
                .WithMany(p => p.Questions)
                .HasForeignKey(q => q.PassageId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Answer>()
                .HasOne(a => a.Question)
                .WithMany(q => q.Answers)
                .HasForeignKey(a => a.QuestionId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Transcript>()
                .HasOne(t => t.Video)
                .WithMany(v => v.Transcripts)
                .HasForeignKey(t => t.VideoId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UserQuiz>()
                .HasOne(x => x.User)
                .WithMany(u => u.UserQuizzes)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UserQuiz>()
                .HasOne(x => x.Quiz)
                .WithMany(q => q.UserQuizzes)
                .HasForeignKey(x => x.QuizId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UserAnswer>()
                .HasOne(ua => ua.UserQuiz)
                .WithMany(uq => uq.UserAnswers)
                .HasForeignKey(ua => ua.UserQuizId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UserAnswer>()
                .HasOne(ua => ua.Answer)
                .WithMany(a => a.UserAnswers)
                .HasForeignKey(ua => ua.AnswerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<UserAnswer>()
                .HasOne(ua => ua.Question)
                .WithMany()
                .HasForeignKey(ua => ua.QuestionId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Video>()
                .HasIndex(v => v.YoutubeId)
                .IsUnique();

            modelBuilder.Entity<Level>()
                .HasIndex(l => l.OrderIndex)
                .IsUnique();

            modelBuilder.Entity<Course>()
                .HasIndex(x => new { x.LevelId, x.OrderIndex })
                .IsUnique();

            modelBuilder.Entity<Unit>()
                .HasIndex(x => new { x.CourseId, x.OrderIndex })
                .IsUnique();

            modelBuilder.Entity<UserQuiz>()
                .HasIndex(x => new { x.UserId, x.QuizId })
                .IsUnique();

            modelBuilder.Entity<UserProgress>()
                .HasIndex(x => new { x.UserId, x.RefType, x.RefId })
                .IsUnique();

            modelBuilder.Entity<Quiz>()
                .HasIndex(x => new { x.RefType, x.RefId })
                .IsUnique();

            modelBuilder.Entity<UserAnswer>()
                .HasIndex(x => new { x.UserQuizId, x.QuestionId })
                .IsUnique();

            modelBuilder.Entity<Answer>()
                .HasIndex(x => new { x.QuestionId, x.OrderIndex })
                .IsUnique();

            modelBuilder.Entity<Part>()
                .HasIndex(x => new { x.QuizId, x.PartNumber })
                .IsUnique();

            modelBuilder.Entity<Passage>()
                .HasIndex(x => new { x.PartId, x.OrderIndex })
                .IsUnique();

            modelBuilder.Entity<Quiz>()
                .Property(x => x.CreatedDate)
                .HasDefaultValueSql(
                    "GETDATE()");

            modelBuilder.Entity<PlacementTest>()
                .HasKey(x => x.PlacementId);
        }

    }
}