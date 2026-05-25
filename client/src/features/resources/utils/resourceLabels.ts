const RESOURCE_TYPE_KEYS: Record<string, string> = {
  article: "Article",
  worksheet: "Worksheet",
  guide: "Guide",
  exercise: "Exercise",
  video: "Video",
};

const ASSIGNMENT_STATUS_KEYS: Record<string, string> = {
  completed: "Completed",
  in_progress: "In progress",
  pending: "Pending",
};

export function formatResourceCategory(
  category: string,
  t: (key: string) => string
): string {
  return t(category);
}

export function formatResourceType(type: string, t: (key: string) => string): string {
  const key = RESOURCE_TYPE_KEYS[type.toLowerCase()];
  return key ? t(key) : type;
}

export function formatAssignmentStatus(
  status: string,
  t: (key: string) => string
): string {
  const key = ASSIGNMENT_STATUS_KEYS[status];
  return key ? t(key) : status;
}
