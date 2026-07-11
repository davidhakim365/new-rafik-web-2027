import { AddCourseRequest, useAddCourseMutation } from "@/api/courses-api";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";

const AddCoursePage = () => {
  const addCourseMutation = useAddCourseMutation();
  const navigate = useNavigate();

  const form = useForm<AddCourseRequest>({
    resolver: zodResolver(AddCourseRequest),
    values: { title: "" },
  });

  const onSubmit = (data: AddCourseRequest) => {
    addCourseMutation.mutate(data, {
      onSuccess: (res) => {
        toast({ title: "Course created", description: res.message });
        navigate(`/dashboard/courses/${res.data.id}`, { replace: true });
      },
    });
  };

  return (
    <DashboardPageShell
      title="Add Course"
      description="Create a new course to organize your lectures and exams."
      icon={BookOpen}
    >
      <DashboardCard className="mx-auto max-w-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Mathematics" {...field} />
                  </FormControl>
                  <FormDescription>The title of the course.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2">
              <Link to="/dashboard/courses">
                <Button type="button" variant="outline" className="border-color2/20">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={addCourseMutation.isPending}
                className="bg-gradient-to-r from-color1 to-color2 hover:opacity-90"
              >
                Create Course
              </Button>
            </div>
          </form>
        </Form>
      </DashboardCard>
    </DashboardPageShell>
  );
};

export default AddCoursePage;
