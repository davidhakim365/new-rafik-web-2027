import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import AssetsList from "@/pages/dashboard/files/assets-list";
import { FileText } from "lucide-react";

const FilesPage = () => {
  return (
    <DashboardPageShell
      title="Files"
      description="Upload and manage media assets for your courses."
      icon={FileText}
      fullWidth
    >
      <AssetsList />
    </DashboardPageShell>
  );
};

export default FilesPage;
