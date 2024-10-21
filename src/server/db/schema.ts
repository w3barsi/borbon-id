// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { relations, sql } from "drizzle-orm";
import { index, int, sqliteTableCreator, text } from "drizzle-orm/sqlite-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = sqliteTableCreator((name) => `borbon-id_${name}`);

const timestamp = {
  createdAt: int("created_at", { mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: int("updated_at", { mode: "timestamp" }).$onUpdate(
    () => new Date(),
  ),
};

export const students = createTable("student", {
  id: int("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  lrn: text("lrn", { length: 256 }),
  grade: int("grade", { mode: "number" }),
  section: text("section"),
  fullName: text("full_name"),

  emergencyName: text("emergency_name"),
  emergencyNumber: text("emergency_number"),
  emergencyAddress: text("emergency_address"),

  createdById: text("created_by").notNull(),
  createdByName: text("created_by_name").notNull(),

  ...timestamp,
});

export const studentRelations = relations(students, ({ one }) => ({
  picture: one(pictures),
  signature: one(signatures),
}));

export const pictures = createTable("pictures", {
  studentId: int("student_id").references(() => students.id),
  key: text("key", { length: 256 }).unique().primaryKey(),
  // name of file
  name: text("name", { length: 256 }),
  type: text("type", { length: 256 }),
  url: text("url"),
});

export const picturesRelation = relations(pictures, ({ one }) => ({
  student: one(students, {
    fields: [pictures.studentId],
    references: [students.id],
  }),
}));

export const signatures = createTable("signatures", {
  studentId: int("student_id").references(() => students.id),
  key: text("key", { length: 256 }).unique().primaryKey(),
  // name of file
  name: text("name", { length: 256 }),
  type: text("type", { length: 256 }),
  url: text("url"),
});

export const signaturesRelation = relations(signatures, ({ one }) => ({
  student: one(students, {
    fields: [signatures.studentId],
    references: [students.id],
  }),
}));
