import { format, parseISO } from "date-fns";
import type { Goal, Milestone } from "@/features/goals/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, CheckCircle, Clock, PlusCircle, Target } from "lucide-react";
import { useLocalization, DynamicTranslator } from "@/lib/localize";

interface MilestoneListProps {
  milestones: Milestone[];
  isLoading: boolean;
  user: { role?: string } | null;
  selectedGoal: Goal | null;
  isAddingMilestone: boolean;
  onSetAddingMilestone: (v: boolean) => void;
  onToggleCompletion: (args: { milestoneId: number; isCompleted: boolean }) => void;
}

export default function MilestoneList({
  milestones,
  isLoading,
  user,
  selectedGoal,
  isAddingMilestone,
  onSetAddingMilestone,
  onToggleCompletion,
}: MilestoneListProps) {
  const { t } = useLocalization();

  return (
    <div id="milestones-section" className="bg-muted/30 p-6 rounded-lg border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-xl">{t("Milestones")}</h3>
        </div>

        {user?.role === "client" && (
          <Button
            variant="default"
            size="sm"
            className="gap-1 bg-purple-600 hover:bg-purple-700 border-0"
            onClick={() => onSetAddingMilestone(true)}
            data-testid="button-add-milestone"
          >
            <PlusCircle className="h-4 w-4" />
            {t("Add Milestone")}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : milestones.length === 0 ? (
        <div className="text-center p-6 border border-dashed rounded-lg">
          <p className="text-muted-foreground text-sm">{t("No milestones created yet")}</p>
          {user?.role === "client" && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => onSetAddingMilestone(true)}
            >
              <PlusCircle className="h-4 w-4 me-1" />
              {t("Add First Milestone")}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {milestones.map((milestone, index) => (
            <div
              key={milestone.id}
              className={`p-3 border rounded-md ${
                milestone.isCompleted ? "bg-green-50 border-green-200" : "bg-background"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="mt-0.5">
                    {user?.role === "client" ? (
                      <Checkbox
                        checked={milestone.isCompleted}
                        className="border-purple-600 data-[state=checked]:bg-purple-600"
                        onCheckedChange={(checked) => {
                          onToggleCompletion({
                            milestoneId: milestone.id,
                            isCompleted: !!checked,
                          });
                        }}
                      />
                    ) : milestone.isCompleted ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-yellow-600" />
                    )}
                  </div>
                </div>

                <div className="flex-1">
                  <h4 className={`font-medium ${milestone.isCompleted ? "text-green-800" : ""}`}>
                    <DynamicTranslator text={milestone.title} />
                  </h4>

                  {milestone.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      <DynamicTranslator text={milestone.description} />
                    </p>
                  )}

                  {milestone.dueDate && (
                    <div className="flex items-center text-xs text-muted-foreground mt-2">
                      <Calendar className="h-3 w-3 me-1" />
                      {format(parseISO(milestone.dueDate), "MMM d, yyyy")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
