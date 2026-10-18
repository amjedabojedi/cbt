// Deliberately excludes client identity and clinical recommendation fields.
export interface ResourceReferenceSummary {
  hasReferences: boolean;
  references: { id: number; status: string; createdAt: Date | string }[];
  hasMore: boolean;
}
