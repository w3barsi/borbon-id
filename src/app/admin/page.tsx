import { currentUser } from "@clerk/nextjs/server";
import { Container } from "~/components/container";
import { api, HydrateClient } from "~/trpc/server";
import { redirect } from "next/navigation";
import React from "react";

import Header from "../header";
import DataTable from "./table";

export const dynamic = "force-dynamic";

const allowedUsers = [
  "user_2nKMOf6hWjwXRhvspf1khf0NOSc",
  "user_2nmQLK32pORSbgMDL2Sv5lIvLEv",
];

export default async function AdminPage() {
  const user = await currentUser();
  if (!user) return redirect("/");

  if (!allowedUsers.includes(user.id)) {
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
