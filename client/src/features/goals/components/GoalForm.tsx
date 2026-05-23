import { z } from "zod";
import { UseFormReturn } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { HelpCircle } from "lucide-react";
import { useLocalization } from "@/lib/localize";

export const goalSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  specific: z.string().min(10, "Please provide more specific details"),
  measurable: z.string().min(10, "Please provide measurable criteria"),
  achievable: z.string().min(10, "Please explain why this is achievable"),
  relevant: z.string().min(10, "Please explain why this is relevant"),
  timebound: z.string().min(10, "Please provide a timeframe"),
  deadline: z.string().optional(),
});

export const milestoneSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
});

export type GoalFormValues = z.infer<typeof goalSchema>;
export type MilestoneFormValues = z.infer<typeof milestoneSchema>;

interface GoalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<GoalFormValues>;
  onSubmit: (data: GoalFormValues) => void;
  isPending: boolean;
  reflectionInsights: string | null;
}

export default function GoalForm({
  open,
  onOpenChange,
  form,
  onSubmit,
  isPending,
  reflectionInsights,
}: GoalFormProps) {
  const { t } = useLocalization();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("Create a SMART Goal")}</DialogTitle>
          <DialogDescription>
            {t("SMART goals are Specific, Measurable, Achievable, Relevant, and Time-bound.")}
          </DialogDescription>
        </DialogHeader>

        <div className="mb-6">
          <Accordion type="single" collapsible className="bg-muted/50 rounded-lg p-2">
            <AccordionItem value="smart-goals">
              <AccordionTrigger className="text-base font-medium">
                <div className="flex items-center">
                  <HelpCircle className="h-5 w-5 me-2 text-primary" />
                  {t("Understanding SMART Goals")}
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm">
                <p className="mb-2">
                  {t("SMART is an acronym used to guide goal setting. It stands for Specific, Measurable, Achievable, Relevant, and Time-bound.")}
                </p>

                <div className="space-y-3 mt-3">
                  <div>
                    <h4 className="font-medium">{t("Specific")}</h4>
                    <p>{t("Your goal should clearly define what you want to accomplish. The more specific, the better.")}</p>
                    <p className="text-xs mt-1 italic">{t('Example: "I will walk 10,000 steps daily" instead of "I will exercise more."')}</p>
                  </div>

                  <div>
                    <h4 className="font-medium">{t("Measurable")}</h4>
                    <p>{t("You need concrete criteria to track your progress and measure success.")}</p>
                    <p className="text-xs mt-1 italic">{t('Example: "I will save $300 per month" instead of "I will save money."')}</p>
                  </div>

                  <div>
                    <h4 className="font-medium">{t("Achievable")}</h4>
                    <p>{t("Your goal should be realistic and attainable with the resources available to you.")}</p>
                    <p className="text-xs mt-1 italic">{t('Example: "I will read one book per month" instead of "I will read 100 books this year."')}</p>
                  </div>

                  <div>
                    <h4 className="font-medium">{t("Relevant")}</h4>
                    <p>{t("Your goal should align with your broader life objectives and personal values.")}</p>
                    <p className="text-xs mt-1 italic">{t('Example: "I will take a coding course to advance my career" instead of pursuing a goal unrelated to your interests or needs.')}</p>
                  </div>

                  <div>
                    <h4 className="font-medium">{t("Time-bound")}</h4>
                    <p>{t("Your goal needs a target date or deadline to create urgency and maintain focus.")}</p>
                    <p className="text-xs mt-1 italic">{t('Example: "I will complete this project by June 30th" instead of "I will do this project someday."')}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="font-medium">{t("Benefits of SMART Goals:")}</h4>
                  <ul className="list-disc pl-5 space-y-1 mt-1">
                    <li>{t("Provides clear direction and focus")}</li>
                    <li>{t("Makes it easier to track progress")}</li>
                    <li>{t("Increases motivation and commitment")}</li>
                    <li>{t("Helps prioritize your efforts and resources")}</li>
                    <li>{t("Creates accountability")}</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="milestones">
              <AccordionTrigger className="text-base font-medium">
                <div className="flex items-center">
                  <HelpCircle className="h-5 w-5 me-2 text-primary" />
                  {t("The Power of Milestones")}
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm">
                <p className="mb-2">
                  {t("Milestones are smaller, manageable targets that mark your progress toward a larger goal.")}
                </p>

                <div className="space-y-3 mt-3">
                  <div>
                    <h4 className="font-medium">{t("Why Use Milestones?")}</h4>
                    <ul className="list-disc pl-5 space-y-1 mt-1">
                      <li><strong>{t("Break down complexity")}</strong> - {t("Large goals become less overwhelming")}</li>
                      <li><strong>{t("Track progress")}</strong> - {t("Regular feedback on how you're doing")}</li>
                      <li><strong>{t("Celebrate small wins")}</strong> - {t("Boost motivation along the journey")}</li>
                      <li><strong>{t("Adjust as needed")}</strong> - {t("Early warning if something needs to change")}</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium">{t("Creating Effective Milestones:")}</h4>
                    <ul className="list-disc pl-5 space-y-1 mt-1">
                      <li>{t("Make them specific and concrete")}</li>
                      <li>{t("Set realistic timeframes")}</li>
                      <li>{t("Ensure they build logically toward your main goal")}</li>
                      <li>{t("Keep them achievable but challenging")}</li>
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Goal Title")}</FormLabel>
                  <FormControl>
                    <Input placeholder={t("Enter a title for your goal")} voiceInput {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specific"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Specific")}</FormLabel>
                  <FormDescription>
                    {t("What exactly do you want to accomplish?")}
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder={t("Be precise about what you want to achieve...")}
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="measurable"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Measurable")}</FormLabel>
                  <FormDescription>
                    {t("How will you track progress and measure success?")}
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder={t("Define criteria to measure progress...")}
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="achievable"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Achievable")}</FormLabel>
                  <FormDescription>
                    {t("Is this goal realistic? Do you have the resources and capabilities?")}
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder={t("Explain why this goal is attainable...")}
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="relevant"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Relevant")}</FormLabel>
                  <FormDescription>
                    {t("Why is this goal important to you? How does it align with your values?")}
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder={t("Describe why this goal matters to you...")}
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="timebound"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Time-bound")}</FormLabel>
                  <FormDescription>
                    {t("What's your time frame for accomplishing this goal?")}
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder={t("Describe your timeline and deadlines...")}
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("Target Completion Date")}</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit" disabled={isPending}>
                {isPending ? t("Creating...") : t("Create Goal")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
