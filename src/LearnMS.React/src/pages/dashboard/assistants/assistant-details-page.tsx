import {
  UpdateAssistantRequest,
  useAssistantQuery,
  useClaimAssistantIncomesMutation,
  useDeleteAssistantMutation,
  useGetAssistantIncomesQuery,
  usePermissionsQuery,
  useUpdateAssistantMutation,
} from "@/api/assistants-api";
import Confirmation from "@/components/confirmation";
import { ImageUploadField } from "@/components/image-upload-field";
import Loading from "@/components/loading/loading";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { DialogFooter } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, toast } from "@/lib/utils";
import { AssistantRewardsTab } from "@/pages/dashboard/assistants/assistant-rewards-tab";
import { assistantIncomesColumns } from "@/pages/dashboard/assistants/columns";
import { AssistantIncomesDataTable } from "@/pages/dashboard/assistants/data-table";
import { Assistant, assistantDisplayName } from "@/types/assistants";
import { zodResolver } from "@hookform/resolvers/zod";
import { PaginationState, RowSelectionState } from "@tanstack/react-table";
import { Search } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { FaMoneyBillAlt, FaMoneyCheckAlt } from "react-icons/fa";
import { useParams } from "react-router-dom";
import { z } from "zod";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

type PermissionMeta = {
  key: string;
  label: string;
  description: string;
};

type PermissionGroup = {
  title: string;
  description: string;
  permissions: PermissionMeta[];
};

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    title: "Courses & Lectures",
    description: "Create and manage course content and lectures.",
    permissions: [
      {
        key: "ManageCourses",
        label: "Manage courses",
        description: "Create, edit, and organize courses.",
      },
      {
        key: "ManageLecture",
        label: "Manage lecture details",
        description: "Edit lecture content, PDFs, lessons, quizzes, publish, and delete.",
      },
      {
        key: "ManageLectureStudents",
        label: "Manage lecture students",
        description: "Attend students, scan barcodes, enter scores, import/export, and enroll.",
      },
    ],
  },
  {
    title: "Students",
    description: "Student accounts, access, and enrollment.",
    permissions: [
      {
        key: "ManageStudents",
        label: "Manage students",
        description: "View and edit student profiles and lists.",
      },
      {
        key: "AddStudents",
        label: "Add students",
        description: "Create new student accounts.",
      },
      {
        key: "ManageGrantedAccess",
        label: "Manage granted access",
        description: "Grant or revoke course access for students.",
      },
      {
        key: "ManageExpirationTime",
        label: "Manage expiration time",
        description: "Change access expiration dates.",
      },
    ],
  },
  {
    title: "Call Center",
    description: "Student outreach after lectures.",
    permissions: [
      {
        key: "ManageCallCenter",
        label: "Use call center",
        description: "Call, notify, and update student call status.",
      },
      {
        key: "ViewCallCenterHistory",
        label: "View call history",
        description: "See who called or notified a student and their comments.",
      },
    ],
  },
  {
    title: "Credit Codes",
    description: "Generate and manage redeem codes.",
    permissions: [
      {
        key: "ManageCreditCodes",
        label: "Manage credit codes",
        description: "View and manage existing credit codes.",
      },
      {
        key: "GenerateCreditCodes",
        label: "Generate credit codes",
        description: "Create new credit / redeem codes.",
      },
    ],
  },
  {
    title: "Apples & Rewards",
    description: "Student apples and the rewards store.",
    permissions: [
      {
        key: "ManageStudentApples",
        label: "Manage student apples",
        description: "Add or adjust student apple balances.",
      },
      {
        key: "ManageAppleRewardsStore",
        label: "Manage rewards store",
        description: "Manage reward items and store settings.",
      },
    ],
  },
  {
    title: "Team & Files",
    description: "Assistants and uploaded files.",
    permissions: [
      {
        key: "ManageAssistants",
        label: "Manage assistants",
        description: "Create and edit assistant accounts.",
      },
      {
        key: "ManageFiles",
        label: "Manage files",
        description: "Upload and manage files in the library.",
      },
    ],
  },
  {
    title: "Analytics",
    description: "Dashboard statistics and reports.",
    permissions: [
      {
        key: "ViewStatistics",
        label: "View statistics",
        description: "Access dashboard statistics and reports.",
      },
    ],
  },
];

const PERMISSION_META_BY_KEY = Object.fromEntries(
  PERMISSION_GROUPS.flatMap((group) =>
    group.permissions.map((permission) => [permission.key, permission])
  )
) as Record<string, PermissionMeta>;

function humanizePermissionKey(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (char) => char.toUpperCase());
}

function groupPermissions(items: string[]): PermissionGroup[] {
  const remaining = new Set(items);
  const groups: PermissionGroup[] = [];

  for (const group of PERMISSION_GROUPS) {
    const permissions = group.permissions.filter((permission) =>
      remaining.has(permission.key)
    );
    if (permissions.length === 0) continue;
    permissions.forEach((permission) => remaining.delete(permission.key));
    groups.push({ ...group, permissions });
  }

  if (remaining.size > 0) {
    groups.push({
      title: "Other",
      description: "Additional permissions.",
      permissions: [...remaining].map((key) => ({
        key,
        label: PERMISSION_META_BY_KEY[key]?.label ?? humanizePermissionKey(key),
        description: PERMISSION_META_BY_KEY[key]?.description ?? "",
      })),
    });
  }

  return groups;
}

const AssistantDetailsPage = () => {
  const { assistantId } = useParams();
  const { data: assistant, isLoading } = useAssistantQuery({
    id: assistantId!,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Loading />
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4 text-foreground">
      <Tabs
        defaultValue="details"
        className="p-0 border-2 shadow-md rounded-xl shadow-primary border-secondary"
      >
        <TabsList className="m-0 h-auto w-full justify-start overflow-x-auto shadow-sm shadow-primary">
          <TabsTrigger value="details" className="shrink-0">Details</TabsTrigger>
          <TabsTrigger value="incomes" className="shrink-0">Incomes</TabsTrigger>
          <TabsTrigger value="rewards" className="shrink-0">Rewards</TabsTrigger>
        </TabsList>
        <TabsContent value="details" className="mx-auto w-full max-w-3xl px-4 py-6">
          <AssistantDetails assistant={assistant!.data} />
        </TabsContent>
        <TabsContent value="incomes" className="p-6">
          <AssistantIncomes assistant={assistant!.data} />
        </TabsContent>
        <TabsContent value="rewards" className="p-6">
          <AssistantRewardsTab assistant={assistant!.data} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

function AssistantDetails({ assistant }: { assistant: Assistant }) {
  const { data: permissions, isLoading } = usePermissionsQuery();
  const deleteAssistantMutation = useDeleteAssistantMutation();
  const updateAssistantMutation = useUpdateAssistantMutation();
  const [permissionSearch, setPermissionSearch] = useState("");

  const permissionItems = permissions?.data.items ?? [];

  const PermissionsSchema = permissionItems.reduce(
    (acc, value) => ({ ...acc, [value]: z.boolean() }),
    {}
  );

  const PasswordPermissionsSchema = z.object({
    fullName: z.string().min(2),
    password: z
      .string()
      .optional()
      .transform((val) => (val ? val : undefined)),
    code: z.string().optional(),
    profilePicture: z.string().optional(),
    ...PermissionsSchema,
  });

  const permissionsValues = permissionItems.reduce(
    (acc, value) => ({
      ...acc,
      [value]: assistant.permissions.includes(value),
    }),
    {}
  );

  const form = useForm<z.infer<typeof PasswordPermissionsSchema>>({
    resolver: zodResolver(PasswordPermissionsSchema),
    values: {
      fullName: assistant.fullName ?? "",
      password: "",
      code: assistant.code ?? "",
      profilePicture: assistant.profilePicture ?? "",
      ...permissionsValues,
    },
  });

  const watchedValues = useWatch({ control: form.control });
  const enabledCount = permissionItems.filter(
    (permission) => Boolean((watchedValues as Record<string, unknown>)?.[permission])
  ).length;

  const permissionQuery = permissionSearch.trim().toLowerCase();
  const permissionGroups = groupPermissions(permissionItems)
    .map((group) => ({
      ...group,
      permissions: permissionQuery
        ? group.permissions.filter((permission) => {
            const haystack = [
              permission.key,
              permission.label,
              permission.description,
              group.title,
            ]
              .join(" ")
              .toLowerCase();
            return haystack.includes(permissionQuery);
          })
        : group.permissions,
    }))
    .filter((group) => group.permissions.length > 0);

  const setGroupPermissions = (keys: string[], enabled: boolean) => {
    keys.forEach((key) => {
      form.setValue(key as any, enabled, {
        shouldDirty: true,
        shouldTouch: true,
      });
    });
  };

  const onDeleting = () => {
    deleteAssistantMutation.mutate(
      { id: assistant.id },
      {
        onSuccess: () => {
          toast({
            title: "Assistant deleted",
            description: "Assistant deleted successfully",
          });
        },
      }
    );
  };

  if (isLoading) {
    return <Loading />;
  }

  const onSubmit = (data: z.infer<typeof PasswordPermissionsSchema>) => {
    const { password, code, fullName, profilePicture, ...perms } = data;
    const previousPicture = assistant.profilePicture ?? "";
    const nextPicture = profilePicture ?? "";
    const request = UpdateAssistantRequest.parse({
      fullName,
      password,
      code,
      profilePicture: nextPicture || undefined,
      clearProfilePicture: !nextPicture && !!previousPicture,
      permissions: permissionItems.filter((p) => (perms as any)[p]),
    });
    updateAssistantMutation.mutate(
      { id: assistant.id, data: request },
      {
        onSuccess: () => {
          toast({
            title: "Assistant updated",
            description: "Assistant updated successfully",
          });
        },
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <fieldset
          disabled={updateAssistantMutation.isPending}
          className="flex flex-col gap-3"
        >
          <div className="mb-2 flex items-center gap-3">
            <Avatar className="size-14 border border-color2/20">
              <AvatarImage src={assistant.profilePicture ?? undefined} />
              <AvatarFallback>{initials(assistantDisplayName(assistant))}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{assistantDisplayName(assistant)}</p>
              <p className="text-sm text-muted-foreground">{assistant.email}</p>
            </div>
          </div>
          <FormField
            name="fullName"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="profilePicture"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Profile photo (ImgBB)</FormLabel>
                <FormControl>
                  <ImageUploadField
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="code"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reward barcode / code</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="password"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input {...field} type="password" placeholder="Leave blank to keep current" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="mt-4 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold">Permissions</h3>
                <p className="text-sm text-muted-foreground">
                  {enabledCount} of {permissionItems.length} enabled
                </p>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={permissionSearch}
                  onChange={(event) => setPermissionSearch(event.target.value)}
                  placeholder="Search permissions..."
                  className="pl-9"
                />
              </div>
            </div>

            {permissionGroups.length === 0 ? (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                No permissions match “{permissionSearch.trim()}”.
              </p>
            ) : (
              permissionGroups.map((group) => {
                const groupKeys = group.permissions.map((permission) => permission.key);
                const groupEnabledCount = groupKeys.filter((key) =>
                  Boolean((watchedValues as Record<string, unknown>)?.[key])
                ).length;
                const allEnabled = groupEnabledCount === groupKeys.length;

                return (
                  <section
                    key={group.title}
                    className="overflow-hidden rounded-xl border border-border/70 bg-muted/15"
                  >
                    <div className="flex flex-col gap-3 border-b border-border/60 bg-background/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h4 className="font-semibold">{group.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {group.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {groupEnabledCount}/{groupKeys.length}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setGroupPermissions(groupKeys, !allEnabled)
                          }
                        >
                          {allEnabled ? "Disable all" : "Enable all"}
                        </Button>
                      </div>
                    </div>
                    <div className="divide-y divide-border/50">
                      {group.permissions.map((permission) => (
                        <FormField
                          key={permission.key}
                          control={form.control}
                          name={permission.key as any}
                          render={({ field }) => (
                            <FormItem
                              className={cn(
                                "flex flex-row items-center justify-between gap-4 px-4 py-3",
                                field.value && "bg-primary/5"
                              )}
                            >
                              <div className="min-w-0 space-y-0.5">
                                <FormLabel className="text-base font-medium">
                                  {permission.label}
                                </FormLabel>
                                {permission.description ? (
                                  <p className="text-sm text-muted-foreground">
                                    {permission.description}
                                  </p>
                                ) : null}
                              </div>
                              <FormControl>
                                <Switch
                                  checked={Boolean(field.value)}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </section>
                );
              })
            )}
          </div>

          <DialogFooter className="mt-4">
            <Confirmation
              button={
                <Button variant="destructive" className="me-auto">
                  Delete
                </Button>
              }
              title="Are you sure you want to delete this assistant?"
              description="This action cannot be undone."
              onConfirm={onDeleting}
            />
            <Button type="submit">Submit</Button>
          </DialogFooter>
        </fieldset>
      </form>
    </Form>
  );
}

function AssistantIncomes({ assistant }: { assistant: Assistant }) {
  const claimAssistantIncomesMutation = useClaimAssistantIncomesMutation();

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { data: incomes, isLoading } = useGetAssistantIncomesQuery({
    id: assistant.id,
    page: pageIndex + 1,
    pageSize,
  });

  if (isLoading) {
    return <Loading />;
  }

  const onClaiming = () => {
    claimAssistantIncomesMutation.mutate(
      { id: assistant.id },
      {
        onSuccess: (res) => {
          toast({
            title: "Incomes claimed",
            description: res.message,
          });
        },
      }
    );
  };

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="text-primary">
          <CardTitle className="flex items-center justify-between p-2 text-4xl">
            Total Income <FaMoneyCheckAlt />
          </CardTitle>
          <CardContent className="text-3xl">
            {incomes?.data.totalIncome} LE
          </CardContent>
        </Card>
        <Card className="text-primary">
          <CardTitle className="flex items-center justify-between p-2 text-4xl">
            Unclaimed Income <FaMoneyBillAlt />
          </CardTitle>
          <CardContent className="flex justify-between text-3xl">
            {incomes?.data.unClaimedIncome} LE
            <Button
              disabled={claimAssistantIncomesMutation.isPending}
              onClick={onClaiming}
              variant="outline"
              className="transition-all duration-300 hover:shadow-md hover:shadow-primary hover:text-primary"
            >
              Claim all
            </Button>
          </CardContent>
        </Card>
      </div>

      <AssistantIncomesDataTable
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
        pagination={{
          hasNextPage: incomes?.data.data.hasNextPage!,
          hasPreviousPage: incomes?.data.data.hasPreviousPage!,
          pageIndex,
          pageSize,
          pageCount: incomes?.data.data.totalCount!,
        }}
        setPagination={setPagination}
        data={incomes?.data.data.items!}
        columns={assistantIncomesColumns}
      />
    </div>
  );
}

export default AssistantDetailsPage;
