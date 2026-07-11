import { currentUser } from "@clerk/nextjs/server";
import { Container } from "~/components/container";
import { isAdmin } from "~/server/admin";
import { api, HydrateClient } from "~/trpc/server";
import { redirect } from "next/navigation";
import React from "react";

import Header from "../header";
import DataTable from "./table";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await currentUser();
  if (!user) return redirect("/");

  if (!isAdmin(user.id)) {
    return <Container>Cannot access page as {user?.id}</Container>;
  }

  void api.student.getStudents.prefetch();
  return (
    <HydrateClient>
      <Header />
      <DataTable />
    </HydrateClient>
  );
}
