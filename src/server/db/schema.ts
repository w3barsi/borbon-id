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
    () => new Date()
  ),
}

export const studentsTable = createTable("student", {
  id: int("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  lrn: text("lrn", { length: 256 }),
  grade: int("grade", { mode: "number" }),
  section: text("section"),
  fullName: text("full_name"),

  emergencyName: text("emergency_name"),
  emergencyNumber: text("emergency_number"),
  emergencyAddress: text("emergency_address"),

  pictureKey: text("picture_key").references(() => filesTable.key),
  signatureKey: text("signature_key").references(() => filesTable.key),

  createdBy: text("created_by").notNull(),

  ...timestamp
})

export const studentRelations = relations(studentsTable, ({one}) => ({
  signature: one(filesTable, {
    fields: [studentsTable.signatureKey],
    references: [filesTable.key]
  }),
  picture: one(filesTable, {
    fields: [studentsTable.pictureKey],
    references: [filesTable.key]
  }),
}))

export const filesTable = createTable("file_upload", {
  for: text("for", {enum: ["picture", "signature"]}),
  key: text("key", {length:256}).unique().primaryKey(),
  // name of file
  name: text("name", {length:256}),
  type: text("type", {length:256}),
  url: text("url"),
})



export const userTable = createTable("user", {
  id: int("id", { mode: "number" }).primaryKey({ autoIncrement: true }),

  pictureKey: text("picture_key").references(() => nameTable.key),
  signatureKey: text("signature_key").references(() => nameTable.key),
})


export const nameTable = createTable("name", {
  key: text("key", {length:256}).unique().primaryKey().notNull(),
  url: text("url").notNull(),
})
