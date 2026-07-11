using LearnMS.API.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LearnMS.API.Data.Configurations;

public sealed class LecturesConfigurations : IEntityTypeConfiguration<Lecture>
{
    public void Configure(EntityTypeBuilder<Lecture> builder)
    {
        // builder.HasMany<LectureItem>("_items").WithOne().HasForeignKey(x => x.LectureId).OnDelete(DeleteBehavior.Cascade);

        // builder.Ignore(x => x.Items);

        // builder.Property(x => x.Items).HasField("_items").UsePropertyAccessMode(PropertyAccessMode.Field);
        // builder.HasMany(x => x.Items).WithOne().HasForeignKey(x => x.LectureId);

        // builder.HasOne<CourseItem>().WithOne().HasForeignKey<Lecture>(x => x.Id).OnDelete(DeleteBehavior.Cascade);


        builder.HasMany<Student>().WithMany().UsingEntity<LectureHomework>(
                   l => l.HasOne(x => x.Student).WithMany(x => x.LectureHomeworks).HasForeignKey(x => x.StudentId),
                   r => r.HasOne(x => x.Lecture).WithMany(x => x.LectureHomeworks).HasForeignKey(x => x.LectureId)
               );

        builder.HasMany<Student>().WithMany().UsingEntity<LectureQuiz>(
                   l => l.HasOne(x => x.Student).WithMany(x => x.LectureQuizzes).HasForeignKey(x => x.StudentId),
                   r => r.HasOne(x => x.Lecture).WithMany(x => x.LectureQuizzes).HasForeignKey(x => x.LectureId)
               );

        builder.HasMany<Student>().WithMany().UsingEntity<LectureAttendance>(
                   l => l.HasOne(x => x.Student).WithMany(x => x.LectureAttendances).HasForeignKey(x => x.StudentId),
                   r => r.HasOne(x => x.Lecture).WithMany(x => x.LectureAttendances).HasForeignKey(x => x.LectureId)
               );

        builder.HasMany(x => x.Lessons).WithOne(x => x.Lecture).HasForeignKey(x => x.LectureId).OnDelete(DeleteBehavior.Cascade).IsRequired();
        builder.HasMany(x => x.Quizzes).WithOne(x => x.Lecture).HasForeignKey(x => x.LectureId).OnDelete(DeleteBehavior.Cascade).IsRequired();

        builder.HasOne(x => x.Course).WithMany(x => x.Lectures).HasForeignKey(x => x.CourseId).OnDelete(DeleteBehavior.Cascade).IsRequired();

        builder.Property(x => x.IsPublished);

        builder.HasMany(x => x.EnrolledStudents).WithMany(x => x.PurchasedLectures).UsingEntity<LectureEnrollment>(
            l => l.HasOne(x => x.Student).WithMany(x => x.LectureEnrollments).HasForeignKey(x => x.StudentId),
            r => r.HasOne(x => x.Lecture).WithMany(x => x.LectureEnrollments).HasForeignKey(x => x.LectureId)
        );


        builder.HasMany(x => x.Assets).WithMany(x => x.Lectures).UsingEntity<LectureAsset>(
            l => l.HasOne(x => x.Asset).WithMany(x => x.LectureAssets).HasForeignKey(x => x.AssetId),
            r => r.HasOne(x => x.Lecture).WithMany(x => x.LectureAssets).HasForeignKey(x => x.LectureId)
        );
    }
}