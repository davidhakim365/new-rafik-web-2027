import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell";
import AssetsList from "@/pages/dashboard/files/assets-list";
import { FileText } from "lucide-react";

const FilesPage = () => {
  return (
    <DashboardPageShell
      title="Files"
      description="Reuse Google Drive PDF links across lectures. Add new links from a lecture page."
      icon={FileText}
      fullWidth
      className="min-w-0"
      contentClassName="min-w-0"
    >
      <AssetsList />
    </DashboardPageShell>
  );
};

export default FilesPage;
