import { ClerkLoaded, ClerkLoading, UserButton } from "@clerk/nextjs";
import { Container } from "~/components/container";

export default function Header() {
  const userButtonAppearance = {
    elements: {
      userButtonAvatarBox: "w-10 h-10", // Custom width and height
      userButtonOuterIdentifier: "text-xl",
    },
  };
  return (
    <Container>
      <header className="flex h-12 items-center justify-between">
        <h1 className="text-xl font-bold">Borbon ID System</h1>
        <ClerkLoading>
          <div className="h-10 w-10 animate-pulse rounded-full bg-neutral-300"></div>
        </ClerkLoading>
        <ClerkLoaded>
          <UserButton showName appearance={userButtonAppearance} />
        </ClerkLoaded>
      </header>
    </Container>
  );
}
