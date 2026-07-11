import {
  UpdateProfileRequest,
  useUpdateProfileMutation,
} from "@/api/profile-api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { useGetProfile } from "@/generated/api";
import { GetStudentProfileResult } from "@/generated/model";
import { getFirstCharacters } from "@/lib/utils";
import {
  StudentEvents,
  StudentExams,
  StudentLectures,
} from "@/pages/dashboard/students/student-details-page";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

interface ProfileModalProps {
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const { data: profile } = useGetProfile();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";

  if (profile?.data?.$type !== "GetStudentProfileResult") {
    return;
  }
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="border-border bg-card text-card-foreground w-[95vw] max-w-6xl h-[95vh] max-h-[900px] flex flex-col justify-start overflow-y-auto p-4 sm:p-6">
        <Tabs defaultValue="account" className="flex flex-col flex-1 w-full">
          <TabsList
            dir={isRTL ? "rtl" : "ltr"}
            className="grid w-full h-auto grid-cols-5 p-1 sm:h-10 sm:p-1"
          >
            <TabsTrigger
              value="account"
              className="px-1 py-2 text-xs sm:text-sm sm:px-3"
            >
              {t("profile.account")}
            </TabsTrigger>
            <TabsTrigger
              value="contact"
              className="px-1 py-2 text-xs sm:text-sm sm:px-3"
            >
              {t("profile.contact")}
            </TabsTrigger>
            <TabsTrigger
              value="events"
              className="px-1 py-2 text-xs sm:text-sm sm:px-3"
            >
              {t("profile.events")}
            </TabsTrigger>
            <TabsTrigger
              value="lectures"
              className="px-1 py-2 text-xs sm:text-sm sm:px-3"
            >
              {t("profile.sessions")}
            </TabsTrigger>
            <TabsTrigger
              value="exams"
              className="px-1 py-2 text-xs sm:text-sm sm:px-3"
            >
              {t("profile.exams")}
            </TabsTrigger>
          </TabsList>
          <div className="flex-1 mt-4">
            <TabsContent
              dir={isRTL ? "rtl" : "ltr"}
              value="account"
              className="mt-0"
            >
              <ProfileContent profile={profile.data} />
            </TabsContent>
            <TabsContent
              dir={isRTL ? "rtl" : "ltr"}
              value="contact"
              className="mt-0"
            >
              <ContactContent profile={profile.data} />
            </TabsContent>
            <TabsContent value="events" className="mt-0">
              <EventsContent profile={profile.data} />
            </TabsContent>
            <TabsContent value="lectures" className="mt-0">
              <LecturesContent profile={profile.data} />
            </TabsContent>
            <TabsContent value="exams" className="mt-0">
              <ExamsContent profile={profile.data} />
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

function ProfileContent({ profile }: { profile: GetStudentProfileResult }) {
  const updateProfileMutation = useUpdateProfileMutation();
  const { t } = useTranslation();

  const form = useForm<UpdateProfileRequest>({
    resolver: zodResolver(UpdateProfileRequest),
    values: {
      fullName: profile.fullName,
      level: profile.level,
      school: profile.school,
    },
    defaultValues: {
      fullName: profile.fullName,
      level: profile.level,
      school: profile.school,
    },
  });

  const onSubmit = (data: UpdateProfileRequest) => {
    updateProfileMutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: t("profile.profileUpdated"),
          description: t("profile.profileUpdatedDescription"),
        });
      },
    });
  };

  return (
    <Form {...form}>
      <DialogHeader className="mb-2">
        <DialogTitle className="flex items-center gap-2 ">
          <Avatar className="transition-all duration-500 hover:cursor-pointer hover:scale-110">
            <AvatarImage src={profile.profilePicture ?? ""} />
            <AvatarFallback className="text-primary-foreground bg-primary dark:bg-primary dark:text-primary-foreground">
              {getFirstCharacters(profile.fullName)}
            </AvatarFallback>
          </Avatar>
          <span>{t("profile.profileAndDetails")}</span>
        </DialogTitle>
        <DialogDescription>
          {t("profile.contactAssistantToEdit")}
        </DialogDescription>
      </DialogHeader>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="p-4 border bg-muted text-muted-foreground border-border rounded-2xl"
      >
        <fieldset disabled={true || updateProfileMutation.isPending}>
          <FormField
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold text-foreground">
                  {t("profile.fullName")}
                </FormLabel>
                <FormControl>
                  <Input
                    className="bg-background text-foreground border-input"
                    type="text"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-sm text-muted-foreground">
                  {t("profile.fullNameDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="school"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold text-foreground">
                  {t("profile.school")}
                </FormLabel>
                <FormControl>
                  <Input
                    className="bg-background text-foreground border-input"
                    type="text"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-sm text-muted-foreground">
                  {t("profile.schoolDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="level"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold text-foreground">
                  {t("profile.level")}
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-background text-foreground border-input">
                      <SelectValue placeholder={t("profile.selectLevel")} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Level0">
                      {t("profile.level3rdPrep")}
                    </SelectItem>
                    <SelectItem value="Level1">
                      {t("profile.level1stSecondary")}
                    </SelectItem>
                    <SelectItem value="Level2">
                      {t("profile.level2ndSecondary")}
                    </SelectItem>
                    <SelectItem value="Level3">
                      {t("profile.level3rdSecondary")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription className="text-sm text-muted-foreground">
                  {t("profile.levelDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {/*
          <Button className='w-full mt-10 bg-primary hover:bg-primary/90 text-primary-foreground'>
            <SaveAll /> Update
          </Button>
            */}
        </fieldset>
      </form>
    </Form>
  );
}

function ContactContent({ profile }: { profile: GetStudentProfileResult }) {
  const updateProfileMutation = useUpdateProfileMutation();
  const { t } = useTranslation();

  const form = useForm<UpdateProfileRequest>({
    resolver: zodResolver(UpdateProfileRequest),
    values: {
      phoneNumber: profile.phoneNumber,
      parentPhoneNumber: profile.parentPhoneNumber,
      studentCode: profile.studentCode,
    },
    defaultValues: {
      phoneNumber: profile.phoneNumber,
      parentPhoneNumber: profile.parentPhoneNumber,
      studentCode: profile.studentCode,
    },
  });

  const onSubmit = (data: UpdateProfileRequest) => {
    updateProfileMutation.mutate(data, {
      onSuccess: () => {
        toast({
          title: t("profile.profileUpdated"),
          description: t("profile.profileUpdatedDescription"),
        });
      },
    });
  };

  return (
    <Form {...form}>
      <DialogHeader className="mb-2">
        <DialogTitle className="flex items-center gap-2 ">
          <Avatar className="transition-all duration-500 hover:cursor-pointer hover:scale-110">
            <AvatarImage src={profile.profilePicture ?? ""} />
            <AvatarFallback className="text-primary-foreground bg-primary dark:bg-primary dark:text-primary-foreground">
              {getFirstCharacters(profile.fullName)}
            </AvatarFallback>
          </Avatar>
          {t("profile.profileAndDetails")}
        </DialogTitle>
        <DialogDescription>
          {t("profile.contactAssistantToEdit")}
        </DialogDescription>
      </DialogHeader>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="p-4 border bg-muted text-muted-foreground border-border rounded-2xl"
      >
        <fieldset disabled={true || updateProfileMutation.isPending}>
          <FormField
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold text-foreground">
                  {t("profile.phoneNumber")}
                </FormLabel>
                <FormControl>
                  <Input
                    className="bg-background text-foreground border-input"
                    type="text"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-sm text-muted-foreground">
                  {t("profile.phoneNumberDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="parentPhoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold text-foreground">
                  {t("profile.parentPhoneNumber")}
                </FormLabel>
                <FormControl>
                  <Input
                    className="bg-background text-foreground border-input"
                    type="text"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-sm text-muted-foreground">
                  {t("profile.parentPhoneNumberDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="studentCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold text-foreground">
                  {t("profile.studentId")}
                </FormLabel>
                <FormControl>
                  <Input
                    className="bg-background text-foreground border-input"
                    type="text"
                    {...field}
                  />
                </FormControl>
                <FormDescription className="text-sm text-muted-foreground">
                  {t("profile.studentIdDescription")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {/*
          <Button className='w-full mt-10 bg-primary hover:bg-primary/90 text-primary-foreground'>
            <SaveAll /> Update
          </Button>
            */}
        </fieldset>
      </form>
    </Form>
  );
}

function EventsContent({ profile }: { profile: GetStudentProfileResult }) {
  return <StudentEvents studentId={profile.id} />;
}

function LecturesContent({ profile }: { profile: GetStudentProfileResult }) {
  return <StudentLectures studentId={profile.id} />;
}

function ExamsContent({ profile }: { profile: GetStudentProfileResult }) {
  return <StudentExams studentId={profile.id} />;
}

export default ProfileModal;
