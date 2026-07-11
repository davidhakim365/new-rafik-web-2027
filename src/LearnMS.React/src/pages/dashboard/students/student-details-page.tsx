import {
  UpdateStudentRequest,
  useDeleteStudentMutation,
  useStudentQuery,
  useUpdateStudentMutation,
} from "@/api/students-api";
import Confirmation from "@/components/confirmation";
import { DataTable } from "@/components/data-table";
import Loading from "@/components/loading/loading";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import {
  useGetStudentEvents,
  useGetStudentExams,
  useGetStudentLectures,
} from "@/generated/api";
import {
  studentEventsColumns,
  studentExamsColumns,
  studentLecturesColumns,
} from "@/pages/dashboard/students/columns";
import { zodResolver } from "@hookform/resolvers/zod";
import { ResetIcon } from "@radix-ui/react-icons";
import { PaginationState } from "@tanstack/react-table";
import { Save, Trash } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { getFirstCharacters } from "../../../lib/utils";

const StudentDetailsPage = () => {
  const { studentId } = useParams();

  return (
    <div className="w-full h-full p-0 overflow-x-auto">
      <Tabs defaultValue="profile" className="w-full h-full m-0">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="lectures">Sessions</TabsTrigger>
          <TabsTrigger value="exams">Exams</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <StudentProfile studentId={studentId!} />
        </TabsContent>
        <TabsContent value="events">
          <StudentEvents studentId={studentId!} />
        </TabsContent>
        <TabsContent value="lectures">
          <StudentLectures studentId={studentId!} />
        </TabsContent>
        <TabsContent value="exams">
          <StudentExams studentId={studentId!} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

function StudentProfile({ studentId }: { studentId: string }) {
  const { data: student, isLoading } = useStudentQuery({ id: studentId! });
  const updateStudentMutation = useUpdateStudentMutation();
  const deleteStudentMutation = useDeleteStudentMutation();
  const navigate = useNavigate();

  const levelMap: { [key: string]: string } = {
    Level0: "3rd Prep",
    Level1: "1st Secondary",
    Level2: "2nd Secondary",
    Level3: "3rd Secondary",
  };

  const form = useForm<UpdateStudentRequest>({
    resolver: zodResolver(UpdateStudentRequest),
    defaultValues: {
      fullName: student?.data.fullName ?? "",
      phoneNumber: student?.data.phoneNumber ?? "",
      parentPhoneNumber: student?.data.parentPhoneNumber ?? "",
      studentCode: student?.data.studentCode ?? "",
      schoolName: student?.data.schoolName ?? "",
      level: student?.data.level, // Ensure this is populated with the real data
      password: student?.data.password ?? "",
    },
  });

  // Debug student data
  useEffect(() => {
    if (student?.data) {
      console.log("Student data fetched: ", student.data);
      form.reset({
        fullName: student.data.fullName,
        phoneNumber: student.data.phoneNumber,
        parentPhoneNumber: student.data.parentPhoneNumber,
        studentCode: student.data.studentCode,
        schoolName: student.data.schoolName,
        level: student.data.level || "Level0", // Ensure level gets set correctly
        password: student.data.password,
      });
    }
  }, [student, form]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Loading />
      </div>
    );
  }

  const onSubmit = (data: UpdateStudentRequest) => {
    updateStudentMutation.mutate(
      { id: student!.data.id, data },
      {
        onSuccess: () => {
          toast({
            title: "Profile updated",
            description: "Your profile has been updated",
          });
        },
      }
    );
  };

  const onDelete = () => {
    deleteStudentMutation.mutate(
      { id: student!.data.id },
      {
        onSuccess: () => {
          toast({
            title: "Student deleted",
            description: "Student deleted successfully",
          });
          navigate("/dashboard/students");
        },
      }
    );
  };

  return (
    <div className="p-4 space-y-4 text-foreground">
      <div className="flex items-center gap-2 p-4 border rounded shadow-md bg-card text-card-foreground border-border shadow-muted">
        <div>
          <p>{student!.data.email}</p>
        </div>
        <Badge className="ms-auto">{student!.data.credit} LE</Badge>
      </div>
      <Separator />
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="p-4 border rounded shadow-md bg-card border-border shadow-muted"
        >
          <fieldset disabled={updateStudentMutation.isPending}>
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel></FormLabel>
                  <FormDescription>Full Name</FormDescription>
                  <FormControl>
                    <Input {...field} placeholder="" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel></FormLabel>
                  <FormDescription>Password</FormDescription>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel></FormLabel>
                  <FormDescription>Phone number</FormDescription>
                  <FormControl>
                    <Input {...field} placeholder="John Doe" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="parentPhoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel></FormLabel>
                  <FormDescription>Parent's phone number</FormDescription>
                  <FormControl>
                    <Input {...field} placeholder="John Doe" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="studentCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel></FormLabel>
                  <FormDescription>ID</FormDescription>
                  <FormControl>
                    <Input {...field} placeholder="John Doe" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="schoolName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel></FormLabel>
                  <FormDescription>School</FormDescription>
                  <FormControl>
                    <Input {...field} placeholder="John Doe" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel></FormLabel>
                  <FormDescription>Level</FormDescription>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={levelMap[student?.data.level]}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Level0">3rd Prep</SelectItem>
                      <SelectItem value="Level1">1st Secondary</SelectItem>
                      <SelectItem value="Level2">2nd Secondary</SelectItem>
                      <SelectItem value="Level3">3rd Secondary</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <div className="flex items-center gap-2 mt-5 justify-left">
              <Confirmation
                button={
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={deleteStudentMutation.isPending}
                  >
                    <Trash /> Delete
                  </Button>
                }
                description="Are you sure you want to delete this student?"
                onConfirm={onDelete}
                title="Delete Student"
                disabled={deleteStudentMutation.isPending}
              />
              {form.formState.isDirty && (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => form.reset()}
                    className="border-border"
                    variant="outline"
                  >
                    <ResetIcon /> Reset
                  </Button>
                  <Button type="submit">
                    <Save /> Save
                  </Button>
                </div>
              )}
            </div>
          </fieldset>
        </form>
      </Form>
    </div>
  );
}

export function StudentEvents({ studentId }: { studentId: string }) {
  const [search, setSearch] = useState("");
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data, isLoading } = useGetStudentEvents(studentId, {
    page: pageIndex + 1,
    pageSize,
    search,
  });

  return (
    <div className="w-full h-full p-4 text-foreground">
      <div className="relative p-4 border rounded shadow-md bg-card border-border shadow-muted">
        <Input
          className="absolute top-6 left-6 w-fit"
          placeholder="search title"
          onChange={(e) => setSearch(e.target.value)}
          value={search}
        />
        {isLoading ? (
          <Loading />
        ) : (
          <DataTable
            data={data?.data!.items!}
            columns={studentEventsColumns}
            setPagination={setPagination}
            pagination={{
              pageCount: pageSize,
              pageSize,
              pageIndex,
              hasPreviousPage: data?.data!.hasPreviousPage!,
              hasNextPage: data?.data!.hasNextPage!,
            }}
          />
        )}
      </div>
    </div>
  );
}

export function StudentLectures({ studentId }: { studentId: string }) {
  const [search, setSearch] = useState("");
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data, isLoading } = useGetStudentLectures(studentId, {
    page: pageIndex + 1,
    pageSize,
    search,
  });

  return (
    <div className="w-full h-full p-4 text-foreground">
      <div className="relative p-4 border rounded shadow-md bg-card border-border shadow-muted">
        <Input
          className="absolute top-6 left-6 w-fit"
          placeholder="search title"
          onChange={(e) => setSearch(e.target.value)}
          value={search}
        />
        {isLoading ? (
          <Loading />
        ) : (
          <DataTable
            data={data?.data!.items!}
            columns={studentLecturesColumns}
            setPagination={setPagination}
            pagination={{
              pageCount: pageSize,
              pageSize,
              pageIndex,
              hasPreviousPage: data?.data!.hasPreviousPage!,
              hasNextPage: data?.data!.hasNextPage!,
            }}
          />
        )}
      </div>
    </div>
  );
}
export function StudentExams({ studentId }: { studentId: string }) {
  const [search, setSearch] = useState("");
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data, isLoading } = useGetStudentExams(studentId, {
    page: pageIndex + 1,
    pageSize,
    search,
  });

  return (
    <div className="w-full h-full p-4 text-foreground">
      <div className="relative p-4 border rounded shadow-md bg-card border-border shadow-muted">
        <Input
          className="absolute top-6 left-6 w-fit"
          placeholder="search title"
          onChange={(e) => setSearch(e.target.value)}
          value={search}
        />
        {isLoading ? (
          <Loading />
        ) : (
          <DataTable
            data={data?.data!.items!}
            columns={studentExamsColumns}
            setPagination={setPagination}
            pagination={{
              pageCount: pageSize,
              pageSize,
              pageIndex,
              hasPreviousPage: data?.data!.hasPreviousPage!,
              hasNextPage: data?.data!.hasNextPage!,
            }}
          />
        )}
      </div>
    </div>
  );
}

export default StudentDetailsPage;
