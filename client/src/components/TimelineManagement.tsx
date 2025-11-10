import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  Clock,
  Plus,
  Edit,
  Trash2,
  Calendar,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

/**
 * TIMELINE MANAGEMENT COMPONENT
 * Comprehensive timeline milestone management with full CRUD operations
 */

interface Milestone {
  id: number;
  offeringId: number;
  milestoneType: string;
  milestoneName: string;
  milestoneDescription: string | null;
  targetDate: string | null;
  actualDate: string | null;
  isCompleted: boolean;
  completedBy: number | null;
  notifyInvestors?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TimelineManagementProps {
  offeringId: number;
  timeline: Milestone[];
  isEditable?: boolean;
}

const MILESTONE_TYPES = [
  { value: "offering_created", label: "Offering Created" },
  { value: "submitted_for_review", label: "Submitted for Review" },
  { value: "approved", label: "Approved" },
  { value: "funding_started", label: "Funding Started" },
  { value: "fully_funded", label: "Fully Funded" },
  { value: "offering_closed", label: "Offering Closed" },
  { value: "property_acquisition", label: "Property Acquisition" },
  { value: "legal_completion", label: "Legal Completion" },
  { value: "first_distribution", label: "First Distribution" },
  { value: "quarterly_report", label: "Quarterly Report" },
  { value: "annual_report", label: "Annual Report" },
  { value: "exit_initiated", label: "Exit Initiated" },
  { value: "exit_completed", label: "Exit Completed" },
  { value: "custom", label: "Custom Milestone" },
];

export default function TimelineManagement({
  offeringId,
  timeline,
  isEditable = false,
}: TimelineManagementProps) {
  const utils = trpc.useUtils();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [deletingMilestoneId, setDeletingMilestoneId] = useState<number | null>(null);

  // Create milestone mutation
  const createMilestoneMutation = trpc.offerings.createMilestone.useMutation({
    onSuccess: () => {
      toast.success("Milestone created successfully");
      setIsAddDialogOpen(false);
      utils.offerings.getComplete.invalidate({ id: offeringId });
    },
    onError: (error) => {
      toast.error(`Failed to create milestone: ${error.message}`);
    },
  });

  // Update milestone mutation
  const updateMilestoneMutation = trpc.offerings.updateMilestone.useMutation({
    onSuccess: () => {
      toast.success("Milestone updated successfully");
      setEditingMilestone(null);
      utils.offerings.getComplete.invalidate({ id: offeringId });
    },
    onError: (error) => {
      toast.error(`Failed to update milestone: ${error.message}`);
    },
  });

  // Delete milestone mutation
  const deleteMilestoneMutation = trpc.offerings.deleteMilestone.useMutation({
    onSuccess: () => {
      toast.success("Milestone deleted successfully");
      setDeletingMilestoneId(null);
      utils.offerings.getComplete.invalidate({ id: offeringId });
    },
    onError: (error) => {
      toast.error(`Failed to delete milestone: ${error.message}`);
    },
  });

  // Complete milestone mutation
  const completeMilestoneMutation = trpc.offerings.completeMilestone.useMutation({
    onSuccess: () => {
      toast.success("Milestone marked as complete");
      utils.offerings.getComplete.invalidate({ id: offeringId });
    },
    onError: (error) => {
      toast.error(`Failed to complete milestone: ${error.message}`);
    },
  });

  if (timeline.length === 0 && !isEditable) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No timeline milestones yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Milestone Button */}
      {isEditable && (
        <div className="flex justify-end">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Milestone
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <MilestoneForm
                offeringId={offeringId}
                onSubmit={(data) => createMilestoneMutation.mutate(data)}
                isLoading={createMilestoneMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Timeline Display */}
      {timeline.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No milestones added yet</p>
            {isEditable && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Milestone
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {timeline.map((milestone) => (
            <Card key={milestone.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  {/* Status Icon */}
                  <div className="mt-1">
                    {milestone.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>

                  {/* Milestone Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold mb-1">{milestone.milestoneName}</h3>
                        <Badge variant={milestone.isCompleted ? "default" : "secondary"}>
                          {milestone.milestoneType.replace(/_/g, " ").toUpperCase()}
                        </Badge>
                      </div>

                      {/* Action Buttons */}
                      {isEditable && (
                        <div className="flex gap-2">
                          {!milestone.isCompleted && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                completeMilestoneMutation.mutate({ id: milestone.id })
                              }
                              disabled={completeMilestoneMutation.isPending}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Complete
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingMilestone(milestone)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeletingMilestoneId(milestone.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    {milestone.milestoneDescription && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {milestone.milestoneDescription}
                      </p>
                    )}

                    {/* Dates */}
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      {milestone.targetDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Target: {new Date(milestone.targetDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {milestone.actualDate && (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span>
                            Completed: {new Date(milestone.actualDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Notify Investors Badge */}
                    {milestone.notifyInvestors && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Investors Notified
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Milestone Dialog */}
      {editingMilestone && (
        <Dialog open={!!editingMilestone} onOpenChange={() => setEditingMilestone(null)}>
          <DialogContent className="max-w-2xl">
            <MilestoneForm
              offeringId={offeringId}
              milestone={editingMilestone}
              onSubmit={(data) =>
                updateMilestoneMutation.mutate({ id: editingMilestone.id, ...data })
              }
              isLoading={updateMilestoneMutation.isPending}
              isEdit
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingMilestoneId}
        onOpenChange={() => setDeletingMilestoneId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Milestone</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this milestone? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingMilestoneId) {
                  deleteMilestoneMutation.mutate({ id: deletingMilestoneId });
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================
// MILESTONE FORM COMPONENT
// ============================================

interface MilestoneFormProps {
  offeringId: number;
  milestone?: Milestone;
  onSubmit: (data: any) => void;
  isLoading: boolean;
  isEdit?: boolean;
}

function MilestoneForm({ offeringId, milestone, onSubmit, isLoading, isEdit }: MilestoneFormProps) {
  const [formData, setFormData] = useState({
    milestoneType: milestone?.milestoneType || "custom",
    milestoneName: milestone?.milestoneName || "",
    milestoneDescription: milestone?.milestoneDescription || "",
    targetDate: milestone?.targetDate
      ? new Date(milestone.targetDate).toISOString().split("T")[0]
      : "",
    notifyInvestors: milestone?.notifyInvestors || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const submitData: any = {
      milestoneType: formData.milestoneType,
      milestoneName: formData.milestoneName,
      milestoneDescription: formData.milestoneDescription || null,
      targetDate: formData.targetDate ? new Date(formData.targetDate) : null,
      notifyInvestors: formData.notifyInvestors,
    };

    if (!isEdit) {
      submitData.offeringId = offeringId;
    }

    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit Milestone" : "Add New Milestone"}</DialogTitle>
        <DialogDescription>
          {isEdit
            ? "Update the milestone details below"
            : "Create a new milestone for this offering timeline"}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {/* Milestone Type */}
        <div className="space-y-2">
          <Label htmlFor="milestoneType">Milestone Type</Label>
          <Select
            value={formData.milestoneType}
            onValueChange={(value) => {
              setFormData({ ...formData, milestoneType: value });
              // Auto-fill name for predefined types
              const type = MILESTONE_TYPES.find((t) => t.value === value);
              if (type && value !== "custom" && !isEdit) {
                setFormData((prev) => ({ ...prev, milestoneName: type.label }));
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select milestone type" />
            </SelectTrigger>
            <SelectContent>
              {MILESTONE_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Milestone Name */}
        <div className="space-y-2">
          <Label htmlFor="milestoneName">Milestone Name *</Label>
          <Input
            id="milestoneName"
            value={formData.milestoneName}
            onChange={(e) => setFormData({ ...formData, milestoneName: e.target.value })}
            placeholder="Enter milestone name"
            required
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="milestoneDescription">Description</Label>
          <Textarea
            id="milestoneDescription"
            value={formData.milestoneDescription}
            onChange={(e) =>
              setFormData({ ...formData, milestoneDescription: e.target.value })
            }
            placeholder="Enter milestone description (optional)"
            rows={3}
          />
        </div>

        {/* Target Date */}
        <div className="space-y-2">
          <Label htmlFor="targetDate">Target Date</Label>
          <Input
            id="targetDate"
            type="date"
            value={formData.targetDate}
            onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
          />
        </div>

        {/* Notify Investors */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="notifyInvestors"
            checked={formData.notifyInvestors}
            onChange={(e) =>
              setFormData({ ...formData, notifyInvestors: e.target.checked })
            }
            className="rounded border-gray-300"
          />
          <Label htmlFor="notifyInvestors" className="cursor-pointer">
            Notify investors when this milestone is completed
          </Label>
        </div>
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isLoading || !formData.milestoneName}>
          {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isEdit ? "Update Milestone" : "Create Milestone"}
        </Button>
      </DialogFooter>
    </form>
  );
}
