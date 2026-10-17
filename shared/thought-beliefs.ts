import { z } from "zod";

const rating = z.number().int().min(0).max(100);

export const thoughtBeliefFields = {
  beliefInOriginal: rating.optional(),
  beliefInAlternative: rating.optional(),
};

export function hasPairedBeliefRatings(data: {
  beliefInOriginal?: number;
  beliefInAlternative?: number;
}) {
  return (data.beliefInOriginal === undefined) === (data.beliefInAlternative === undefined);
}
