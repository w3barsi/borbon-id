import { cn } from "~/lib/utils";
import React, { type ReactNode } from "react";

export function Container(props: { children: ReactNode; className?: string }) {
  return (
    <div className="flex w-full justify-center">
      <div className={cn(["container w-full p-2", props.className])}>
        {props.children}
      </div>
    </div>
  );
}
