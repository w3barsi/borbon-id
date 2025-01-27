import { currentUser } from "@clerk/nextjs/server";
import { Container } from "~/components/container";
import { Button } from "~/components/ui/button";
import { api, HydrateClient } from "~/trpc/server";
import { redirect } from "next/navigation";
import React from "react";

import Header from "../header";
import DataTable from "./table";

const allowedUsers = [
  "user_2nKMOf6hWjwXRhvspf1khf0NOSc",
  "user_2nmQLK32pORSbgMDL2Sv5lIvLEv",
];

export default async function AdminPage() {
  const user = await currentUser();
  void api.student.getStudents.prefetch();
  if (!user) return redirect("/");
  if (!allowedUsers.includes(user.id)) {
    return <Container>Cannot access page as {user?.id}</Container>;
  }

  return (
    <HydrateClient>
      <Header />
      <DataTable />
    </HydrateClient>
  );
}
