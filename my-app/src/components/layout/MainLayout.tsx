import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

function MainLayout({ children }: Props) {
  return (
    <div>
      <nav
        style={{
          padding: "1rem 2rem",
          background: "#111",
          color: "white",
        }}
      >
        <h2>Person Manager</h2>
      </nav>

      <main
        style={{
          padding: "2rem",
        }}
      >
        {children}
      </main>
    </div>
  );
}

export default MainLayout;