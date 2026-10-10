using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LearnMS.API.Migrations;

[DbContext(typeof(Data.AppDbContext))]
[Migration("20261010170000_QueryPerformanceIndexes")]
public partial class QueryPerformanceIndexes : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            CREATE INDEX IF NOT EXISTS "IX_CourseEnrollment_StudentId" ON "CourseEnrollment" ("StudentId");
            CREATE INDEX IF NOT EXISTS "IX_LectureEnrollment_LectureId" ON "LectureEnrollment" ("LectureId");
            CREATE INDEX IF NOT EXISTS "IX_LectureAttendance_StudentId" ON "LectureAttendance" ("StudentId");
            CREATE INDEX IF NOT EXISTS "IX_LectureHomework_StudentId" ON "LectureHomework" ("StudentId");
            CREATE INDEX IF NOT EXISTS "IX_LectureChooseHomework_StudentId" ON "LectureChooseHomework" ("StudentId");
            CREATE INDEX IF NOT EXISTS "IX_LectureQuiz_StudentId" ON "LectureQuiz" ("StudentId");
            CREATE INDEX IF NOT EXISTS "IX_LectureStudentCallLogs_StudentId" ON "LectureStudentCallLogs" ("StudentId");
            CREATE INDEX IF NOT EXISTS "IX_LectureAsset_LectureId" ON "LectureAsset" ("LectureId");
            CREATE INDEX IF NOT EXISTS "IX_LectureQuizAnswerAsset_LectureId" ON "LectureQuizAnswerAsset" ("LectureId");
            CREATE INDEX IF NOT EXISTS "IX_LessonAttendance_StudentId" ON "LessonAttendance" ("StudentId");
            CREATE INDEX IF NOT EXISTS "IX_QuizSubmission_StudentId" ON "QuizSubmission" ("StudentId");
            CREATE INDEX IF NOT EXISTS "IX_QuizAttempt_StudentId" ON "QuizAttempt" ("StudentId");
            CREATE INDEX IF NOT EXISTS "IX_QuizQuestion_QuizId" ON "QuizQuestion" ("QuizId");
            CREATE INDEX IF NOT EXISTS "IX_ExamEnrollment_ExamId" ON "ExamEnrollment" ("ExamId");
            CREATE INDEX IF NOT EXISTS "IX_ExamQuestion_QuestionId" ON "ExamQuestion" ("QuestionId");
            CREATE INDEX IF NOT EXISTS "IX_Lessons_LectureId" ON "Lessons" ("LectureId");
            CREATE INDEX IF NOT EXISTS "IX_Quiz_LectureId" ON "Quiz" ("LectureId");
            CREATE INDEX IF NOT EXISTS "IX_Lectures_CourseId" ON "Lectures" ("CourseId");
            CREATE INDEX IF NOT EXISTS "IX_Lectures_Published_CreatedAt" ON "Lectures" ("IsPublished", "CreatedAt");
            CREATE INDEX IF NOT EXISTS "IX_Exam_CourseId" ON "Exam" ("CourseId");
            CREATE INDEX IF NOT EXISTS "IX_Courses_Level_IsPublished" ON "Courses" ("Level", "IsPublished");
            CREATE INDEX IF NOT EXISTS "IX_Students_Level" ON "Students" ("Level");
            CREATE INDEX IF NOT EXISTS "IX_StudentCredit_StudentId" ON "StudentCredit" ("StudentId");
            CREATE INDEX IF NOT EXISTS "IX_StudentEvent_StudentId" ON "StudentEvent" ("StudentId");
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DROP INDEX IF EXISTS "IX_CourseEnrollment_StudentId";
            DROP INDEX IF EXISTS "IX_LectureEnrollment_LectureId";
            DROP INDEX IF EXISTS "IX_LectureAttendance_StudentId";
            DROP INDEX IF EXISTS "IX_LectureHomework_StudentId";
            DROP INDEX IF EXISTS "IX_LectureChooseHomework_StudentId";
            DROP INDEX IF EXISTS "IX_LectureQuiz_StudentId";
            DROP INDEX IF EXISTS "IX_LectureStudentCallLogs_StudentId";
            DROP INDEX IF EXISTS "IX_LectureAsset_LectureId";
            DROP INDEX IF EXISTS "IX_LectureQuizAnswerAsset_LectureId";
            DROP INDEX IF EXISTS "IX_LessonAttendance_StudentId";
            DROP INDEX IF EXISTS "IX_QuizSubmission_StudentId";
            DROP INDEX IF EXISTS "IX_QuizAttempt_StudentId";
            DROP INDEX IF EXISTS "IX_QuizQuestion_QuizId";
            DROP INDEX IF EXISTS "IX_ExamEnrollment_ExamId";
            DROP INDEX IF EXISTS "IX_ExamQuestion_QuestionId";
            DROP INDEX IF EXISTS "IX_Lessons_LectureId";
            DROP INDEX IF EXISTS "IX_Quiz_LectureId";
            DROP INDEX IF EXISTS "IX_Lectures_CourseId";
            DROP INDEX IF EXISTS "IX_Lectures_Published_CreatedAt";
            DROP INDEX IF EXISTS "IX_Exam_CourseId";
            DROP INDEX IF EXISTS "IX_Courses_Level_IsPublished";
            DROP INDEX IF EXISTS "IX_Students_Level";
            DROP INDEX IF EXISTS "IX_StudentCredit_StudentId";
            DROP INDEX IF EXISTS "IX_StudentEvent_StudentId";
            """);
    }
}
