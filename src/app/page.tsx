import { DataTable } from "./data-table";
import { columns } from "./columns";
import { getData } from "./actions";
import { api } from "~/trpc/server";

export default async function Home() {
  const data = await api.student.getStudents();
  return (
    <div className="flex h-screen justify-center bg-background">
      <div className="container px-2 md:p-0">
        <DataTable columns={columns} data={data} />
      </div>
    </div>
  );
}
