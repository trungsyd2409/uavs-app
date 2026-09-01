export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  title: string;
  minutes: number;
  emoji: string;
  content: string[];
  quiz: QuizQuestion[];
}

export const lessons: Lesson[] = [
  {
    id: "min-wage",
    title: "Lương tối thiểu & payslip",
    minutes: 3,
    emoji: "💵",
    content: [
      "Mọi người lao động tại Úc đều có quyền được trả ít nhất mức lương tối thiểu quốc gia theo giờ — bất kể bạn đang giữ visa gì (du học, working holiday, tạm trú...).",
      "Nhân viên casual (thời vụ) được trả thêm 25% 'casual loading' để bù cho việc không có nghỉ phép có lương.",
      "Chủ PHẢI đưa cho bạn payslip trong vòng 1 ngày làm việc sau khi trả lương, dù bạn được trả tiền mặt hay chuyển khoản.",
      "Trả lương bằng tiền mặt không phải là bất hợp pháp, nhưng KHÔNG làm giảm quyền được trả đúng mức lương tối thiểu của bạn.",
    ],
    quiz: [
      {
        question: "Boss của bạn nói: 'Sinh viên chỉ được trả $20/giờ tiền mặt thôi, đó là luật.' Điều này đúng hay sai?",
        options: [
          "Đúng, vì sinh viên có mức lương riêng thấp hơn",
          "Sai — mức lương tối thiểu áp dụng cho mọi người lao động, không phụ thuộc vào visa",
          "Chỉ đúng nếu làm dưới 20 giờ/tuần",
        ],
        correctIndex: 1,
        explanation:
          "Không có mức lương riêng thấp hơn cho sinh viên hay bất kỳ loại visa nào. Đây là thông tin sai lệch phổ biến mà một số chủ dùng để trả lương thấp.",
      },
      {
        question: "Bạn nhận lương tiền mặt, không có payslip. Bạn nên làm gì trước?",
        options: [
          "Không cần lo, tiền mặt là bình thường",
          "Tự ghi chép giờ làm và số tiền nhận, đồng thời yêu cầu payslip bằng văn bản",
          "Nghỉ việc ngay lập tức",
        ],
        correctIndex: 1,
        explanation:
          "Ghi chép và yêu cầu payslip bằng văn bản giúp bạn có bằng chứng nếu cần khiếu nại sau này, mà không cần phản ứng vội vàng.",
      },
    ],
  },
  {
    id: "employment-types",
    title: "Casual, Part-time, Full-time khác gì nhau?",
    minutes: 3,
    emoji: "📋",
    content: [
      "Casual: không có giờ làm cố định, không có nghỉ phép có lương, nhưng được +25% casual loading trong lương.",
      "Part-time: có số giờ cố định mỗi tuần (ít hơn full-time), được hưởng nghỉ phép có lương theo tỷ lệ giờ làm.",
      "Full-time: thường 38 giờ/tuần, được hưởng đầy đủ nghỉ phép năm, nghỉ ốm có lương.",
      "Nếu bạn làm việc như casual nhưng thực tế có lịch cố định đều đặn trong thời gian dài, bạn có thể có quyền yêu cầu chuyển sang part-time/full-time ('casual conversion').",
    ],
    quiz: [
      {
        question: "Bạn là nhân viên casual, được trả thêm bao nhiêu % so với lương cơ bản để bù nghỉ phép?",
        options: ["10%", "25%", "50%"],
        correctIndex: 1,
        explanation: "Casual loading tiêu chuẩn là 25% trên mức lương cơ bản.",
      },
    ],
  },
  {
    id: "penalty-rates",
    title: "Làm cuối tuần & ngày lễ",
    minutes: 2,
    emoji: "📅",
    content: [
      "Nhiều ngành (nhà hàng, bán lẻ, làm đẹp...) có 'penalty rates' — mức lương cao hơn khi làm thứ Bảy, Chủ Nhật, hoặc ngày lễ.",
      "Mức phụ cấp cụ thể tuỳ vào 'award' (thỏa ước ngành) áp dụng cho công việc của bạn.",
      "Nếu làm quá giờ quy định trong ngày/tuần, bạn cũng có thể được trả thêm 'overtime'.",
    ],
    quiz: [
      {
        question: "Bạn làm Chủ Nhật ở một quán cà phê nhưng được trả đúng như ngày thường. Điều này có thể là dấu hiệu gì?",
        options: [
          "Bình thường, không có gì đáng lo",
          "Có thể là dấu hiệu trả lương thiếu — nên kiểm tra award áp dụng",
          "Luôn luôn hợp pháp vì chủ tự quyết định",
        ],
        correctIndex: 1,
        explanation: "Nếu award của ngành bạn quy định penalty rate cho Chủ Nhật mà bạn không được trả thêm, đây có thể là vi phạm.",
      },
    ],
  },
  {
    id: "unpaid-trial",
    title: "Thử việc & khấu trừ lương",
    minutes: 2,
    emoji: "🚩",
    content: [
      "'Thử việc không lương' kéo dài hoặc mang tính chất làm việc thật (phục vụ khách, đứng máy...) thường không hợp pháp.",
      "Chủ không được tự ý trừ lương của bạn (ví dụ vì làm vỡ đồ, thiếu quỹ tiền mặt) trừ khi bạn đồng ý bằng văn bản một cách tự nguyện, không bị ép buộc.",
    ],
    quiz: [
      {
        question: "Chủ yêu cầu bạn làm thử 1 ca phục vụ khách đầy đủ, không trả lương, nói là 'thử việc'. Điều này có ổn không?",
        options: [
          "Ổn, vì đây là 'thử việc' nên không cần trả lương",
          "Đáng ngờ — nếu bạn làm việc có ích thật sự cho quán, bạn thường có quyền được trả lương",
          "Chỉ ổn nếu ca đó dưới 8 tiếng",
        ],
        correctIndex: 1,
        explanation: "Làm việc thật sự (dù gọi là thử việc) thường phải được trả lương, trừ các bài test kỹ năng rất ngắn.",
      },
    ],
  },
  {
    id: "safety",
    title: "An toàn nơi làm việc",
    minutes: 2,
    emoji: "🦺",
    content: [
      "Bạn có quyền làm việc trong môi trường an toàn — bất kể loại visa.",
      "Chủ phải cung cấp đào tạo và thiết bị bảo hộ cần thiết cho công việc.",
      "Nếu bị chấn thương khi làm việc, bạn có thể có quyền được bồi thường (workers compensation) — hãy đi khám và giữ hồ sơ y tế.",
    ],
    quiz: [
      {
        question: "Bạn bị bỏng nhẹ khi làm bếp do thiếu đào tạo an toàn. Bạn nên làm gì đầu tiên?",
        options: [
          "Giấu đi vì sợ bị đuổi việc",
          "Báo cho chủ, đi khám nếu cần, và ghi chép lại sự việc",
          "Không cần làm gì vì chấn thương nhẹ",
        ],
        correctIndex: 1,
        explanation: "Luôn báo cáo và ghi chép sự việc — dù nhẹ — để bảo vệ quyền lợi của bạn về sau.",
      },
    ],
  },
  {
    id: "visa-myths",
    title: "Sự thật & lầm tưởng về visa",
    minutes: 3,
    emoji: "🛂",
    content: [
      "Lầm tưởng: 'Người giữ visa không có quyền khiếu nại lương.' → Sự thật: mọi người lao động đều có quyền này, bất kể visa.",
      "Lầm tưởng: 'Báo cáo vi phạm sẽ khiến visa của tôi bị huỷ.' → Sự thật: Fair Work Ombudsman có chính sách hỗ trợ người giữ visa báo cáo vi phạm một cách an toàn trong nhiều trường hợp.",
      "Sinh viên (visa 500) có giới hạn giờ làm riêng của BẠN cần tự tuân thủ (hiện là 48 giờ/2 tuần trong kỳ học) — đây là trách nhiệm của bạn với Bộ Di Trú, không liên quan đến việc chủ có phải trả đúng lương hay không.",
    ],
    quiz: [
      {
        question: "Chủ đe dọa sẽ báo bạn cho cơ quan di trú nếu bạn khiếu nại lương thấp. Bạn nên hiểu điều này thế nào?",
        options: [
          "Đây là lời đe dọa nghiêm trọng, không phải luật thật — nên tìm hiểu và tìm hỗ trợ",
          "Nên im lặng vì chủ nói đúng luật",
          "Nên nghỉ việc ngay không cần tìm hiểu gì thêm",
        ],
        correctIndex: 0,
        explanation:
          "Đây là hình thức cưỡng ép. Quyền được trả lương đúng không phụ thuộc vào visa, và có các kênh hỗ trợ an toàn, bảo mật cho người giữ visa.",
      },
    ],
  },
];

export function totalLessons() {
  return lessons.length;
}
