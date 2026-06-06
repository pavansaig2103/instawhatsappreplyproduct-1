export const ConversationStatus = {
  ACTIVE: "ACTIVE",
  WAITING_HUMAN: "WAITING_HUMAN",
  RESOLVED: "RESOLVED"
} as const;

export const Direction = {
  INBOUND: "INBOUND",
  OUTBOUND: "OUTBOUND"
} as const;

export const Channel = {
  INSTAGRAM: "INSTAGRAM",
  WHATSAPP: "WHATSAPP"
} as const;

export const ReplyType = {
  FAQ_MATCH: "FAQ_MATCH",
  AI_REPLY: "AI_REPLY",
  HANDOFF: "HANDOFF",
  LEAD_CAPTURE: "LEAD_CAPTURE",
  HUMAN: "HUMAN"
} as const;

export const LeadStatus = {
  NEW: "NEW",
  WARM: "WARM",
  HOT: "HOT",
  ESCALATED: "ESCALATED",
  RESOLVED: "RESOLVED"
} as const;

export const LeadCaptureState = {
  AWAITING_NAME: "AWAITING_NAME",
  AWAITING_PHONE: "AWAITING_PHONE",
  AWAITING_SERVICE: "AWAITING_SERVICE",
  COMPLETE: "COMPLETE"
} as const;

export const NotificationStatus = {
  SENT: "SENT",
  FAILED: "FAILED",
  PENDING: "PENDING"
} as const;

export type ConversationStatus = (typeof ConversationStatus)[keyof typeof ConversationStatus];
export type Direction = (typeof Direction)[keyof typeof Direction];
export type Channel = (typeof Channel)[keyof typeof Channel];
export type ReplyType = (typeof ReplyType)[keyof typeof ReplyType];
export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];
export type LeadCaptureState = (typeof LeadCaptureState)[keyof typeof LeadCaptureState];
export type NotificationStatus = (typeof NotificationStatus)[keyof typeof NotificationStatus];
