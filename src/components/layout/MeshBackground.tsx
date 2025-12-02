import { ReactNode } from "react";

interface MeshBackgroundProps {
  children: ReactNode;
}

export function MeshBackground({ children }: MeshBackgroundProps) {
  return (
    <div className="min-h-screen mesh-gradient">
      {children}
    </div>
  );
}
