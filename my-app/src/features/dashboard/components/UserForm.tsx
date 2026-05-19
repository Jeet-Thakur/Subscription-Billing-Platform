import { useState } from "react";

import { createUser } from "../services/personService";

type Props = {
  onUserCreated: () => Promise<void>;
};

function UserForm({ onUserCreated }: Props) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    try {
      setLoading(true);

      await createUser({
        name,
      });

      setName("");

      await onUserCreated();
    } catch (error) {
      console.error("Failed to create user:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        gap: "1rem",
        marginBottom: "2rem",
      }}
    >
      <input
        type="text"
        placeholder="Enter name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{
          padding: "0.5rem",
        }}
      />

      <button
        type="submit"
        disabled={loading}
        style={{
          padding: "0.5rem 1rem",
          cursor: "pointer",
        }}
      >
        {loading ? "Creating..." : "Add User"}
      </button>
    </form>
  );
}

export default UserForm;