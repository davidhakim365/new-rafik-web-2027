import { useUpdateLectureAssetsMutation } from "@/api/lectures-api";
import {
  getLectureStatisticsParams,
  readSelectedCenterId,
  useAttendLectureAtCenter,
} from "@/api/centers-api";
import { CenterSelector } from "@/components/dashboard/center-selector";
import Confirmation from "@/components/confirmation";
import Loading from "@/components/loading/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ImageUploadField } from "@/components/image-upload-field";
import { toast } from "@/components/ui/use-toast";
import { resolveApiUrl } from "@/lib/api-base-url";
import { Lesson } from "@/types/lessons";
import { Quiz } from "@/types/quiz";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Delete,
  Edit2,
  ListCollapse,
  Loader2,
  Menu,
  Settings2,
  Trash,
} from "lucide-react";
import Papa from "papaparse";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import { useDeleteLessonMutation } from "@/api/lessons-api";
import { DataTable } from "@/components/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getGetCourseQueryKey,
  getGetLectureQueryKey,
  getGetLectureStudentsQueryKey,
  getGetLectureStatisticsQueryKey,
  useCreateLesson,
  useDeleteLecture,
  useGetCourse,
  useGetLecture,
  useGetLectureStatistics,
  useGetLectureStudents,
  useGetProfile,
  usePublishLecture,
  useUnPublishLecture,
  useUpdateLecture,
  useUpdateLectureGrades,
} from "@/generated/api";
import { GetLectureDashboardResult, StudentGradeItem } from "@/generated/model";
import useDownloadFile from "@/hooks/useDownloadFile";
import { createLectureStudentsColumns } from "@/pages/dashboard/lectures/lecture-students-columns";
import { LectureStudentStats } from "@/pages/dashboard/lectures/lecture-student-stats";
import { useAssetsStore } from "@/store/use-assets-store";
import { useModalStore } from "@/store/use-modal-store";
import { useQueryClient } from "@tanstack/react-query";
import { PaginationState } from "@tanstack/react-table";
import _ from "lodash";
import {
  FaBarcode,
  FaCheck,
  FaFile,
  FaFileExport,
  FaFileImport,
  FaFilePdf,
  FaImage,
} from "react-icons/fa";
import { z } from "zod";

const LectureDetailsPage = () => {
  const { courseId, lectureId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data, isLoading, isError } = useGetLecture(courseId!, lectureId!);

  if (isError) {
    return;
  }

  const lecture = data?.data!;

  if (lecture?.$type !== "GetLectureDashboardResult") return;

  return (
    <Tabs
      className='w-full h-full '
      defaultValue='details'
      onValueChange={(value) => {
        setSearchParams({ view: value });
      }}
      value={searchParams.get("view") ?? "details"}>
      <TabsList className="h-auto w-full justify-start overflow-x-auto">
        <TabsTrigger value='details' className="shrink-0">Details</TabsTrigger>
        <TabsTrigger value='students' className="shrink-0">Students</TabsTrigger>
      </TabsList>
      <TabsContent value='details'>
        <LectureDetailsTab lecture={lecture} courseId={courseId!} />
      </TabsContent>
      <TabsContent value='students' className='p-2'>
        <LectureStudentTab lecture={lecture} courseId={courseId!} />
      </TabsContent>
    </Tabs>
  );
};

export default LectureDetailsPage;

type TabProps = {
  lecture: GetLectureDashboardResult;
  courseId: string;
};

const LectureStudentTab: React.FC<TabProps> = ({ lecture, courseId }) => {
  const { download, isDownloading } = useDownloadFile();
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(
    () => readSelectedCenterId()
  );
  const [selectedCenterName, setSelectedCenterName] = useState<string>();

  const handleCenterChange = useCallback(
    (centerId: string | null, center?: { name: string }) => {
      setSelectedCenterId(centerId);
      setSelectedCenterName(center?.name);
    },
    []
  );

  const qc = useQueryClient();
  const updateLecture = useUpdateLecture({
    mutation: {
      onSuccess() {
        qc.invalidateQueries({
          queryKey: getGetLectureQueryKey(courseId, lecture.id),
        });
        toast({
          title: "Full marks saved",
          description: "You can now enter student scores.",
        });
      },
      onError(error: Error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      },
    },
  });

  const updateLectureGrades = useUpdateLectureGrades({
    mutation: {
      onSuccess() {
        qc.invalidateQueries({
          queryKey: getGetLectureStudentsQueryKey(courseId, lecture.id),
        });
        qc.invalidateQueries({
          queryKey: getGetLectureStatisticsQueryKey({ lectureId: lecture.id }),
        });
      },
      onError(error: Error) {
        toast({
          title: "Error",
          description: error.message,
        });
      },
    },
  });

  const { data: lectureStatistics, isLoading: lectureStatisticsLoading } =
    useGetLectureStatistics(
      getLectureStatisticsParams(lecture.id, selectedCenterId) as any
    );

  const studentColumns = useMemo(
    () =>
      createLectureStudentsColumns(selectedCenterId, {
        homeworkFullMark: lecture.homeworkFullMark,
        quizFullMark: lecture.quizFullMark,
      }),
    [selectedCenterId, lecture.homeworkFullMark, lecture.quizFullMark]
  );

  const { data: gradeTotalData } = useGetLectureStudents(
    lecture.courseId,
    lecture.id,
    { page: 1, pageSize: 1 }
  );

  const { data: courseData } = useGetCourse(courseId);
  const gradeLevel =
    courseData?.data?.$type === "GetDashboardCourseResult"
      ? courseData.data.level
      : undefined;

  const totalInGrade = gradeTotalData?.data?.totalCount ?? 0;

  const [searchParams, setSearchParams] = useSearchParams();
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: Number(searchParams.get("page") ?? 1) - 1,
    pageSize: Number(searchParams.get("pageSize") ?? 10),
  });
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  useEffect(() => {
    setSearchParams({
      page: `${pageIndex + 1}`,
      pageSize: `${pageSize}`,
      view: "students",
      ...(search ? { search } : {}),
    });
  }, [pageIndex, search, pageSize]);
  const { data, isLoading } = useGetLectureStudents(
    lecture.courseId,
    lecture.id,
    {
      page: Number(searchParams.get("page")) || 1,
      pageSize: Number(searchParams.get("pageSize")) || 10,
      search,
    }
  );

  const onExport = async () => {
    await download(
      `/api/courses/${lecture.courseId}/lectures/${lecture.id}/students/export`,
      "students.csv"
    );
  };

  const onImport = async () => {
    try {
      const [file] = await window.showOpenFilePicker({
        multiple: false,
        types: [
          {
            description: "CSV",
            accept: {
              "text/csv": [".csv"],
            },
          },
        ],
      });

      const f = await file.getFile();
      Papa.parse(f, {
        complete(results: any) {
          const codes = results.data
            .filter((x: any) => x[0]) // Ensure the code column exists and is not empty
            .map(([code]: any) => ({ code })); // Create StudentGradeItem objects

          if (codes.length === 0) {
            toast({
              title: "Import Error",
              description: "No valid student codes found in the CSV file.",
            });
            return;
          }

          updateLectureGrades.mutate({
            courseId,
            lectureId: lecture.id,
            data: {
              grades: codes as StudentGradeItem[], // Ensure correct type
            },
          });
        },
        error(err: any) {
          toast({
            title: "Import Error",
            description: `Failed to parse CSV file: ${err.message}`,
          });
        },
      });
    } catch (error: any) {
      toast({
        title: "File Error",
        description: `Failed to open file: ${error.message}`,
      });
    }
  };

  return (
    <div className="flex w-full flex-col gap-4 p-3 sm:p-4">
      <LectureStudentStats
        stats={lectureStatistics?.data}
        isLoading={lectureStatisticsLoading}
        totalInGrade={totalInGrade}
        gradeLevel={gradeLevel}
        filteredCount={data?.data?.totalCount}
        isSearching={!!search.trim()}
        selectedCenterName={selectedCenterName}
      />

      <CenterSelector
        value={selectedCenterId}
        onChange={handleCenterChange}
        className="rounded-xl border border-color2/15 bg-muted/20 p-3"
      />

      <LectureFullMarksForm
        lecture={lecture}
        isSaving={updateLecture.isPending}
        onSave={(data) =>
          updateLecture.mutate({
            courseId,
            lectureId: lecture.id,
            data,
          })
        }
      />

      {!selectedCenterId && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
          Select an attendance center before scanning barcodes or marking students
          as attended.
        </p>
      )}

      <div className="flex flex-col gap-3">
        <Input
          className="w-full"
          placeholder="Search students..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <AttendInput
            lectureId={lecture.id}
            courseId={lecture.courseId}
            centerId={selectedCenterId}
          />
          <Button
            disabled={updateLectureGrades.isPending}
            variant="outline"
            className="w-full border-red-200 text-red-500 sm:w-auto"
            onClick={onImport}
          >
            {updateLectureGrades.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FaFileImport className="h-4 w-4" />
            )}
            <span className="ml-2">Import CSV</span>
          </Button>
          <Button
            disabled={isDownloading}
            variant="outline"
            className="w-full text-primary sm:w-auto"
            onClick={onExport}
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FaFileExport className="h-4 w-4" />
            )}
            <span className="ml-2">Export</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Loading />
        </div>
      ) : (
        <DataTable
          data={data?.data!.items!}
          pagination={{
            hasNextPage: data!.data!.hasNextPage,
            hasPreviousPage: data!.data!.hasPreviousPage,
            pageIndex,
            pageSize,
            pageCount: data!.data!.totalCount,
          }}
          rowCount={data?.data!.totalCount!}
          columns={studentColumns}
          setPagination={setPagination}
        />
      )}
    </div>
  );
};

function LectureFullMarksForm({
  lecture,
  isSaving,
  onSave,
}: {
  lecture: GetLectureDashboardResult;
  isSaving: boolean;
  onSave: (data: {
    homeworkFullMark?: number;
    quizFullMark?: number;
  }) => void;
}) {
  const [homeworkFullMark, setHomeworkFullMark] = useState(
    lecture.homeworkFullMark?.toString() ?? ""
  );
  const [quizFullMark, setQuizFullMark] = useState(
    lecture.quizFullMark?.toString() ?? ""
  );

  useEffect(() => {
    setHomeworkFullMark(lecture.homeworkFullMark?.toString() ?? "");
    setQuizFullMark(lecture.quizFullMark?.toString() ?? "");
  }, [lecture.homeworkFullMark, lecture.quizFullMark]);

  const hw = Number(homeworkFullMark);
  const qz = Number(quizFullMark);
  const hwValid = Number.isFinite(hw) && hw > 0;
  const qzValid = Number.isFinite(qz) && qz > 0;
  const canSave = hwValid || qzValid;

  return (
    <div className="rounded-xl border border-color2/20 bg-color2/5 p-3 sm:p-4">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-foreground">
          Offline score full marks
        </h3>
        <p className="text-xs text-muted-foreground">
          Set full marks first, then enter each student score (out of these
          totals).
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Homework full mark
          </label>
          <Input
            type="number"
            min={0.01}
            step="any"
            placeholder="e.g. 20"
            value={homeworkFullMark}
            onChange={(e) => setHomeworkFullMark(e.target.value)}
            className="w-full sm:w-40"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Quiz full mark
          </label>
          <Input
            type="number"
            min={0.01}
            step="any"
            placeholder="e.g. 10"
            value={quizFullMark}
            onChange={(e) => setQuizFullMark(e.target.value)}
            className="w-full sm:w-40"
          />
        </div>
        <Button
          type="button"
          disabled={!canSave || isSaving}
          onClick={() => {
            const data: {
              homeworkFullMark?: number;
              quizFullMark?: number;
            } = {};
            if (hwValid) data.homeworkFullMark = hw;
            if (qzValid) data.quizFullMark = qz;
            onSave(data);
          }}
          className="w-full sm:w-auto"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Save full marks"
          )}
        </Button>
      </div>
      {(!lecture.homeworkFullMark || !lecture.quizFullMark) && (
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
          Score fields unlock after their full mark is saved.
        </p>
      )}
    </div>
  );
}

const LectureDetailsTab: React.FC<TabProps> = ({ lecture }) => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { mutate: publish, isPending: isPublishing } = usePublishLecture({
    mutation: {
      onSuccess() {
        qc.invalidateQueries({
          queryKey: getGetLectureQueryKey(lecture.courseId!, lecture.id),
        });
        toast({
          title: "Publishing",
          description: lecture.isPublished
            ? "Successfully unpublished the course"
            : "Successfully published the course",
        });
      },
    },
  });
  const { mutate: unPublish, isPending: isUnPublishing } = useUnPublishLecture({
    mutation: {
      onSuccess() {
        qc.invalidateQueries({
          queryKey: getGetLectureQueryKey(lecture.courseId!, lecture.id),
        });
        toast({
          title: "UnPublishing",
          description: lecture.isPublished
            ? "Successfully unpublished the course"
            : "Successfully published the course",
        });
      },
    },
  });
  const { mutate: deleteLecture, isPending: isDeleting } = useDeleteLecture({
    mutation: {
      onSuccess() {
        qc.invalidateQueries({
          queryKey: getGetCourseQueryKey(lecture.courseId!),
        });
        navigate(`/dashboard/courses/${lecture.courseId}`, {
          replace: true,
        });
        toast({
          title: "Deleting",
          description: "Successfully deleted the lecture",
        });
      },
    },
  });

  const { data: profile } = useGetProfile();

  const isLoading = isPublishing || isDeleting || isUnPublishing;

  if (
    profile?.data?.$type === "GetAssistantProfileResult" &&
    !profile.data.permissions.includes("ManageLecture")
  ) {
    return (
      <div className='flex items-center justify-center w-full h-full'>
        <p>You do not have permission to view this page</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center w-full h-full'>
        <Loading />
      </div>
    );
  }

  const onPublish = () => {
    if (lecture.isPublished) {
      unPublish({ courseId: lecture.courseId!, lectureId: lecture.id });
    } else {
      publish({ courseId: lecture.courseId!, lectureId: lecture.id });
    }
  };

  return (
    <div className='w-full h-full p-4'>
      <div className='flex w-full'>
        <div className='flex gap-2 ms-auto item-center'>
          <Confirmation
            button={<Button variant='destructive'>Delete</Button>}
            title='Are you sure you want to delete this lecture?'
            description='This action cannot be undone.'
            onConfirm={() => {
              deleteLecture({
                courseId: lecture.courseId!,
                lectureId: lecture.id,
              });
            }}
          />

          <Button
            disabled={isLoading}
            onClick={onPublish}
            className='bg-card border rounded text-primary border-primary hover:bg-primary hover:text-primary-foreground'>
            {lecture.isPublished ? "UnPublish" : "Publish"}
          </Button>
        </div>
      </div>

      <div className='grid w-full grid-cols-1 gap-6 mt-6 sm:mt-24 lg:mt-10 lg:grid-cols-2'>
        <LectureDetailsForm {...lecture} />
        <LectureContentForm {...lecture} />
        <div className='col-span-1 p-4 lg:col-span-2'>
          <LectureAssetsFrom {...lecture} />
        </div>
      </div>
    </div>
  );
};

const UpdateLectureRequest = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string(),
  price: z.coerce.number().min(0, { message: "Price must be greater than 0" }),
  renewalPrice: z.coerce
    .number()
    .min(0, { message: "Renewal Price is greater than 0" }),
  expirationDays: z.coerce
    .number()
    .min(0, { message: "Expiration days must be greater than 0" }),
  imageUrl: z.string(),
  homeworkVideoUrl: z
    .string()
    .trim()
    .refine(
      (v) =>
        !v ||
        /^https?:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\//i.test(v),
      { message: "Enter a valid YouTube link" }
    )
    .optional()
    .or(z.literal("")),
});

type UpdateLectureRequest = z.infer<typeof UpdateLectureRequest>;

function LectureDetailsForm({
  id,
  description,
  title,
  expirationDays,
  imageUrl,
  homeworkVideoUrl,
  renewalPrice,
  courseId,
  price,
}: GetLectureDashboardResult) {
  const qc = useQueryClient();
  const { mutate: updateLecture, isPending } = useUpdateLecture({
    mutation: {
      onSuccess: (data) => {
        qc.invalidateQueries({
          queryKey: getGetLectureQueryKey(courseId!, id),
        });
        toast({
          title: "Lecture updated",
          description: data.message,
        });
      },
    },
  });

  const form = useForm<UpdateLectureRequest>({
    resolver: zodResolver(UpdateLectureRequest),
    defaultValues: {
      description,
      expirationDays,
      renewalPrice,
      price,
      imageUrl,
      homeworkVideoUrl: homeworkVideoUrl ?? "",
    },
    values: {
      description,
      title,
      expirationDays,
      renewalPrice,
      price,
      imageUrl,
      homeworkVideoUrl: homeworkVideoUrl ?? "",
    },
  });

  const onSubmit = (data: UpdateLectureRequest) => {
    updateLecture({
      lectureId: id,
      courseId,
      data,
    });
  };

  return (
    <div className='px-2'>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='flex flex-col gap-2 p-2'>
          <fieldset
            className='flex items-center gap-2 p-2 text-xl'
            disabled={isPending}>
            <Settings2 className='text-color2 bg-color2/15 rounded-[50%] w-10 h-10 p-1' />
            Session Details
            {form.formState.isDirty && (
              <div className='space-x-1 ms-auto'>
                <Button className='bg-primary'>Save</Button>
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
                <FormLabel className='text-primary'>Title</FormLabel>
                <FormControl>
                  <Input className='text-primary' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem className='p-3 bg-color2/15 border-2 border-color2/30 rounded '>
                <FormLabel className='text-primary'>Description</FormLabel>
                <FormControl>
                  <div style={{ height: "200px", width: "100%" }}>
                    <textarea
                      className='text-color2'
                      style={{
                        height: "100%",
                        width: "100%",
                        resize: "none",
                        fontSize: "14px",
                      }} // Fill the container
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='homeworkVideoUrl'
            render={({ field }) => (
              <FormItem className='p-3 bg-color2/15 border-2 border-color2/30 rounded'>
                <FormLabel className='text-primary'>
                  Lecture Video Homework (YouTube)
                </FormLabel>
                <FormControl>
                  <Input
                    className='text-primary'
                    placeholder='https://www.youtube.com/watch?v=...'
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='price'
            render={({ field }) => (
              <FormItem className='p-3 bg-color2/15 border-2 border-color2/30 rounded'>
                <FormLabel className='text-primary'>Price</FormLabel>
                <FormControl>
                  <Input type='number' className='text-primary' {...field} />
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
                <FormLabel className='text-primary'>RenewalPrice</FormLabel>
                <FormControl>
                  <Input type='number' className='text-primary' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='expirationDays'
            render={({ field }) => (
              <FormItem className='p-3 bg-color2/15 border-2 border-color2/30 rounded'>
                <FormLabel className='text-primary'>Expiration Days</FormLabel>
                <FormControl>
                  <Input type='number' className='text-primary' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='imageUrl'
            render={({ field }) => (
              <FormItem className='p-3 bg-color2/15 border-2 border-color2/30 rounded'>
                <FormLabel className='text-primary'>Image</FormLabel>
                <FormControl>
                  <ImageUploadField
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isPending}
                  />
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

function LectureContentForm({
  items,
  id: lectureId,
  courseId,
}: GetLectureDashboardResult) {
  const [isAddingLesson, setIsAddingLecture] = useState(false);
  return (
    <div className='flex flex-col gap-4 p-4'>
      <div className='flex items-center justify-between text-xl'>
        <div className='flex items-center gap-2'>
          <ListCollapse className='text-color2 bg-color2/15 rounded-[50%] w-10 h-10 p-1' />
          Session Content
        </div>
        <div className='flex items-center justify-center gap-2'>
          {!isAddingLesson ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Menu />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    className='hover:bg-color2 hover:text-primary-foreground hover:cursor-pointer'
                    onClick={() => setIsAddingLecture(true)}>
                    Add Lesson
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <Link
                    to={`/dashboard/courses/${courseId}/lectures/${lectureId}/quizzes/add`}>
                    <DropdownMenuItem>Add Quiz</DropdownMenuItem>
                  </Link>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button
              variant='destructive'
              onClick={() => {
                setIsAddingLecture(false);
              }}>
              Cancel
            </Button>
          )}
        </div>
      </div>
      {isAddingLesson && (
        <AddLessonForm
          courseId={courseId}
          lectureId={lectureId}
          onClose={() => setIsAddingLecture(false)}
        />
      )}

      {!isAddingLesson && (
        <div className='flex flex-col gap-2'>
          {items.map((item) => (
            <LectureItem
              key={item.id}
              item={item}
              courseId={courseId}
              lectureId={lectureId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LectureItem({
  item,
  courseId,
  lectureId,
}: {
  item: Quiz | Lesson;
  courseId: string;
  lectureId: string;
}) {
  const { mutate } = useDeleteLessonMutation();

  const qc = useQueryClient();

  const onDelete = () => {
    mutate(
      { courseId, lessonId: item.id, lectureId },
      {
        onSuccess: () => {
          toast({
            title: "Success",
            description: "Lesson deleted successfully",
          });
          qc.invalidateQueries({ queryKey: ["course", { id: courseId }] });
          qc.invalidateQueries({
            queryKey: ["lecture", { id: lectureId, courseId }],
          });
        },
      }
    );
  };

  return (
    <div className='flex items-center justify-between w-full gap-2 bg-color2/10 border border-color2/25 rounded text-primary'>
      <div className='flex gap-2'>
        <div className='p-2'>{item.title}</div>
      </div>
      <div className='flex items-center gap-2'>
        {item.type === "Lesson" && (
          <Confirmation
            title='Delete Lesson'
            description='Are you sure you want to delete this lesson?'
            onConfirm={onDelete}
            button={
              <Trash
                className='w-4 h-4 hover:cursor-pointer hover:scale-105'
                color='red'
              />
            }></Confirmation>
        )}
        <Badge className='h-5'>{item.type}</Badge>
        <Link
          className='me-2'
          to={`/dashboard/courses/${courseId}/lectures/${lectureId}/${
            item.type === "Lesson" ? "lessons" : "quizzes"
          }/${item.id}`}>
          <Edit2 className='w-4 h-4' />
        </Link>
      </div>
    </div>
  );
}

const AddLessonRequest = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  expirationHours: z.coerce
    .number()
    .min(0)
    .max(24, { message: "Expiration hours must be less than 24" }),
  renewalPrice: z.coerce
    .number()
    .min(0, { message: "Renewal Price is greater than 0" }),
  description: z.string().min(1, { message: "Description is required" }),
});

type AddLessonRequest = z.infer<typeof AddLessonRequest>;

function AddLessonForm({
  courseId,
  lectureId,
  onClose,
}: {
  courseId: string;
  lectureId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const createLessonMutation = useCreateLesson({
    mutation: {
      onSuccess: (data) => {
        qc.invalidateQueries({
          queryKey: getGetLectureQueryKey(courseId, lectureId),
        });
        toast({
          title: "Lesson added",
          description: data.message,
        });
        onClose();
      },
    },
  });

  const form = useForm<AddLessonRequest>({
    resolver: zodResolver(AddLessonRequest),
    defaultValues: {
      title: "",
      description: "",
      expirationHours: 0,
      renewalPrice: 0,
    },
  });

  const onSubmit = (data: AddLessonRequest) => {
    createLessonMutation.mutate({ courseId, lectureId, data });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <fieldset
          className='p-2 space-y-2 border-2 border-color2/30 rounded'
          disabled={createLessonMutation.isPending}>
          <FormField
            control={form.control}
            name='title'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-primary'>Title</FormLabel>
                <FormControl>
                  <Input type='text' className='text-primary' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-primary'>Description</FormLabel>
                <FormControl>
                  <Input type='text' className='text-primary' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='renewalPrice'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-primary'>Renewal Price</FormLabel>
                <FormControl>
                  <Input type='number' className='text-primary' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='expirationHours'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-primary'>Expiration Hours</FormLabel>
                <FormControl>
                  <Input type='number' className='text-primary' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type='submit'>Add</Button>
        </fieldset>
      </form>
    </Form>
  );
}

function LectureAssetsFrom({
  assets: oldAssets,
  id,
  courseId,
}: GetLectureDashboardResult) {
  const { openModal } = useModalStore();
  const { clearAssets, addAssets, assets, removeAsset } = useAssetsStore();

  const updateLectureAssetsMutation = useUpdateLectureAssetsMutation();

  const onUpdate = () => {
    updateLectureAssetsMutation.mutate(
      { lectureId: id, courseId, data: assets.map((asset) => asset.id) },
      {
        onSuccess: (data) => {
          toast({
            title: "PDF updated",
            description: data.message,
          });
        },
      }
    );
  };

  const isDirty = useMemo(
    () => !_.isEqual(_.sortBy(oldAssets, "id"), _.sortBy(assets, "id")),
    [oldAssets, assets]
  );

  const oldAssetIds = (oldAssets ?? []).map((a) => a.id).sort().join(",");

  useEffect(() => {
    clearAssets();
    addAssets(oldAssets ?? []);
  }, [oldAssetIds]);

  const assetHref = (asset: (typeof assets)[number]) =>
    resolveApiUrl(asset.url || `/api/assets/${asset.id}`);

  return (
    <div className='w-full h-full'>
      <div className='flex items-center justify-between m-4 text-2xl'>
        <div className='flex items-center gap-2'>
          <div className='p-3 bg-primary/30 border-primary/40 rounded-[50%]'>
            <FaFile className='text-primary' />
          </div>
          PDF
        </div>
        <div className='flex gap-2'>
          {isDirty && <Button onClick={onUpdate}>Update</Button>}
          <Button
            variant='outline'
            onClick={() => openModal("select-assets-modal")}
          >
            From Files
          </Button>
          <Button
            onClick={() =>
              openModal("add-pdf-links-modal", {
                courseId,
                lectureId: id,
              })
            }
          >
            Add PDF
          </Button>
        </div>
      </div>
      <div className='p-10 border-[3px] bg-primary/30 border-primary/50 rounded flex flex-wrap  items-center gap-4'>
        {assets.length === 0 && (
          <p className='self-center text-5xl text-primary/40'>NO PDFs</p>
        )}
        {assets.map((asset) => (
          <div
            key={asset.id}
            className='relative p-5 rounded-xl w-52 h-fit bg-card/85'>
            <Button
              className='absolute top-0 right-0'
              size='icon'
              onClick={() => removeAsset(asset.id)}
              variant='destructive'>
              <Delete />
            </Button>
            {asset.type === "Image" && (
              <a href={assetHref(asset)} target='_blank' rel='noreferrer'>
                <FaImage className='w-full h-full text-primary/40' />
              </a>
            )}
            {asset.type === "Pdf" && (
              <a href={assetHref(asset)} target='_blank' rel='noreferrer'>
                <FaFilePdf className='w-full h-full text-primary/40' />
              </a>
            )}
            {asset.type === "Unknown" && (
              <a href={assetHref(asset)} target='_blank' rel='noreferrer'>
                <FaFile className='w-full h-full text-primary/40' />
              </a>
            )}
            <p className='mt-2 font-medium break-words'>{asset.name}</p>
            {asset.lectureName && (
              <p className='text-xs text-muted-foreground break-words'>
                {asset.lectureName}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AttendInput({
  lectureId,
  courseId,
  centerId,
}: {
  lectureId: string;
  courseId: string;
  centerId: string | null;
}) {
  const navigate = useNavigate();
  const [showManual, setShowManual] = useState(false);
  const [code, setCode] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const { mutate: attendLecture, isPending } = useAttendLectureAtCenter({
    mutation: {
      throwOnError: false,
    },
  });

  useEffect(() => {
    if (!showManual) return;
    const timer = setTimeout(() => {
      if (code.length > 0) handleSubmit();
    }, 1000);

    return () => clearTimeout(timer);
  }, [code, showManual]);

  const handleSubmit = async () => {
    if (!code || !centerId) {
      if (!centerId) {
        toast({
          title: "Select a center",
          description: "Choose an attendance center before marking attendance.",
          variant: "destructive",
        });
      }
      return;
    }

    attendLecture(
      {
        courseId,
        lectureId,
        code,
        centerId,
      },
      {
        onSuccess: (data) => {
          toast({
            title: "Success",
            description: data.message,
          });
          qc.invalidateQueries({
            queryKey: getGetLectureStudentsQueryKey(courseId, lectureId),
          });
          qc.invalidateQueries({
            queryKey: getGetLectureStatisticsQueryKey(
              getLectureStatisticsParams(lectureId, centerId) as any
            ),
          });
          setCode("");
          inputRef.current?.focus();
        },
        onError: (_) => {
          setCode("");
          inputRef.current?.focus();
        },
      }
    );
  };

  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
      <Button
        className="w-full gap-2 bg-gradient-to-r from-color1 to-color2 sm:w-auto"
        disabled={!centerId}
        onClick={() =>
          navigate(
            `/dashboard/courses/${courseId}/lectures/${lectureId}/scan`
          )
        }
      >
        <FaBarcode className="h-4 w-4" />
        Scan Barcode
      </Button>
      <Button
        variant="outline"
        className="w-full sm:w-auto"
        onClick={() => setShowManual((state) => !state)}
      >
        {showManual ? "Hide Manual" : "Manual Entry"}
      </Button>
      {showManual && (
        <div className="flex w-full gap-2 sm:w-auto">
          <Input
            ref={inputRef}
            type="text"
            className="w-full text-primary sm:w-[200px]"
            placeholder="Student code..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={isPending}
            className="shrink-0"
          >
            <FaCheck className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
