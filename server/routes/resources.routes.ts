import { Router } from "express";
import { authenticate } from "../middleware/auth";
import {
  getAllResources,
  createResource,
  updateResource,
  deleteResource,
  assignResource,
  cloneResource,
  getTherapistAssignments,
  deleteResourceAssignment,
} from "../controllers/resources.controller";

const router = Router();

// Educational resources — static sub-paths before parameterised ones
router.get("/resources", authenticate, getAllResources);
router.post("/resources", authenticate, createResource);
router.post("/resources/assign", authenticate, assignResource);  // before /:id
router.patch("/resources/:id", authenticate, updateResource);
router.delete("/resources/:id", authenticate, deleteResource);
router.post("/resources/:id/clone", authenticate, cloneResource);

// Therapist resource assignments
router.get("/therapist/assignments", authenticate, getTherapistAssignments);
router.delete("/resource-assignments/:id", authenticate, deleteResourceAssignment);

export default router;
