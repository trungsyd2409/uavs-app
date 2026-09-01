import { supportOrgs } from "@/data/supportOrgs";
import { PageHeader } from "@/components/ui";
import { SupportList } from "./SupportList";

export default function SupportPage() {
  return (
    <div className="px-5 py-2 pb-6">
      <PageHeader title="Trusted Support" subtitle="Các tổ chức hỗ trợ đáng tin cậy, miễn phí" />
      <SupportList orgs={supportOrgs} />
    </div>
  );
}
