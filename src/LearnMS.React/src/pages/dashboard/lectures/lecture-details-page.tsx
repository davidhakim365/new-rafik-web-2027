import { useReorderLectureItemsMutation, useUpdateLectureAssetsMutation } from "@/api/lectures-api";
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
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronDown,
  ChevronUp,
  Delete,
  Edit2,
  GripVertical,
  ListCollapse,
  Menu,
  Settings2,
  Trash,
  Users,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Link,
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import { useDeleteLessonMutation } from "@/api/lessons-api";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  getGetCourseQueryKey,
  getGetLectureQueryKey,
  useCreateLesson,
  useDeleteLecture,
  useGetLecture,
  useGetProfile,
  usePublishLecture,
  useUnPublishLecture,
  useUpdateLecture,
} from "@/generated/api";
import { GetLectureDashboardResult, LectureItemType, Permission, SingleLectureItem } from "@/generated/model";
import { useDashboardPermissions } from "@/hooks/use-dashboard-permissions";
import { PdfOpenButton } from "@/components/pdf-viewer-dialog";
import { useAssetsStore } from "@/store/use-assets-store";
import { useModalStore } from "@/store/use-modal-store";
import { useQueryClient } from "@tanstack/react-query";
import _ from "lodash";
import { FaFile, FaFilePdf, FaImage } from "react-icons/fa";
import { z } from "zod";

const LectureDetailsPage = () => {
  const { courseId, lectureId } = useParams();
  const [searchParams] = useSearchParams();
  const { hasPermission } = useDashboardPermissions();
  const { data, isError } = useGetLecture(courseId!, lectureId!);

  if (
    searchParams.get("view") === "students" &&
    hasPermission(Permission.ManageLectureStudents)
  ) {
    return (
      <Navigate
        to={`/dashboard/courses/${courseId}/lectures/${lectureId}/students`}
        replace
      />
    );
  }

  if (isError) {
    return;
  }

  const lecture = data?.data!;

  if (lecture?.$type !== "GetLectureDashboardResult") return;

  return (
    <LectureDetailsTab
      lecture={lecture}
      courseId={courseId!}
      canOpenStudents={hasPermission(Permission.ManageLectureStudents)}
    />
  );
};

export default LectureDetailsPage;

type TabProps = {
  lecture: GetLectureDashboardResult;
  courseId: string;
  canOpenStudents: boolean;
};

const LectureDetailsTab: React.FC<TabProps> = ({ lecture, canOpenStudents }) => {
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
          {canOpenStudents && (
            <Button asChild variant="outline" className="gap-2">
              <Link to={`/dashboard/courses/${lecture.courseId}/lectures/${lecture.id}/students`}>
                <Users className="h-4 w-4" />
                Students
              </Link>
            </Button>
          )}
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
  chooseHomeworkFormId: z.string().trim().optional().or(z.literal("")),
});

type UpdateLectureRequest = z.infer<typeof UpdateLectureRequest>;

function LectureDetailsForm({
  id,
  description,
  title,
  expirationDays,
  imageUrl,
  homeworkVideoUrl,
  chooseHomeworkFormId,
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
      onError: (error: Error) => {
        toast({
          title: "Update failed",
          description: error.message,
          variant: "destructive",
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
      chooseHomeworkFormId: chooseHomeworkFormId ?? "",
    },
    values: {
      description,
      title,
      expirationDays,
      renewalPrice,
      price,
      imageUrl,
      homeworkVideoUrl: homeworkVideoUrl ?? "",
      chooseHomeworkFormId: chooseHomeworkFormId ?? "",
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
            name='chooseHomeworkFormId'
            render={({ field }) => (
              <FormItem className='p-3 bg-color2/15 border-2 border-color2/30 rounded'>
                <FormLabel className='text-primary'>
                  Choose Homework (Google Form)
                </FormLabel>
                <FormControl>
                  <Input
                    className='text-primary'
                    placeholder='Edit URL, forms.gle link, or viewform link'
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <p className='text-xs text-muted-foreground'>
                  Paste the form edit URL (for score sync) or the public student
                  link (forms.gle / viewform) to embed for students. For sync,
                  the form must be a quiz with a required question titled
                  &quot;Student ID&quot;, shared with the Google service account.
                  Tip: turn off &quot;Collect email addresses&quot; and domain
                  restriction so students can fill the form in-page without
                  leaving for Google login.
                </p>
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
  const [orderedItems, setOrderedItems] = useState<SingleLectureItem[]>(() =>
    [...(items ?? [])].sort((a, b) => a.order - b.order)
  );
  const reorderMutation = useReorderLectureItemsMutation();

  useEffect(() => {
    if (reorderMutation.isPending) return;
    setOrderedItems([...(items ?? [])].sort((a, b) => a.order - b.order));
  }, [items, reorderMutation.isPending]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const persistOrder = (nextItems: SingleLectureItem[]) => {
    const previous = orderedItems;
    setOrderedItems(nextItems);
    reorderMutation.mutate(
      {
        courseId,
        lectureId,
        itemIds: nextItems.map((item) => item.id),
      },
      {
        onSuccess: () => {
          toast({
            title: "Order updated",
            description: "Session content order was saved",
          });
        },
        onError: () => {
          setOrderedItems(previous);
        },
      }
    );
  };

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedItems.findIndex((item) => item.id === active.id);
    const newIndex = orderedItems.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    persistOrder(arrayMove(orderedItems, oldIndex, newIndex));
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= orderedItems.length) return;
    persistOrder(arrayMove(orderedItems, index, nextIndex));
  };

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
          {orderedItems.length > 1 && (
            <p className='text-xs text-muted-foreground'>
              Drag the handle or use the arrows to reorder lessons and quizzes.
            </p>
          )}
          {orderedItems.length === 0 && (
            <p className='text-sm text-muted-foreground'>No content yet.</p>
          )}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={orderedItems.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {orderedItems.map((item, index) => (
                <LectureItem
                  key={item.id}
                  item={item}
                  courseId={courseId}
                  lectureId={lectureId}
                  index={index}
                  total={orderedItems.length}
                  disabled={reorderMutation.isPending}
                  onMoveUp={() => moveItem(index, -1)}
                  onMoveDown={() => moveItem(index, 1)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}

function LectureItem({
  item,
  courseId,
  lectureId,
  index,
  total,
  disabled,
  onMoveUp,
  onMoveDown,
}: {
  item: SingleLectureItem;
  courseId: string;
  lectureId: string;
  index: number;
  total: number;
  disabled: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const { mutate } = useDeleteLessonMutation();
  const qc = useQueryClient();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: disabled || total < 2 });

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
          qc.invalidateQueries({
            queryKey: getGetLectureQueryKey(courseId, lectureId),
          });
        },
      }
    );
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
        transition,
        opacity: isDragging ? 0.65 : 1,
        zIndex: isDragging ? 10 : undefined,
      }}
      className='flex items-center justify-between w-full gap-2 bg-color2/10 border border-color2/25 rounded text-primary'
    >
      <div className='flex items-center min-w-0 gap-1'>
        {total > 1 && (
          <button
            type='button'
            className='p-2 text-muted-foreground hover:text-primary cursor-grab active:cursor-grabbing disabled:cursor-not-allowed'
            aria-label={`Drag to reorder ${item.title}`}
            disabled={disabled}
            {...attributes}
            {...listeners}
          >
            <GripVertical className='w-4 h-4' />
          </button>
        )}
        <div className='p-2 truncate'>{item.title}</div>
      </div>
      <div className='flex items-center gap-1 pe-2'>
        {total > 1 && (
          <div className='flex flex-col'>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='h-6 w-6'
              aria-label={`Move ${item.title} up`}
              disabled={disabled || index === 0}
              onClick={onMoveUp}
            >
              <ChevronUp className='w-4 h-4' />
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='h-6 w-6'
              aria-label={`Move ${item.title} down`}
              disabled={disabled || index === total - 1}
              onClick={onMoveDown}
            >
              <ChevronDown className='w-4 h-4' />
            </Button>
          </div>
        )}
        {item.type === LectureItemType.Lesson && (
          <Confirmation
            title='Delete Lesson'
            description='Are you sure you want to delete this lesson?'
            onConfirm={onDelete}
            button={
              <Trash
                className='w-4 h-4 hover:cursor-pointer hover:scale-105'
                color='red'
              />
            }
          />
        )}
        <Badge className='h-5'>{item.type}</Badge>
        <Link
          className='me-1'
          to={`/dashboard/courses/${courseId}/lectures/${lectureId}/${
            item.type === LectureItemType.Lesson ? "lessons" : "quizzes"
          }/${item.id}`}
        >
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

  return (
    <div className='w-full h-full'>
      <div className="m-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xl sm:text-2xl">
          <div className="rounded-[50%] border-primary/40 bg-primary/30 p-3">
            <FaFile className="text-primary" />
          </div>
          PDF
        </div>
        <div className="flex flex-wrap gap-2">
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
      <div className="flex flex-wrap items-center gap-4 rounded border-[3px] border-primary/50 bg-primary/30 p-4 sm:p-10">
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
              <PdfOpenButton asset={asset} className='w-full'>
                <FaImage className='w-full h-full text-primary/40' />
              </PdfOpenButton>
            )}
            {asset.type === "Pdf" && (
              <PdfOpenButton asset={asset} className='w-full'>
                <FaFilePdf className='w-full h-full text-primary/40' />
              </PdfOpenButton>
            )}
            {asset.type === "Unknown" && (
              <PdfOpenButton asset={asset} className='w-full'>
                <FaFile className='w-full h-full text-primary/40' />
              </PdfOpenButton>
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

