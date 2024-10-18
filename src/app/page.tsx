import { UserButton } from "@clerk/nextjs";
import { api, HydrateClient } from "~/trpc/server";

export default async function Home() {
  const data = await api.student.getStudents();

  return (
    <HydrateClient>
      <div className="flex h-screen justify-center bg-background">
        <div className="container h-full px-2">
          <header className="flex flex-row items-center justify-between py-2">
            <h1 className="text-xl font-bold">Borbon ID System</h1>
            <HeaderIcons />
          </header>
          <main>{data.map((d) => d.fullName)}</main>
        </div>
      </div>
    </HydrateClient>
  );
}

const HeaderIcons = async () => {
  const userButtonAppearance = {
    elements: {
      userButtonAvatarBox: "w-10 h-10", // Custom width and height
      userButtonOuterIdentifier: "text-xl",
    },
  };
  return <UserButton showName appearance={userButtonAppearance} />;
};
