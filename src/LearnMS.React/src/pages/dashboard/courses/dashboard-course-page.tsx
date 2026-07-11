import { AddLectureRequest } from "@/api/lectures-api";
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
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import {
  getGetCourseQueryKey,
  useCreateLecture,
  useDeleteCourse,
  useGetCourse,
  usePublishCourse,
  useUnpublishCourse,
  useUpdateCourse,
} from "@/generated/api";
import { GetDashboardCourseResult, SingleCourseItem } from "@/generated/model";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Edit2, ListCollapse, LucideMove, Menu, Settings2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";

const DashboardCoursePage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useGetCourse(courseId!);

  const publishCourseMutation = usePublishCourse({
    mutation: {
      onSuccess(data) {
        toast({
          title: "Publishing",
          description: data.message,
        });
        refetch();
      },
    },
  });
  const unPublishCourseMutation = useUnpublishCourse({
    mutation: {
      onSuccess(data) {
        toast({
          title: "UnPublishing",
          description: data.message,
        });
        refetch();
      },
    },
  });
  const deleteCourseMutation = useDeleteCourse({
    mutation: {
      onSuccess(data) {
        toast({
          title: "Deleting",
          description: data.message,
        });
        navigate("/dashboard/courses", { replace: true });
      },
    },
  });

  if (isLoading) {
    return (
      <div className='flex items-center justify-center w-full h-full'>
        <Loading />
      </div>
    );
  }

  if (isError) {
    return;
  }
  const course = data!.data!;

  if (course.$type !== "GetDashboardCourseResult") return;

  const onPublishing = () => {
    if (course.isPublished) {
      unPublishCourseMutation.mutate({ courseId: course.id });
    } else {
      publishCourseMutation.mutate({ courseId: course.id });
    }
  };

  const onDeleting = () => {
    deleteCourseMutation.mutate({ courseId: course.id });
  };

  return (
    <div className='w-full h-full p-4'>
      <div className='flex justify-between w-full'>
        <h1 className='text-3xl'>Course Setup</h1>
        <div className='flex gap-2 item-center'>
          <Confirmation
            disabled={deleteCourseMutation.isPending}
            // button={<Button variant='destructive'>Delete</Button>}
            description='Are you sure you want to delete this course?'
            title='Delete Course'
            onConfirm={onDeleting}
          />
          <Button
            onClick={onPublishing}
            className='text-blue-500 bg-white border border-blue-500 rounded hover:bg-blue-500 hover:text-white'>
            {course.isPublished ? "UnPublish" : "Publish"}
          </Button>
        </div>
      </div>

      <div className='grid w-full grid-cols-2 mt-10'>
        <CourseDetailsForm {...course} />
        <CourseContentForm {...course} />
      </div>
    </div>
  );
};

const UpdateCourseRequest = z.object({
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
  level: z.enum(["Level0", "Level1", "Level2", "Level3"]),
});

type UpdateCourseRequest = z.infer<typeof UpdateCourseRequest>;

function CourseDetailsForm({
  id,
  description,
  title,
  expirationDays,
  renewalPrice,
  imageUrl,
  level,
  price,
}: GetDashboardCourseResult) {
  const updateCourseMutation = useUpdateCourse();

  const form = useForm<UpdateCourseRequest>({
    resolver: zodResolver(UpdateCourseRequest),
    defaultValues: {
      description,
      title,
      expirationDays,
      level,
      renewalPrice,
      price,
      imageUrl,
    },
    values: {
      level,
      description,
      title,
      expirationDays,
      renewalPrice,
      price,
      imageUrl,
    },
  });

  const onSubmit = (data: UpdateCourseRequest) => {
    updateCourseMutation.mutate(
      { courseId: id, data },
      {
        onSuccess: (data) => {
          toast({
            title: "Course updated",
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
            disabled={updateCourseMutation.isPending}>
            <Settings2 className='text-blue-400 bg-blue-200 rounded-[50%] w-10 h-10 p-1' />
            Course Details
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
                  <Input className='text-blue-500' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name='level'
            render={({ field }) => (
              <FormItem className='p-3 bg-blue-200 border-2 border-blue-400 rounded'>
                <FormLabel className='text-blue-500'>Level</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className='text-blue-500'>
                      <SelectValue placeholder='Select a level' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='Level0'>3rd Prep </SelectItem>
                    <SelectItem value='Level1'>1st Secondary </SelectItem>
                    <SelectItem value='Level2'>2nd Secondary </SelectItem>
                    <SelectItem value='Level3'>3rd Secondary </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='price'
            render={({ field }) => (
              <FormItem className='p-3 bg-blue-200 border-2 border-blue-400 rounded'>
                <FormLabel className='text-blue-500'>Price</FormLabel>
                <FormControl>
                  <Input type='number' className='text-blue-500' {...field} />
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
                <FormLabel className='text-blue-500'>RenewalPrice</FormLabel>
                <FormControl>
                  <Input type='number' className='text-blue-500' {...field} />
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
                <FormLabel className='text-blue-500'>Image</FormLabel>
                <FormControl>
                  <Input className='text-blue-500' {...field} />
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

function CourseContentForm({ items, id }: GetDashboardCourseResult) {
  const [isAddingLecture, setIsAddingLecture] = useState(false);
  const navigate = useNavigate();

  return (
    <div className='flex flex-col gap-4 p-4'>
      <div className='flex items-center justify-between text-xl'>
        <div className='flex items-center gap-2'>
          <ListCollapse className='text-blue-400 bg-blue-200 rounded-[50%] w-10 h-10 p-1' />
          Course Content
        </div>
        <div className='flex items-center justify-center gap-2'>
          {!isAddingLecture ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Menu />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    className='hover:bg-blue-400 hover:text-white hover:cursor-pointer'
                    onClick={() => setIsAddingLecture(true)}>
                    Add Lecture
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      navigate(`/dashboard/courses/${id}/exams/add`)
                    }
                    className='hover:bg-blue-400 hover:text-white hover:cursor-pointer'>
                    Add Exam
                  </DropdownMenuItem>
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
      {isAddingLecture && (
        <AddLectureForm
          courseId={id}
          onClose={() => setIsAddingLecture(false)}
        />
      )}
      {!isAddingLecture && (
        <div className='flex flex-col gap-2'>
          {items.map((item) => (
            <CourseItem key={item.id} item={item} courseId={id} />
          ))}
        </div>
      )}
    </div>
  );
}

function CourseItem({
  item,
  courseId,
}: {
  item: SingleCourseItem;
  courseId: string;
}) {
  return (
    <div className='flex items-center justify-between w-full gap-2 text-blue-500 bg-blue-100 border border-blue-300 rounded'>
      <div className='flex gap-2'>

        <div className='p-2'>{item.title}</div>
      </div>
      <div className='flex items-center gap-2'>
        <Badge className='h-5'>{item.type}</Badge>
        <Link
          className='me-2'
          to={`/dashboard/courses/${courseId}/${
            item.type === "Exam" ? "exams" : "lectures"
          }/${item.id}`}>
          <Edit2 className='w-4 h-4' />
        </Link>
      </div>
    </div>
  );
}

function AddLectureForm({
  courseId,
  onClose,
}: {
  courseId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();

  const createLectureMutation = useCreateLecture({
    mutation: {
      onSuccess: (data) => {
        toast({
          title: "Lecture added",
          description: data.message,
        });
        onClose();
        qc.invalidateQueries({
          queryKey: getGetCourseQueryKey(courseId),
        });
      },
    },
  });

  const form = useForm({
    resolver: zodResolver(AddLectureRequest),
    defaultValues: {
      title: "",
    },
  });

  const onSubmit = (data: AddLectureRequest) => {
    createLectureMutation.mutate({ courseId, data });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <fieldset
          className='p-2 space-y-2 border-2 border-blue-400 rounded'
          disabled={createLectureMutation.isPending}>
          <FormField
            control={form.control}
            name='title'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-blue-500'>Title</FormLabel>
                <FormControl>
                  <Input type='text' className='text-blue-500' {...field} />
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

export default DashboardCoursePage;
