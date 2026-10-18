import { sql } from "drizzle-orm";
import { aiRecommendations, resources } from "@shared/schema";

/** Aggregate-only output. Never add record identifiers or clinical text here. */
export interface RecommendationResourceAudit {
  recommendationsScanned: number;
  recommendationsWithReferences: number;
  validReferenceOccurrences: number;
  missingReferenceOccurrences: number;
  distinctMissingResourceIds: number;
  recommendationsWithMissingResources: number;
  malformedResourceLists: number;
  invalidReferenceOccurrences: number;
}

// One SELECT gives a consistent snapshot across both tables, at every status.
// Guard JSON expansion and numeric conversion so malformed historical data
// contributes to the report rather than aborting the audit.
export const recommendationResourceAuditQuery = sql`
  WITH source AS (
    SELECT ${aiRecommendations.id} AS recommendation_id,
           ${aiRecommendations.suggestedResources} AS resource_ids
    FROM ${aiRecommendations}
  ), entries AS (
    SELECT recommendation_id, element,
      CASE WHEN jsonb_typeof(element) = 'number' THEN
        CASE WHEN (element #>> '{}')::numeric BETWEEN 1 AND 2147483647
                   AND trunc((element #>> '{}')::numeric) = (element #>> '{}')::numeric
             THEN (element #>> '{}')::numeric END
      END AS resource_id
    FROM source
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(resource_ids) = 'array' THEN resource_ids ELSE '[]'::jsonb END
    ) AS items(element)
  ), checked AS (
    SELECT entries.*, ${resources.id} IS NULL AS missing
    FROM entries LEFT JOIN ${resources} ON ${resources.id} = entries.resource_id
  )
  SELECT
    (SELECT count(*) FROM source)::text AS "recommendationsScanned",
    (SELECT count(*) FROM source
      WHERE jsonb_typeof(resource_ids) = 'array' AND resource_ids <> '[]'::jsonb
    )::text AS "recommendationsWithReferences",
    count(*) FILTER (WHERE resource_id IS NOT NULL)::text AS "validReferenceOccurrences",
    count(*) FILTER (WHERE resource_id IS NOT NULL AND missing)::text AS "missingReferenceOccurrences",
    count(DISTINCT resource_id) FILTER (WHERE missing)::text AS "distinctMissingResourceIds",
    count(DISTINCT recommendation_id) FILTER (WHERE resource_id IS NOT NULL AND missing)::text
      AS "recommendationsWithMissingResources",
    (SELECT count(*) FROM source
      WHERE resource_ids IS NOT NULL AND resource_ids <> 'null'::jsonb
        AND jsonb_typeof(resource_ids) <> 'array'
    )::text AS "malformedResourceLists",
    count(*) FILTER (WHERE resource_id IS NULL)::text AS "invalidReferenceOccurrences"
  FROM checked
`;

export function parseRecommendationResourceAudit(
  row: Record<string, unknown>,
): RecommendationResourceAudit {
  const keys: (keyof RecommendationResourceAudit)[] = [
    "recommendationsScanned", "recommendationsWithReferences", "validReferenceOccurrences",
    "missingReferenceOccurrences", "distinctMissingResourceIds",
    "recommendationsWithMissingResources", "malformedResourceLists", "invalidReferenceOccurrences",
  ];
  const result = {} as RecommendationResourceAudit;
  for (const key of keys) {
    const value = row[key];
    if (typeof value !== "string" || !/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))) {
      throw new Error("Invalid integrity audit aggregate");
    }
    result[key] = Number(value);
  }
  return result;
}
