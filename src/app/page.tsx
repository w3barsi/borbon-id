import { UserButton } from "@clerk/nextjs";
import { Container } from "~/components/container";
import { Input } from "~/components/ui/input";
import { api, HydrateClient } from "~/trpc/server";

import { CreateStudentDialog } from "./create-dialog";
import DataTable from "./data-table";
import EditStudentDialog from "./edit-dialog";
import Header from "./header";

export default async function Home() {
  void api.student.getStudents.prefetch();

  return (
    <HydrateClient>
      <Header />
      <Container>
        <CreateStudentDialog />
        <EditStudentDialog />
      </Container>
      <Container>
        <DataTable />
      </Container>
    </HydrateClient>
  );
}
