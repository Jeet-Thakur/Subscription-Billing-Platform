import { useState } from "react";

import {
  updateUser,
  type Person,
} from "../services/personService";

type Props = {
  user: Person;
  onDelete: (personId: number) => Promise<void>;
  onUpdated: () => Promise<void>;
};

function UserCard({
  user,
  onDelete,
  onUpdated,
}: Props) {
  const [editing, setEditing] = useState(false);

  const [name, setName] = useState(user.name);

  const [age, setAge] = useState(
    user.age?.toString() ?? ""
  );

  const [loading, setLoading] = useState(false);

  async function handleUpdate() {
    try {
      setLoading(true);

      const payload: {
        name?: string;
        age?: number;
      } = {};

      if (name.trim() !== user.name) {
        payload.name = name;
      }

      if (
        age !== "" &&
        Number(age) !== user.age
      ) {
        payload.age = Number(age);
      }

      await updateUser(user.id, payload);

      setEditing(false);

      await onUpdated();
    } catch (error) {
      console.error("Failed to update user:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        padding: "1rem",
        border: "1px solid #ccc",
        borderRadius: "8px",
        background: "white",
      }}
    >
      {editing ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <input
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
          />

          <input
            type="number"
            value={age}
            onChange={(e) =>
              setAge(e.target.value)
            }
            placeholder="Age"
          />

          <div
            style={{
              display: "flex",
              gap: "0.5rem",
            }}
          >
            <button
              onClick={handleUpdate}
              disabled={loading}
            >
              Save
            </button>

            <button
              onClick={() =>
                setEditing(false)
              }
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <h3>{user.name}</h3>

          <p>
            Age:{" "}
            {user.age ?? "Not specified"}
          </p>

          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginTop: "1rem",
            }}
          >
            <button
              onClick={() =>
                setEditing(true)
              }
            >
              Edit
            </button>

            <button
              onClick={() =>
                onDelete(user.id)
              }
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default UserCard;