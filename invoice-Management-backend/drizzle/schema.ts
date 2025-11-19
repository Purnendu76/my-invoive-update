import { pgTable, uuid, text, varchar, date, numeric, unique, timestamp, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const gstPercentage = pgEnum("gst_percentage", ['5%', '12%', '18%'])
export const milestone = pgEnum("milestone", ['60%', '90%', '100%'])
export const modeOfProjecte = pgEnum("mode_of_projecte", ['Back To Back', 'Direct'])
export const myProject = pgEnum("my-project", ['NFS', 'GAIL', 'BGCL', 'STP', 'BHARAT NET', 'NFS AMC'])
export const myBillCategoriy = pgEnum("my_bill_categoriy", ['Service', 'Supply', 'ROW', 'AMC', 'Restoration Service', 'Restoration Supply', 'Restoration Row', 'Spares', 'Training'])
export const states = pgEnum("states", ['West Bengal', 'Delhi', 'Bihar', 'MP', 'Kerala', 'Sikkim', 'Jharkhand', 'Andaman'])
export const status = pgEnum("status", ['Paid', 'Cancelled', 'Under process', 'Credit Note Issued'])


export const myInvoicees = pgTable("my-invoicees", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	project: text().notNull(),
	modeOfProject: modeOfProjecte("mode_of_project").notNull(),
	state: states().notNull(),
	myBillCategory: myBillCategoriy("my_bill_category").notNull(),
	milestone: milestone(),
	invoiceNumber: varchar("invoice_number", { length: 255 }).notNull(),
	invoiceDate: date("invoice_date").notNull(),
	submissionDate: date("submission_date").notNull(),
	invoiceBasicAmount: numeric("invoice_basic_amount").notNull(),
	gstPercentage: gstPercentage("gst_percentage").notNull(),
	invoiceGstAmount: numeric("invoice_gst_amount").default('0').notNull(),
	totalAmount: numeric("total_amount").default('0').notNull(),
	passedAmountByClient: numeric("passed_amount_by_client").default('0'),
	retention: numeric().default('0').notNull(),
	gstWithheld: numeric("gst_withheld").default('0').notNull(),
	tds: numeric().default('0').notNull(),
	gstTds: numeric("gst_tds").default('0').notNull(),
	bocw: numeric().default('0').notNull(),
	lowDepthDeduction: numeric("low_depth_deduction").default('0').notNull(),
	ld: numeric().default('0').notNull(),
	slaPenalty: numeric("sla_penalty").default('0').notNull(),
	penalty: numeric().default('0').notNull(),
	otherDeduction: numeric("other_deduction").default('0').notNull(),
	totalDeduction: numeric("total_deduction").default('0').notNull(),
	netPayable: numeric("net_payable").default('0').notNull(),
	status: status().notNull(),
	amountPaidByClient: numeric("amount_paid_by_client").default('0').notNull(),
	paymentDate: date("payment_date"),
	balance: numeric().default('0').notNull(),
	remarks: text(),
	userId: uuid("user_id"),
});

export const usersAuth = pgTable("users_auth", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	password: varchar({ length: 255 }).notNull(),
	role: varchar({ length: 50 }).default('user'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	projectRole: text("project_role"),
}, (table) => [
	unique("users_auth_email_unique").on(table.email),
]);
