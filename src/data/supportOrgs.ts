export type ProblemTag =
  | "underpayment"
  | "no_payslip"
  | "unsafe"
  | "visa_threat"
  | "harassment"
  | "unfair_dismissal"
  | "contract_hours"
  | "general";

export interface SupportOrg {
  id: string;
  name: string;
  shortDesc: string;
  phone?: string;
  hours?: string;
  website: string;
  address?: string;
  coverage: string;
  vietnameseSupport: string;
  tags: ProblemTag[];
  helpsWith: string;
}

// Contact details verified via fairwork.gov.au, migrantworkers.org.au and jobwatch.org.au
// (checked 1 Sep 2026). Always double-check on the org's website as details can change.
export const supportOrgs: SupportOrg[] = [
  {
    id: "fwo",
    name: "Fair Work Ombudsman (FWO)",
    shortDesc:
      "Cơ quan chính phủ Úc giám sát luật lao động — xử lý khiếu nại về lương, hợp đồng, sa thải không công bằng.",
    phone: "13 13 94",
    hours: "8:00 – 17:30, Thứ 2 – Thứ 6 (trừ ngày lễ)",
    website: "https://www.fairwork.gov.au/tools-and-resources/language-help/vietnamese",
    coverage: "Toàn nước Úc",
    vietnameseSupport:
      "Có, miễn phí qua dịch vụ phiên dịch: gọi TIS 13 14 50, nói bạn cần tiếng Việt và yêu cầu nối máy tới Fair Work Ombudsman (13 13 94).",
    tags: ["underpayment", "no_payslip", "contract_hours", "unfair_dismissal", "visa_threat", "general"],
    helpsWith: "Kiểm tra lương tối thiểu, khiếu nại lương/điều kiện làm việc, thông tin về quyền lợi.",
  },
  {
    id: "mwc",
    name: "Migrant Workers Centre (MWC)",
    shortDesc: "Tổ chức phi lợi nhuận hỗ trợ pháp lý miễn phí dành riêng cho người lao động di cư.",
    phone: "(03) 7009 6710",
    hours: "9:00 – 17:00, Thứ 2 – Thứ 6",
    website: "https://www.migrantworkers.org.au/get_help",
    address: "54 Victoria St, Carlton VIC 3053",
    coverage: "Chủ yếu hỗ trợ tại Victoria; kiểm tra website để biết phạm vi hỗ trợ hiện tại (có thể hỗ trợ từ xa).",
    vietnameseSupport: "Có hỗ trợ phiên dịch theo yêu cầu khi đăng ký nhận trợ giúp.",
    tags: ["underpayment", "no_payslip", "visa_threat", "unfair_dismissal", "general"],
    helpsWith: "Tư vấn pháp lý miễn phí cho người lao động di cư. Lưu ý: thời gian phản hồi có thể mất 1–2 tuần.",
  },
  {
    id: "clc",
    name: "Community Legal Centres Australia",
    shortDesc: "Mạng lưới trung tâm pháp lý cộng đồng miễn phí trên khắp nước Úc.",
    website: "https://clcs.org.au/legal-help/",
    coverage: "Toàn nước Úc — tìm trung tâm gần bạn theo bang/vùng trên website.",
    vietnameseSupport: "Tuỳ trung tâm địa phương — nhiều nơi có hỗ trợ phiên dịch, hãy hỏi khi liên hệ.",
    tags: ["general", "unsafe", "harassment", "unfair_dismissal"],
    helpsWith: "Tư vấn pháp lý miễn phí đa lĩnh vực, kể cả các vấn đề ngoài lao động.",
  },
  {
    id: "jobwatch",
    name: "JobWatch (Employment Rights Legal Centre)",
    shortDesc: "Trung tâm pháp lý miễn phí chuyên sâu về luật lao động.",
    phone: "(03) 9662 1933 (Melbourne) hoặc 1800 331 617 (khu vực)",
    hours: "9:00 – 17:00 Thứ 2–6 (Thứ 4 tới 20:30), giờ Victoria",
    website: "https://jobwatch.org.au/contact/",
    coverage: "Chủ yếu Victoria, Queensland và Tasmania",
    vietnameseSupport: "Liên hệ trước để hỏi về hỗ trợ phiên dịch.",
    tags: ["unfair_dismissal", "contract_hours", "underpayment", "harassment"],
    helpsWith: "Tư vấn pháp lý chuyên sâu về luật lao động, sa thải, hợp đồng.",
  },
  {
    id: "tis",
    name: "Translating and Interpreting Service (TIS National)",
    shortDesc: "Dịch vụ phiên dịch miễn phí giúp bạn nói chuyện bằng tiếng Việt với các cơ quan hỗ trợ khác.",
    phone: "13 14 50",
    hours: "24/7",
    website: "https://www.tisnational.gov.au/",
    coverage: "Toàn nước Úc",
    vietnameseSupport: "Có — đây chính là dịch vụ hỗ trợ ngôn ngữ.",
    tags: ["general"],
    helpsWith: "Kết nối phiên dịch miễn phí khi bạn gọi các cơ quan chính phủ hoặc hỗ trợ khác.",
  },
  {
    id: "legalaid",
    name: "Legal Aid (theo từng bang)",
    shortDesc: "Dịch vụ trợ giúp pháp lý công, có văn phòng ở mỗi bang/vùng lãnh thổ.",
    website: "https://www.fwc.gov.au/apply-or-lodge/legal-help-and-representation/where-find-legal-help",
    coverage: "Toàn nước Úc — theo từng bang (NSW, VIC, QLD, v.v.)",
    vietnameseSupport: "Tuỳ văn phòng — nhiều nơi có hỗ trợ phiên dịch, hãy hỏi khi liên hệ.",
    tags: ["general", "unfair_dismissal"],
    helpsWith: "Trợ giúp pháp lý, có thể đại diện cho các trường hợp đủ điều kiện.",
  },
];

export function orgsForTags(tags: ProblemTag[]): SupportOrg[] {
  const set = new Set(tags);
  return supportOrgs.filter((org) => org.tags.some((t) => set.has(t)));
}
