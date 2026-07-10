import { Container } from "~/components/container";
import { api, HydrateClient } from "~/trpc/server";

import CreateStudentDialog from "./create-dialog";
import DataTable from "./data-table";
import Header from "./header";
import ViewPhotoDialog from "./view-photo-dialog";

export const dynamic = "force-dynamic";

export default async function Home() {
  void api.student.getStudents.prefetch();

  return (
    <HydrateClient>
      <Header />
      <Container>
        <DataTable
          actions={
            <>
              <CreateStudentDialog />
              <ViewPhotoDialog />
            </>
          }
        />
      </Container>
    </HydrateClient>
  );
}
