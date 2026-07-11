using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearnMS.API.Data.Configurations;

public sealed class CoursesConfigurations : IEntityTypeConfiguration<Course>
{
    public void Configure(EntityTypeBuilder<Course> builder)
    {
        // builder.HasMany<CourseItem>("_items").WithOne().HasForeignKey(x => x.CourseId);

        // builder.Ignore(x => x.Items);

        //builder.Property(x => x.Items).HasField("_items").UsePropertyAccessMode(PropertyAccessMode.Field);
        // builder.HasMany(x => x.Items).WithOne().HasForeignKey(x => x.CourseId);

        builder.HasMany(x => x.Lectures).WithOne(x => x.Course).HasForeignKey(x => x.CourseId).OnDelete(DeleteBehavior.Cascade).IsRequired();

        builder.Property(x => x.Level).HasConversion(x => x.ToString(), x => x != null ? (StudentLevel)Enum.Parse(typeof(StudentLevel), x) : null);

        builder.HasMany(x => x.EnrolledStudents).WithMany(x => x.PurchasedCourses).UsingEntity<CourseEnrollment>(
                   l => l.HasOne(x => x.Student).WithMany(x => x.CourseEnrollments).HasForeignKey(x => x.StudentId),
                   r => r.HasOne(x => x.Course).WithMany(x => x.CourseEnrollments).HasForeignKey(x => x.CourseId)
               );

    }
}
