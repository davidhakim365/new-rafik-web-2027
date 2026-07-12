import
  {
    uploadLessonVideo,
    UpdateLessonRequest,
    useDeleteLessonMutation,
    useUpdateLessonMutation,
    waitForVideoReady,
  } from "@/api/lessons-api";
import Confirmation from "@/components/confirmation";
import Loading from "@/components/loading/loading";
import { Button } from "@/components/ui/button";
import
  {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
  } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { useGetLesson } from "@/generated/api";
import { GetDashboardLessonResult } from "@/generated/model";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ListCollapse, Settings2, Upload, Video } from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";

type UploadPhase =
  | "idle"
  | "uploading"
  | "processing"
  | "complete"
  | "error";

const LessonDetailsPage = () => {
  const { courseId, lectureId, lessonId } = useParams();
  const navigate = useNavigate();

  const { data: lesson, isLoading, isError } = useGetLesson(
    courseId!,
    lectureId!,
    lessonId!
  );

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
    values: {
      description,
      title,
      expirationHours,
      renewalPrice,
      videoId: videoId ?? "",
    },
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
            <Settings2 className='text-color2 bg-color2/15 rounded-[50%] w-10 h-10 p-1' />
            Lesson Details
            {form.formState.isDirty && (
              <div className='space-x-1 ms-auto'>
                <Button className='bg-color2/50'>Save</Button>
                <Button
                  variant='outline'
                  type='button'
                  className='border-color2/20'
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
              <FormItem className='p-3 bg-color2/15 border-2 border-color2/30 rounded'>
                <FormLabel className='text-color2'>Title</FormLabel>
                <FormControl>
                  <Input className='text-color2' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem className='p-3 bg-color2/15 border-2 border-color2/30 rounded'>
                <FormLabel className='text-color2'>Description</FormLabel>
                <FormControl>
                  <Textarea className='text-color2' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='renewalPrice'
            render={({ field }) => (
              <FormItem className='p-3 bg-color2/15 border-2 border-color2/30 rounded'>
                <FormLabel className='text-color2'>Renewal Price</FormLabel>
                <FormControl>
                  <Input type='number' className='text-color2' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='expirationHours'
            render={({ field }) => (
              <FormItem className='p-3 bg-color2/15 border-2 border-color2/30 rounded'>
                <FormLabel className='text-color2'>
                  Expiration Hours
                </FormLabel>
                <FormControl>
                  <Input type='number' className='text-color2' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='videoId'
            render={({ field }) => (
              <FormItem className='p-3 bg-color2/15 border-2 border-color2/30 rounded'>
                <FormLabel className='text-color2'>
                  Video Id (optional)
                </FormLabel>
                <FormControl>
                  <Input
                    type='string'
                    className='text-color2'
                    placeholder='Paste VdoCipher video ID here'
                    {...field}
                  />
                </FormControl>
                <FormDescription className='text-color2/70'>
                  Leave empty and upload below, or paste an existing VdoCipher
                  video ID.
                </FormDescription>
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
  lesson: GetDashboardLessonResult;
}) {
  const qc = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setSelectedFile(file);
    setUploadPhase("idle");
    setUploadProgress(0);
    setStatusMessage("");
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "video/*": [] },
    maxFiles: 1,
    disabled: isUploading,
  });

  const refreshLesson = () => {
    qc.invalidateQueries({ queryKey: ["lesson", { id: lessonId }] });
    qc.invalidateQueries({ queryKey: ["course", { id: courseId }] });
    qc.invalidateQueries({ queryKey: ["lecture", { id: lectureId }] });
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please choose a video file first.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadPhase("preparing");
    setUploadProgress(0);
    setStatusMessage("Preparing upload...");

    try {
      setUploadPhase("uploading");
      setStatusMessage("Uploading video...");

      const { videoId } = await uploadLessonVideo({
        courseId,
        lectureId,
        lessonId,
        file: selectedFile,
        onProgress: (percent) => {
          setUploadProgress(percent);
          setStatusMessage(`Uploading video... ${percent}%`);
        },
      });

      setUploadPhase("processing");
      setUploadProgress(100);
      setStatusMessage("Video uploaded. Processing on VdoCipher...");

      await waitForVideoReady({
        courseId,
        lectureId,
        lessonId,
        maxAttempts: 60,
        intervalMs: 5000,
      });

      setUploadPhase("complete");
      setStatusMessage("Video is ready.");
      setSelectedFile(null);
      refreshLesson();

      toast({
        title: "Video uploaded successfully",
        description: `Video ID: ${videoId}`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Upload failed. Please try again.";
      setUploadPhase("error");
      setStatusMessage(message);
      toast({
        title: "Upload failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const showProgress =
    uploadPhase === "uploading" || uploadPhase === "processing";

  return (
    <div className='flex flex-col gap-4 p-4'>
      <div className='flex items-center justify-between text-xl'>
        <div className='flex items-center gap-2'>
          <ListCollapse className='text-primary bg-color2/15 rounded-[50%] w-10 h-10 p-1' />
          Lesson Content
        </div>
      </div>

      <div className='p-4 bg-color2/10 border-2 border-color2/20 rounded-xl space-y-4'>
        <p className='text-sm text-color2/80'>
          Upload a video directly to VdoCipher, or paste a video ID in the
          form on the left.
        </p>

        <div
          {...getRootProps()}
          className={`flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
            isDragActive
              ? "border-color2 bg-color2/20"
              : "border-color2/40 hover:border-color2/70 hover:bg-color2/10"
          } ${isUploading ? "opacity-60 cursor-not-allowed" : ""}`}>
          <input {...getInputProps()} />
          <Video className='w-10 h-10 text-color2/60' />
          {selectedFile ? (
            <div className='text-center'>
              <p className='font-medium text-color2'>{selectedFile.name}</p>
              <p className='text-sm text-color2/60'>
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div className='text-center'>
              <p className='font-medium text-color2'>
                {isDragActive
                  ? "Drop the video here"
                  : "Drag & drop a video, or click to browse"}
              </p>
              <p className='text-sm text-color2/60'>MP4, MOV, AVI and other video formats</p>
            </div>
          )}
        </div>

        {showProgress && (
          <div className='space-y-2'>
            <div className='flex justify-between text-sm text-color2'>
              <span>{statusMessage}</span>
              {uploadPhase === "uploading" && <span>{uploadProgress}%</span>}
            </div>
            <Progress
              value={
                uploadPhase === "uploading"
                  ? uploadProgress
                  : uploadPhase === "processing"
                    ? 100
                    : 0
              }
              className='h-2'
            />
            {uploadPhase === "processing" && (
              <p className='text-xs text-color2/60 animate-pulse'>
                VdoCipher is encoding your video. This may take a few minutes...
              </p>
            )}
          </div>
        )}

        {uploadPhase === "error" && (
          <p className='text-sm text-destructive'>{statusMessage}</p>
        )}

        {uploadPhase === "complete" && (
          <p className='text-sm text-green-600'>{statusMessage}</p>
        )}

        <div className='flex gap-2'>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className='bg-color2/80 hover:bg-color2'>
            <Upload className='w-4 h-4 mr-2' />
            {isUploading ? "Uploading..." : "Upload to VdoCipher"}
          </Button>
          {selectedFile && !isUploading && (
            <Button
              variant='outline'
              type='button'
              onClick={() => {
                setSelectedFile(null);
                setUploadPhase("idle");
                setUploadProgress(0);
                setStatusMessage("");
              }}>
              Clear
            </Button>
          )}
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
