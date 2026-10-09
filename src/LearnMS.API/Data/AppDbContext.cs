using LearnMS.API.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Conventions;
using SmartEnum.EFCore;

namespace LearnMS.API.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        NormalizeDateTimes();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        NormalizeDateTimes();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    private void NormalizeDateTimes()
    {
        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.State is not (EntityState.Added or EntityState.Modified))
                continue;

            foreach (var property in entry.Properties)
            {
                if (property.CurrentValue is not DateTime value || value.Kind == DateTimeKind.Utc)
                    continue;

                property.CurrentValue = value.Kind == DateTimeKind.Local
                    ? value.ToUniversalTime()
                    : DateTime.SpecifyKind(value, DateTimeKind.Utc);
            }
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        configurationBuilder.ConfigureSmartEnum();
        configurationBuilder.Conventions.Remove<ForeignKeyIndexConvention>();
        base.ConfigureConventions(configurationBuilder);
    }

    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<Assistant> Assistants => Set<Assistant>();
    public DbSet<Teacher> Teachers => Set<Teacher>();
    public DbSet<Student> Students => Set<Student>();
    public DbSet<Lesson> Lessons => Set<Lesson>();
    public DbSet<Lecture> Lectures => Set<Lecture>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<CreditCode> CreditCodes => Set<CreditCode>();
    public DbSet<AppleRewardItem> AppleRewardItems => Set<AppleRewardItem>();
    public DbSet<AppleStoreSettings> AppleStoreSettings => Set<AppleStoreSettings>();
    public DbSet<AppleRewardOrder> AppleRewardOrders => Set<AppleRewardOrder>();
    public DbSet<RewardSystemSettings> RewardSystemSettings => Set<RewardSystemSettings>();
    public DbSet<StudentRegistrationSettings> StudentRegistrationSettings => Set<StudentRegistrationSettings>();
    public DbSet<CallCenterAction> CallCenterActions => Set<CallCenterAction>();
    public DbSet<PaymentRequest> PaymentRequests => Set<PaymentRequest>();
    public DbSet<StudentDiscount> StudentDiscounts => Set<StudentDiscount>();
    public DbSet<LectureStudentDiscount> LectureStudentDiscounts => Set<LectureStudentDiscount>();
    public DbSet<AssistantTrace> AssistantTraces => Set<AssistantTrace>();
    public DbSet<PaymentRequestRejectionReason> PaymentRequestRejectionReasons => Set<PaymentRequestRejectionReason>();
}