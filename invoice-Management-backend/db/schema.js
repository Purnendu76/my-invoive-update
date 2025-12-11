import {
  pgTable,
  uuid,
  varchar,
  numeric,
  date,
  text,
  pgEnum,
  timestamp,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ----------------- ENUMS (kept) -----------------
// (Kept for categories / milestone / status. Remove if you also want these dynamic)
export const mybillCategoryEnum = pgEnum(
  "my_bill_categoriy",
  [
    "Service",
    "Supply",
    "ROW",
    "AMC",
    "Restoration Service",
    "Restoration Supply",
    "Restoration Row",
    "Spares",
    "Training",
  ],
  { ifNotExists: true }
);

export const milestoneEnum = pgEnum(
  "milestone",
  ["60%", "90%", "100%"],
  { ifNotExists: true }
);

export const statusEnum = pgEnum(
  "status",
  ["Paid", "Cancelled", "Under process", "Credit Note Issued"],
  { ifNotExists: true }
);

// ----------------- LOOKUP TABLES (admin-managed) -----------------

// Project modes (admin can add "Back To Back", "Direct", or any future mode)
export const project_modes = pgTable("project_modes", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// States (admin can add states)
export const states = pgTable("states", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  code: varchar("code", { length: 50 }), // optional short code
  createdAt: timestamp("created_at").defaultNow(),
});

// GST percentages (admin can add new percentage rows)
export const gst_percentages = pgTable("gst_percentages", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  // store numeric percent, e.g., 0, 5, 12, 18
  percent: numeric("percent").notNull(),
  label: varchar("label", { length: 50 }), // optional label like "5%" or "Exempt"
  createdAt: timestamp("created_at").defaultNow(),
});

// ----------------- USERS Authentication TABLE -----------------
export const users = pgTable("users_auth", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  user_name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  // now a FK to projects (nullable if a user might not be tied to a project)
  project_role: uuid("project_role")
    .references(() => projects.id, { onDelete: "set null" })
    .default(null),
  role: varchar("role", { length: 50 }).default("user"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ----------------- PROJECTS TABLE -----------------
// Stores project name, its Mode (FK to project_modes)
export const projects = pgTable("projects", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  // reference to project_modes
  mode_id: uuid("mode_id")
    .notNull()
    .references(() => project_modes.id, { onDelete: "restrict" }),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ----------------- PROJECT-STATES JOIN TABLE -----------------
// Many-to-many: a project can have multiple states, a state can belong to multiple projects
export const project_states = pgTable("project_states", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  project_id: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  state_id: uuid("state_id")
    .notNull()
    .references(() => states.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// ----------------- INVOICES TABLE -----------------
export const invoices = pgTable("my-invoicees", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),

  // foreign key to users table:
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // project now references projects.id (UUID) as requested
  project: uuid("project")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),

  // removed modeOfProject and state columns here because those live in projects.
  // GST percentage now references gst_percentages table
  gstPercentage: uuid("gst_percentage_id")
    .notNull()
    .references(() => gst_percentages.id, { onDelete: "restrict" }),

  mybillCategory: mybillCategoryEnum("my_bill_category").notNull(),
  milestone: milestoneEnum("milestone"),

  invoiceNumber: varchar("invoice_number", { length: 255 }).notNull(),
  invoiceDate: date("invoice_date").notNull(),
  submissionDate: date("submission_date").notNull(),

  invoiceBasicAmount: numeric("invoice_basic_amount").notNull(),

  invoiceGstAmount: numeric("invoice_gst_amount").notNull().default("0"),
  totalAmount: numeric("total_amount").notNull().default("0"),

  passedAmountByClient: numeric("passed_amount_by_client").default("0"),
  retention: numeric("retention").notNull().default("0"),
  gstWithheld: numeric("gst_withheld").notNull().default("0"),
  tds: numeric("tds").notNull().default("0"),
  gstTds: numeric("gst_tds").notNull().default("0"),
  bocw: numeric("bocw").notNull().default("0"),
  lowDepthDeduction: numeric("low_depth_deduction").notNull().default("0"),
  ld: numeric("ld").notNull().default("0"),
  slaPenalty: numeric("sla_penalty").notNull().default("0"),
  penalty: numeric("penalty").notNull().default("0"),
  otherDeduction: numeric("other_deduction").notNull().default("0"),

  totalDeduction: numeric("total_deduction").notNull().default("0"),
  netPayable: numeric("net_payable").notNull().default("0"),

  status: statusEnum("status").notNull(),
  amountPaidByClient: numeric("amount_paid_by_client").notNull().default("0"),
  paymentDate: date("payment_date"),
  balance: numeric("balance").notNull().default("0"),

  remarks: text("remarks"),
  document_path: varchar("document_path", { length: 255 }), // file path for uploaded document
});
