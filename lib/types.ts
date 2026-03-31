export type ContentStatus =
  | "pending_title"
  | "title_submitted"
  | "writing"
  | "content_submitted"
  | "revision"
  | "final"
  | "scheduled"
  | "published";

export type ContentTypeKey =
  | "byte"
  | "insight"
  | "explainer"
  | "blog"
  | "slides"
  | "clips"
  | "casestudy"
  | "resource"
  | "other";

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  email: string;
  is_content_writer: number;
  is_operator_eligible: number;
  telegram_chat_id: string;
  telegram_user_id: string;
  telegram_username: string;
  telegram_connected_at: string;
  created_at: string;
}

export interface FeedbackNote {
  id: string;
  content_id: string;
  reviewer_name: string;
  note: string;
  created_at: string;
}

export interface ContentItem {
  id: string;
  member_id: string;
  week_key: string;
  title: string;
  type: ContentTypeKey | "";
  mediums: string[];
  status: ContentStatus;
  link_post: string;
  link_doc: string;
  link_file: string;
  publish_date: string;
  carried: number;
  carried_from_week_key?: string;
  created_at: string;
  updated_at: string;
  feedback_count: number;
  feedback: FeedbackNote[];
}

export interface OperatorAssignment {
  week_key: string;
  member_id: string;
  member?: TeamMember | null;
}

export interface LeaderboardRow {
  member_id: string;
  totalCompleted: number;
  inProgress: number;
  activeWeeks: number;
  topFormat: string;
  typeCounts: Record<ContentTypeKey, number>;
}

export interface TelegramLinkToken {
  id: string;
  member_id: string;
  token: string;
  expires_at: string;
  used_at: string;
  created_at: string;
}

export interface NotificationLog {
  id: string;
  member_id: string;
  channel: string;
  event_type: string;
  status: string;
  message: string;
  error_text: string;
  created_at: string;
}

export const CONTENT_TYPES: Array<{
  key: ContentTypeKey;
  label: string;
  hint: string;
}> = [
  { key: "byte", label: "Byte", hint: "80-150 words" },
  { key: "insight", label: "Insight", hint: "150-300 words" },
  { key: "explainer", label: "Explainer", hint: "300-500 words" },
  { key: "blog", label: "Blog", hint: "500+ words" },
  { key: "slides", label: "Slides", hint: "Carousel or IG slides" },
  { key: "clips", label: "Clips", hint: "Video content" },
  { key: "casestudy", label: "Case study", hint: "Narrative proof" },
  { key: "resource", label: "Resource", hint: "Download or toolkit" },
  { key: "other", label: "Other", hint: "Custom format" },
];

export const PUBLISHING_MEDIUMS = [
  "Instagram",
  "LinkedIn",
  "Dev.to",
  "Medium",
  "Facebook",
  "YouTube",
  "Website blog",
  "Case study",
  "Other",
] as const;

export const CARRIED_STATUSES: ContentStatus[] = [
  "pending_title",
  "title_submitted",
  "writing",
  "content_submitted",
  "revision",
  "final",
  "scheduled",
];

export const BOARD_COLUMNS: Array<{
  key: ContentStatus;
  label: string;
}> = [
  { key: "pending_title", label: "Title pending" },
  { key: "title_submitted", label: "Title submitted" },
  { key: "writing", label: "Writing" },
  { key: "content_submitted", label: "Under review" },
  { key: "revision", label: "In revision" },
  { key: "final", label: "Final" },
  { key: "scheduled", label: "Scheduled" },
];

export const STATUS_LABELS: Record<ContentStatus, string> = {
  pending_title: "Title needed",
  title_submitted: "Title ready",
  writing: "Writing",
  content_submitted: "Under review",
  revision: "Changes requested",
  final: "Approved",
  scheduled: "Scheduled",
  published: "Published",
};

export const STATUS_ORDER: ContentStatus[] = [
  "pending_title",
  "title_submitted",
  "writing",
  "content_submitted",
  "revision",
  "final",
  "scheduled",
  "published",
];
