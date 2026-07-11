using LearnMS.API.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Conventions;
using SmartEnum.EFCore;

namespace LearnMS.API.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
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
}