// Expected integrity conflicts, kept separate from database/transport failures.
export class SuggestedResourceMissingError extends Error {
  constructor(public readonly resourceId: number) {
    super("A suggested resource does not exist");
    this.name = "SuggestedResourceMissingError";
  }
}

export class ResourceReferencedError extends Error {
  constructor() {
    super("This resource is used by a saved recommendation and cannot be deleted.");
    this.name = "ResourceReferencedError";
  }
}
