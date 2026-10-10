using Microsoft.EntityFrameworkCore;

namespace LearnMS.API.Data;

/// <summary>
/// Foreign-key indexes were turned off globally, so the busy student and lecture
/// lookups scanned whole tables as traffic grew. These indexes match the filters
/// the pages already use. Creating an index that already exists is a no-op.
/// </summary>
public static class QueryPerformanceSchema
{
    private static readonly string[] Statements =
    [
        """CREATE INDEX IF NOT EXISTS "IX_CourseEnrollment_StudentId" ON "CourseEnrollment" ("StudentId")""",
        """CREATE INDEX IF NOT EXISTS "IX_LectureEnrollment_LectureId" ON "LectureEnrollment" ("LectureId")""",
        """CREATE INDEX IF NOT EXISTS "IX_LectureAttendance_StudentId" ON "LectureAttendance" ("StudentId")""",
        """CREATE INDEX IF NOT EXISTS "IX_LectureHomework_StudentId" ON "LectureHomework" ("StudentId")""",
        """CREATE INDEX IF NOT EXISTS "IX_LectureChooseHomework_StudentId" ON "LectureChooseHomework" ("StudentId")""",
        """CREATE INDEX IF NOT EXISTS "IX_LectureQuiz_StudentId" ON "LectureQuiz" ("StudentId")""",
        """CREATE INDEX IF NOT EXISTS "IX_LectureStudentCallLogs_StudentId" ON "LectureStudentCallLogs" ("StudentId")""",
        """CREATE INDEX IF NOT EXISTS "IX_LectureAsset_LectureId" ON "LectureAsset" ("LectureId")""",
        """CREATE INDEX IF NOT EXISTS "IX_LectureQuizAnswerAsset_LectureId" ON "LectureQuizAnswerAsset" ("LectureId")""",
        """CREATE INDEX IF NOT EXISTS "IX_LessonAttendance_StudentId" ON "LessonAttendance" ("StudentId")""",
        """CREATE INDEX IF NOT EXISTS "IX_QuizSubmission_StudentId" ON "QuizSubmission" ("StudentId")""",
        """CREATE INDEX IF NOT EXISTS "IX_QuizAttempt_StudentId" ON "QuizAttempt" ("StudentId")""",
        """CREATE INDEX IF NOT EXISTS "IX_QuizQuestion_QuizId" ON "QuizQuestion" ("QuizId")""",
        """CREATE INDEX IF NOT EXISTS "IX_ExamEnrollment_ExamId" ON "ExamEnrollment" ("ExamId")""",
        """CREATE INDEX IF NOT EXISTS "IX_ExamQuestion_QuestionId" ON "ExamQuestion" ("QuestionId")""",
        """CREATE INDEX IF NOT EXISTS "IX_Lessons_LectureId" ON "Lessons" ("LectureId")""",
        """CREATE INDEX IF NOT EXISTS "IX_Quiz_LectureId" ON "Quiz" ("LectureId")""",
        """CREATE INDEX IF NOT EXISTS "IX_Lectures_CourseId" ON "Lectures" ("CourseId")""",
        """CREATE INDEX IF NOT EXISTS "IX_Lectures_Published_CreatedAt" ON "Lectures" ("IsPublished", "CreatedAt")""",
        """CREATE INDEX IF NOT EXISTS "IX_Exam_CourseId" ON "Exam" ("CourseId")""",
        """CREATE INDEX IF NOT EXISTS "IX_Courses_Level_IsPublished" ON "Courses" ("Level", "IsPublished")""",
        """CREATE INDEX IF NOT EXISTS "IX_Students_Level" ON "Students" ("Level")""",
        """CREATE INDEX IF NOT EXISTS "IX_StudentCredit_StudentId" ON "StudentCredit" ("StudentId")""",
        """CREATE INDEX IF NOT EXISTS "IX_StudentEvent_StudentId" ON "StudentEvent" ("StudentId")""",
    ];

    public static async Task EnsureAsync(AppDbContext db)
    {
        foreach (var statement in Statements)
        {
            try
            {
                await db.Database.ExecuteSqlRawAsync(statement);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Query index skipped: {ex.Message}");
            }
        }
    }
}
