import { format, parseISO } from "date-fns";
import type { Goal, MilestoneProgress } from "@/features/goals/types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Calendar, Flag, MoreVertical, Target } from "lucide-react";

interface GoalCardProps {
  goal: Goal;
  user: { role?: string } | null;
  progress: MilestoneProgress;
  getStatusBadge: (status: string, size?: "sm" | "lg") => React.ReactNode;
  onSelect: (goal: Goal) => void;
  onUpdateStatus: (args: { goalId: number; status: string; comments?: string }) => void;
}

export default function GoalCard({
  goal,
  user,
  progress,
  getStatusBadge,
  onSelect,
  onUpdateStatus,
}: GoalCardProps) {
  return (
    <Card className="overflow-hidden" data-testid={`goal-card-${goal.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-2">
          <CardTitle className="text-lg font-bold">{goal.title}</CardTitle>
          <div className="flex items-center gap-2">
            <div>{getStatusBadge(goal.status, "lg")}</div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onSelect(goal)}>
                  <Flag className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSelect(goal)}>
                  <Target className="h-4 w-4 mr-2" />
                  View Milestones ({progress.total})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {progress.total > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Milestone Progress</span>
              <span className="font-semibold" data-testid={`goal-progress-${goal.id}`}>
                {progress.completed}/{progress.total} completed ({progress.percentage}%)
              </span>
            </div>
            <Progress
              value={progress.percentage}
              className="h-2"
              data-testid={`progress-bar-${goal.id}`}
            />
          </div>
        )}

        {goal.deadline && (
          <div className="flex items-center text-sm text-muted-foreground mt-2">
            <Calendar className="h-4 w-4 mr-1" />
            Target: {format(parseISO(goal.deadline), "MMM d, yyyy")}
          </div>
        )}
      </CardHeader>

      <CardContent className="pb-3 hidden sm:block">
        <div className="space-y-2">
          <div>
            <h4 className="text-sm font-medium text-primary">Specific</h4>
            <p className="text-sm text-muted-foreground line-clamp-2">{goal.specific}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-primary">Measurable</h4>
            <p className="text-sm text-muted-foreground line-clamp-2">{goal.measurable}</p>
          </div>
        </div>
      </CardContent>

      <CardContent className="pb-3 sm:hidden">
        <p className="text-sm text-muted-foreground line-clamp-2">{goal.specific}</p>
        <button
          className="mt-2 text-xs text-primary font-medium"
          onClick={() => onSelect(goal)}
        >
          View full details →
        </button>
      </CardContent>

      {user?.role === "therapist" && (
        <CardFooter className="flex flex-col items-stretch pt-1 pb-3">
          <div className="text-sm font-medium mb-2">Update Status:</div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={goal.status === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() =>
                onUpdateStatus({
                  goalId: goal.id,
                  status: "pending",
                  comments: goal.therapistComments,
                })
              }
            >
              Pending
            </Button>
            <Button
              variant={goal.status === "in_progress" ? "default" : "outline"}
              size="sm"
              onClick={() =>
                onUpdateStatus({
                  goalId: goal.id,
                  status: "in_progress",
                  comments: goal.therapistComments,
                })
              }
            >
              In Progress
            </Button>
            <Button
              variant={goal.status === "approved" ? "default" : "outline"}
              size="sm"
              onClick={() =>
                onUpdateStatus({
                  goalId: goal.id,
                  status: "approved",
                  comments: goal.therapistComments,
                })
              }
            >
              Approved
            </Button>
            <Button
              variant={goal.status === "completed" ? "default" : "outline"}
              size="sm"
              onClick={() =>
                onUpdateStatus({
                  goalId: goal.id,
                  status: "completed",
                  comments: goal.therapistComments,
                })
              }
            >
              Completed
            </Button>
          </div>

          <div className="mt-4">
            <div className="text-sm font-medium mb-2">Feedback:</div>
            <Textarea
              placeholder="Add your feedback or suggestions here..."
              defaultValue={goal.therapistComments || ""}
              className="min-h-[80px]"
              onBlur={(e) => {
                if (e.target.value !== goal.therapistComments) {
                  onUpdateStatus({
                    goalId: goal.id,
                    status: goal.status,
                    comments: e.target.value,
                  });
                }
              }}
            />
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
