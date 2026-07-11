import { useUpdateLectureAssetsMutation } from "@/api/lectures-api";
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
import { toast } from "@/components/ui/use-toast";
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
import React, { useEffect, useMemo, useRef, useState } from "react";
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
  useAttendLecture,
  useCreateLesson,
  useDeleteLecture,
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
import { lectureStudentsColumns } from "@/pages/dashboard/lectures/lecture-students-columns";
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
      <TabsList>
        <TabsTrigger value='details'>Details</TabsTrigger>
        <TabsTrigger value='students'>Students</TabsTrigger>
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

  const qc = useQueryClient();
  const updateLectureGrades = useUpdateLectureGrades({
    mutation: {
      onSuccess() {
        qc.invalidateQueries({
          queryKey: getGetLectureStudentsQueryKey(courseId, lecture.id),
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
    useGetLectureStatistics({ lectureId: lecture.id });

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
    <div className='relative w-full h-full p-4'>
      <div className='absolute flex items-center gap-6 top-6 left-4 w-fit'>
        <Input
          className='w-[300px]'
          placeholder='Search'
          value={search}
          onChange={(e) => setSearch(e.target.value)}></Input>

        {lectureStatistics?.data && (
          <div className='flex items-center gap-2'>
            <div className='gap-2 p-2 '>
              Attended: {lectureStatistics?.data?.attendedStudents}
            </div>
            <div className='gap-2 p-2'>
              Enrolled: {lectureStatistics?.data?.enrolledStudents}
            </div>
          </div>
        )}

        <AttendInput lectureId={lecture.id} courseId={lecture.courseId} />
      </div>
      {isLoading ? (
        <div className='flex items-center justify-center w-full h-full'>
          <Loading />
        </div>
      ) : (
        <div className=''>
          <Button
            disabled={updateLectureGrades.isPending}
            variant='outline'
            className='absolute text-red-500 w-fit h-fit top-8 right-48'
            onClick={onImport}>
            {(!updateLectureGrades.isPending && <FaFileImport />) || (
              <Loader2 className='w-4 h-4 animate-spin' />
            )}
          </Button>
          <Button
            disabled={isDownloading}
            variant='outline'
            className='absolute w-fit h-fit top-8 right-28 text-primary'
            onClick={onExport}>
            {(!isDownloading && <FaFileExport />) || (
              <Loader2 className='w-4 h-4 animate-spin' />
            )}
          </Button>
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
            columns={lectureStudentsColumns}
            setPagination={setPagination}
          />
        </div>
      )}
    </div>
  );
};

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
            className='bg-white border rounded text-primary border-primary hover:bg-primary hover:text-white'>
            {lecture.isPublished ? "UnPublish" : "Publish"}
          </Button>
        </div>
      </div>

      <div className='grid w-full grid-cols-2 mt-10'>
        <LectureDetailsForm {...lecture} />
        <LectureContentForm {...lecture} />
        <div className='col-span-2 p-4'>
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
});

type UpdateLectureRequest = z.infer<typeof UpdateLectureRequest>;

function LectureDetailsForm({
  id,
  description,
  title,
  expirationDays,
  imageUrl,
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
    },
    values: {
      description,
      title,
      expirationDays,
      renewalPrice,
      price,
      imageUrl,
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
            <Settings2 className='text-blue-400 bg-blue-200 rounded-[50%] w-10 h-10 p-1' />
            Session Details
            {form.formState.isDirty && (
              <div className='space-x-1 ms-auto'>
                <Button className='bg-primary'>Save</Button>
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
              <FormItem className='p-3 bg-blue-200 border-2 border-blue-400 rounded '>
                <FormLabel className='text-primary'>Description</FormLabel>
                <FormControl>
                  <div style={{ height: "200px", width: "100%" }}>
                    <textarea
                      className='text-blue-500'
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
            name='price'
            render={({ field }) => (
              <FormItem className='p-3 bg-blue-200 border-2 border-blue-400 rounded'>
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
              <FormItem className='p-3 bg-blue-200 border-2 border-blue-400 rounded'>
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
              <FormItem className='p-3 bg-blue-200 border-2 border-blue-400 rounded'>
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
              <FormItem className='p-3 bg-blue-200 border-2 border-blue-400 rounded'>
                <FormLabel className='text-primary'>Image</FormLabel>
                <FormControl>
                  <Input className='text-primary' {...field} />
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
          <ListCollapse className='text-blue-400 bg-blue-200 rounded-[50%] w-10 h-10 p-1' />
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
                    className='hover:bg-blue-400 hover:text-white hover:cursor-pointer'
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
    <div className='flex items-center justify-between w-full gap-2 bg-blue-100 border border-blue-300 rounded text-primary'>
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
          className='p-2 space-y-2 border-2 border-blue-400 rounded'
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
    () => !_.isEqual(_.sortBy(oldAssets), _.sortBy(assets)),
    [oldAssets, assets]
  );

  useEffect(() => {
    clearAssets();
    addAssets(oldAssets);
  }, []);

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
          <Button onClick={() => openModal("select-assets-modal")}>
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
            className='relative p-5 rounded-xl w-52 h-fit bg-white/40'>
            <Button
              className='absolute top-0 right-0'
              size='icon'
              onClick={() => removeAsset(asset.id)}
              variant='destructive'>
              <Delete />
            </Button>
            {asset.type === "Image" && (
              <a href={`/api/assets/${asset.id}`}>
                <FaImage className='w-full h-full text-primary/40' />
              </a>
            )}
            {asset.type === "Pdf" && (
              <a href={`/api/assets/${asset.id}`}>
                <FaFilePdf className='w-full h-full text-primary/40' />
              </a>
            )}
            {asset.type === "Unknown" && (
              <a href={`/api/assets/${asset.id}`}>
                <FaFile className='w-full h-full text-primary/40' />
              </a>
            )}
            <p className=''>{asset.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AttendInput({
  lectureId,
  courseId,
}: {
  lectureId: string;
  courseId: string;
}) {
  const [show, setShow] = useState(false);
  const [code, setCode] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const { mutate: attendLecture, isPending } = useAttendLecture({
    mutation: {
      throwOnError: false,
    },
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (code.length > 0) handleSubmit();
    }, 1000);

    return () => clearTimeout(timer);
  }, [code]);

  const handleSubmit = async () => {
    if (!code) return;

    attendLecture(
      {
        courseId,
        lectureId,
        code,
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
    <div className='flex items-center gap-2'>
      <Button size='icon' onClick={() => setShow((state) => !state)}>
        <FaBarcode />
      </Button>
      {show && (
        <>
          <Input
            ref={inputRef}
            type='text'
            className='text-primary w-[200px]'
            placeholder='code...'
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Button size='icon' onClick={handleSubmit} disabled={isPending}>
            <FaCheck />
          </Button>
        </>
      )}
    </div>
  );
}
