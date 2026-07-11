import
  {
    UpdateLessonRequest,
    useDeleteLessonMutation,
    useUpdateLessonMutation
  } from "@/api/lessons-api";
import Confirmation from "@/components/confirmation";
import Loading from "@/components/loading/loading";
import { Button } from "@/components/ui/button";
import
  {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { useGetLesson } from "@/generated/api";
import { GetDashboardLessonResult } from "@/generated/model";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import Uppy from "@uppy/core";
import Dashboard from "@uppy/dashboard";
import DropTarget from "@uppy/drop-target";
import Tus from "@uppy/tus";
import { ListCollapse, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";

const LessonDetailsPage = () => {
  const { courseId, lectureId, lessonId } = useParams();
  const navigate = useNavigate();

  
  const {data: lesson, isLoading, isError} = useGetLesson(courseId!, lectureId!, lessonId!);

  const deleteLessonMutation = useDeleteLessonMutation();

  if (isLoading) {
    return (
      <div className='flex items-center justify-center w-full h-full'>
        <Loading />
      </div>
    );
  }

  const onDeleting = () => {
    deleteLessonMutation.mutate(
      {
        lectureId: lectureId!,
        courseId: courseId!,
        lessonId: lessonId!,
      },
      {
        onSuccess() {
          navigate(`/dashboard/courses/${courseId}/lectures/${lectureId}`, {
            replace: true,
          });
          toast({
            title: "Deleting",
            description: "Successfully deleted the lesson",
          });
        },
      }
    );
  };

  if (isError || lesson?.data?.$type === "GetStudentLessonResult") {
    return;
  }

  return (
    <div className='w-full h-full p-4'>
      <div className='flex justify-between w-full'>
        <h1 className='text-3xl'>Lesson Setup</h1>
        <div className='flex gap-2 item-center'>
          <Confirmation
            button={<Button variant='destructive'>Delete</Button>}
            title='Are you sure you want to delete this lesson?'
            description='This action cannot be undone.'
            onConfirm={onDeleting}
          />
        </div>
      </div>

      <div className='grid w-full grid-cols-2 mt-10'>
        <LessonDetailsContent
          {...lesson?.data!}
          courseId={courseId!}
          lectureId={lectureId!}
        />
        <LessonVideo
          lesson={lesson?.data!}
          lessonId={lessonId!}
          lectureId={lectureId!}
          courseId={courseId!}
        />
      </div>
    </div>
  );
};

function LessonDetailsContent({
  id,
  description,
  videoId,
  title,
  expirationHours,
  renewalPrice,
  courseId,
  lectureId,
}: GetDashboardLessonResult & { lectureId: string; courseId: string }) {
  const updateLessonMutation = useUpdateLessonMutation();

  const form = useForm<UpdateLessonRequest>({
    resolver: zodResolver(UpdateLessonRequest),
    defaultValues: {
      description,
      title,
      expirationHours,
      videoId: videoId ?? "",
      renewalPrice,
    },
    values: { description, title, expirationHours, renewalPrice, videoId: videoId ?? "" },
  });

  const onSubmit = (data: UpdateLessonRequest) => {
    updateLessonMutation.mutate(
      { lectureId, lessonId: id, courseId, data },
      {
        onSuccess: (data) => {
          toast({
            title: "Lesson updated",
            description: data.message,
          });
        },
      }
    );
  };

  return (
    <div className='px-2'>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='flex flex-col gap-2 p-2'>
          <fieldset
            className='flex items-center gap-2 p-2 text-xl'
            disabled={updateLessonMutation.isPending}>
            <Settings2 className='text-blue-400 bg-blue-200 rounded-[50%] w-10 h-10 p-1' />
            Lesson Details
            {form.formState.isDirty && (
              <div className='space-x-1 ms-auto'>
                <Button className='bg-blue-500'>Save</Button>
                <Button
                  variant='outline'
                  type='button'
                  className='border-blue-200'
                  onClick={() => form.reset()}>
                  Reset
                </Button>
              </div>
            )}
          </fieldset>
          <FormField
            control={form.control}
            name='title'
            render={({ field }) => (
              <FormItem className='p-3 bg-blue-200 border-2 border-blue-400 rounded'>
                <FormLabel className='text-blue-500'>Title</FormLabel>
                <FormControl>
                  <Input className='text-blue-500' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem className='p-3 bg-blue-200 border-2 border-blue-400 rounded'>
                <FormLabel className='text-blue-500'>Description</FormLabel>
                <FormControl>
                  <Textarea className='text-blue-500' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='renewalPrice'
            render={({ field }) => (
              <FormItem className='p-3 bg-blue-200 border-2 border-blue-400 rounded'>
                <FormLabel className='text-blue-500'>Renewal Price</FormLabel>
                <FormControl>
                  <Input type='number' className='text-blue-500' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='expirationHours'
            render={({ field }) => (
              <FormItem className='p-3 bg-blue-200 border-2 border-blue-400 rounded'>
                <FormLabel className='text-blue-500'>
                  Expiration Hours
                </FormLabel>
                <FormControl>
                  <Input type='number' className='text-blue-500' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='videoId'
            render={({ field }) => (
              <FormItem className='p-3 bg-blue-200 border-2 border-blue-400 rounded'>
                <FormLabel className='text-blue-500'>Video Id</FormLabel>
                <FormControl>
                  <Input type='string' className='text-blue-500' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
}

function LessonVideo({
  lessonId,
  courseId,
  lectureId,
  lesson,
}: {
  lessonId: string;
  lectureId: string;
  courseId: string;
  lesson:  GetDashboardLessonResult;
}) {
  const qc = useQueryClient();

  const [uppy] = useState(
    new Uppy({
      restrictions: {
        allowedFileTypes: ["video/*"],
        minNumberOfFiles: 1,
      },
    }).use(Tus, {
      endpoint: `/api/courses/${courseId}/lectures/${lectureId}/lessons/${lessonId}/video`,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      onShouldRetry(_) {
        return false;
      },
      onAfterResponse(_, res) {
        if (res.getStatus() === 204) {
          toast({
            title: "Video uploaded successfully",
          });
          qc.invalidateQueries({
            queryKey: ["lesson", { id: lessonId }],
          });
        }
      },
    })
  );

  useEffect(() => {
    uppy
      .use(DropTarget, {
        target: "#lesson-video-drop-zone",
        onDrop: () => {
          const plugin: any = uppy.getPlugin("Dashboard");
          plugin.openModal();
        },
      })
      .use(Dashboard, {
        inline: false,
        target: "#lesson-video-drop-zone",
        height: 200,
      });
  }, []);


  return (
    <div className='flex flex-col gap-4 p-4' id='lesson-video-drop-zone'>
      <div className='flex items-center justify-between text-xl'>
        <div className='flex items-center gap-2'>
          <ListCollapse className='text-primary bg-blue-200 rounded-[50%] w-10 h-10 p-1' />
          Lesson Content
        </div>
      </div>

      

      {lesson.videoOTP?.playbackInfo && (
        <div className='w-full rounded-xl aspect-video overflow-clip'>
          <iframe
            src={`https://player.vdocipher.com/v2/?otp=${
              lesson.videoOTP!.otp
            }&playbackInfo=${lesson.videoOTP.playbackInfo}`}
            allowFullScreen
            className='object-cover w-full h-full'
            allow='encrypted-media'></iframe>
        </div>
      )}
    </div>
  );
}

export default LessonDetailsPage;
