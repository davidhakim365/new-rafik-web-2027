using LearnMS.API.Features.Courses;
using LearnMS.API.Features.Courses.Contracts;
using tusdotnet;
using tusdotnet.Interfaces;
using tusdotnet.Models;
using tusdotnet.Stores;

namespace LearnMS.API.ThirdParties.VdoCipher;

public static class VdoServiceEndpoints
{

    public static void MapVideoUploadEndpoints(this WebApplication app)
    {
app.MapTus("/api/courses/{courseId}/lectures/{lectureId}/lessons/{lessonId}/video", async context =>
{
    await Task.CompletedTask;

    string courseId = context.Request.RouteValues["courseId"]?.ToString() ?? throw new ArgumentNullException();
    string lectureId = context.Request.RouteValues["lectureId"]?.ToString() ?? throw new ArgumentNullException();
    string lessonId = context.Request.RouteValues["lessonId"]?.ToString() ?? throw new ArgumentNullException();

    var scope = context.RequestServices.CreateScope();
    var coursesService = scope.ServiceProvider.GetRequiredService<ICoursesService>();
    var store = new TusDiskStore("/tmp", deletePartialFilesOnConcat: true);

    return new DefaultTusConfiguration
    {
        Store = store,
        Events = new()
        {
            OnFileCompleteAsync = async ctx =>
            {
                ITusFile file = await ctx.GetFileAsync();
                var fs = await file.GetContentAsync(ctx.CancellationToken);
                try
                {
                    await coursesService.ExecuteAsync(new UploadLessonVideoCommand
                    {
                        CourseId = Guid.Parse(courseId),
                        LectureId = Guid.Parse(lectureId),
                        FS = fs,
                        LessonId = Guid.Parse(lessonId),
                    });
                }
                catch (Exception)
                {
                    await fs.DisposeAsync();
                    var terminationStore = (ITusTerminationStore)ctx.Store;
                    await terminationStore.DeleteFileAsync(file.Id, ctx.CancellationToken);
                    await store.RemoveExpiredFilesAsync(ctx.CancellationToken);
                    throw;
                }
                finally
                {
                    await fs.DisposeAsync();
                    var terminationStore = (ITusTerminationStore)ctx.Store;
                    await terminationStore.DeleteFileAsync(file.Id, ctx.CancellationToken);
                    await store.RemoveExpiredFilesAsync(ctx.CancellationToken);
                }
            }
        }
    };
});
    }
}