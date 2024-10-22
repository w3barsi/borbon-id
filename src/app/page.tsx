import { UserButton } from "@clerk/nextjs";
import { Container } from "~/components/container";
import { Input } from "~/components/ui/input";
import { api, HydrateClient } from "~/trpc/server";

import CreateStudentDialog from "./create-dialog";
import DataTable from "./data-table";
import Header from "./header";
import ViewPhotoDialog from "./view-photo-dialog";

export default async function Home() {
  void api.student.getStudents.prefetch();

  return (
    <HydrateClient>
      <Header />
      <Container className="md:flex md:justify-end">
        <CreateStudentDialog />
        <ViewPhotoDialog />
      </Container>
      <Container>
        <DataTable />
      </Container>
    </HydrateClient>
  );
}
