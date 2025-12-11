import { Router } from "express";
import { db } from "../db/index.js";
import { projects, project_modes, states, project_states } from "../db/schema.js";
import { eq, inArray } from "drizzle-orm";

const router = Router();

// GET /projects - List all projects
router.get("/", async (req, res) => {
  try {
    // Get all projects
    const allProjects = await db.select().from(projects);
    // For each project, get its states
    const projectIds = allProjects.map(p => p.id);
    let statesMap = {};
    if (projectIds.length > 0) {
      // Get all project_states for these projects
      const projectStatesRows = await db.select().from(project_states).where(inArray(project_states.project_id, projectIds));
      const stateIds = projectStatesRows.map(ps => ps.state_id);
      // Get all states
      const allStates = stateIds.length > 0 ? await db.select().from(states).where(inArray(states.id, stateIds)) : [];
      // Map state_id to state object
      const stateObjMap = {};
      allStates.forEach(s => { stateObjMap[s.id] = s; });
      // Map project_id to array of states
      projectStatesRows.forEach(ps => {
        if (!statesMap[ps.project_id]) statesMap[ps.project_id] = [];
        if (stateObjMap[ps.state_id]) statesMap[ps.project_id].push({ id: ps.state_id, name: stateObjMap[ps.state_id].name });
      });
    }
    // Attach states to each project
    const projectsWithStates = allProjects.map(p => ({ ...p, states: statesMap[p.id] || [] }));
    res.json(projectsWithStates);
  } catch (error) {
    console.error("Get projects error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /projects/:id - Get a single project by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [project] = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json(project);
  } catch (error) {
    console.error("Get project error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /projects - Create a new project
// (Handler is below, supporting multiple state_ids)
router.post("/", async (req, res) => {
  try {
    const { name, mode_id, state_ids, description } = req.body;
    if (!name || !mode_id || !Array.isArray(state_ids) || state_ids.length === 0) {
      return res.status(400).json({ message: "name, mode_id, and state_ids[] are required" });
    }
    // Validate mode_id exists
    const modeExists = await db.select().from(project_modes).where(eq(project_modes.id, mode_id));
    if (modeExists.length === 0) {
      return res.status(400).json({ message: "Invalid mode_id" });
    }
    // Validate all state_ids exist
    const foundStates = await db.select().from(states).where(inArray(states.id, state_ids));
    if (foundStates.length !== state_ids.length) {
      return res.status(400).json({ message: "One or more state_ids are invalid" });
    }
    // Insert project
    const [newProject] = await db
      .insert(projects)
      .values({ name, mode_id, description })
      .returning();
    // Insert into project_states join table
    const projectStateRows = state_ids.map(state_id => ({ project_id: newProject.id, state_id }));
    await db.insert(project_states).values(projectStateRows);
    res.status(201).json(newProject);
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /projects/:id - Update a project
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, mode_id, state_id, description } = req.body;
    // Validate mode_id and state_id if provided
    if (mode_id) {
      const modeExists = await db.select().from(project_modes).where(eq(project_modes.id, mode_id));
      if (modeExists.length === 0) {
        return res.status(400).json({ message: "Invalid mode_id" });
      }
    }
    if (state_id) {
      const stateExists = await db.select().from(states).where(eq(states.id, state_id));
      if (stateExists.length === 0) {
        return res.status(400).json({ message: "Invalid state_id" });
      }
    }
    const [updatedProject] = await db
      .update(projects)
      .set({ name, mode_id, state_id, description })
      .where(eq(projects.id, id))
      .returning();
    if (!updatedProject) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json(updatedProject);
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /projects/:id - Delete a project
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [deleted] = await db.delete(projects).where(eq(projects.id, id)).returning();
    if (!deleted) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.json({ message: "Project deleted successfully", project: deleted });
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
