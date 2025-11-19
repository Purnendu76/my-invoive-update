import {
  pgTable,
  uuid,
  varchar,
  numeric,
  date,
  text,
  pgEnum,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";


export const projectEnum = pgEnum(
  "my-project",
  ["NFS", "GAIL", "BGCL", "STP", "BHARAT NET", "NFS AMC"],
  { ifNotExists: true }
);
export const modeOfProjectEnum = pgEnum(
  "mode_of_projecte",
  ["Back To Back", "Direct"],
  { ifNotExists: true }
);

export const stateEnum = pgEnum(
  "states",
  ["West Bengal", "Delhi", "Bihar", "MP", "Kerala", "Sikkim", "Jharkhand", "Andaman"],
  { ifNotExists: true }
);

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

export const gstPercentageEnum = pgEnum(
  "gst_percentage",
  ["5%", "12%", "18%"],
  { ifNotExists: true }
);

export const statusEnum = pgEnum(
  "status",
  ["Paid", "Cancelled", "Under process", "Credit Note Issued"],
  { ifNotExists: true }
);

// ----------------- USERS Authentication TABLE -----------------
export const users = pgTable("users_auth", {
  id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
  user_name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  project_role: projectEnum("project_role"),
  role: varchar("role", { length: 50 }).default("user"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ----------------- INVOICES TABLE -----------------
export const invoices = pgTable("my-invoicees", {
  id: uuid("id").primaryKey().defaultRandom(),

  // add references() here:
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  project: projectEnum("project").notNull(),
  modeOfProject: modeOfProjectEnum("mode_of_project").notNull(),
  state: stateEnum("state").notNull(),
  mybillCategory: mybillCategoryEnum("my_bill_category").notNull(),
  milestone: milestoneEnum("milestone"),

  invoiceNumber: varchar("invoice_number", { length: 255 }).notNull(),
  invoiceDate: date("invoice_date").notNull(),
  submissionDate: date("submission_date").notNull(),

  invoiceBasicAmount: numeric("invoice_basic_amount").notNull(),
  gstPercentage: gstPercentageEnum("gst_percentage").notNull(),

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
});
