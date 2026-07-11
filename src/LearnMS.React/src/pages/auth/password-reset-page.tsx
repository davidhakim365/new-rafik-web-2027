import { ResetPasswordRequest, useResetPasswordMutation } from "@/api/auth-api";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";

const PasswordResetPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const resetPasswordMutation = useResetPasswordMutation();
  const resetToken = searchParams.get("token");

  const form = useForm<ResetPasswordRequest>({
    resolver: zodResolver(ResetPasswordRequest),
    defaultValues: {
      password: "",
      token: resetToken ?? "",
      confirmPassword: "",
    },
    values: {
      password: "",
      token: resetToken ?? "",
      confirmPassword: "",
    },
  });

  if (!resetToken) {
    return <Navigate to={"/"} />;
  }

  const onSubmit = (data: ResetPasswordRequest) => {
    resetPasswordMutation.mutate(data, {
      onSuccess: (data) => {
        toast({
          title: "Password reset",
          description: data.message,
        });
        navigate("/sign-in-sign-up", { replace: true });
      },
    });
  };

  return (
    <div className='bg-no-repeat w-screen h-screen bg-right-bottom flex items-center justify-center object-fill bg-[url("/courses.svg")]'>
      <div className="flex flex-col items-center justify-center gap-2 md:w-[50%] backdrop-blur-xl shadow-lg border border-border p-4 rounded-3xl bg-card/90 dark:bg-card/90">
        <h1 className="text-3xl italic font-bold text-primary dark:text-primary">
          Password Reset
        </h1>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full p-10 text-foreground dark:text-foreground rounded-3xl"
          >
            <fieldset
              className="flex flex-col items-center gap-6"
              disabled={resetPasswordMutation.isPending}
            >
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        {...field}
                        className="shadow-lg shadow-muted dark:shadow-muted"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input
                        className="shadow-lg shadow-muted dark:shadow-muted"
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                className="transition-all duration-300 bg-primary hover:bg-background hover:text-primary dark:bg-primary dark:hover:bg-background dark:hover:text-primary hover:scale-110 hover:border hover:border-border"
                type="submit"
              >
                Submit
              </Button>
            </fieldset>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default PasswordResetPage;
