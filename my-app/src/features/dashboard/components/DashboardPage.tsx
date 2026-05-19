import { useCallback, useEffect, useState } from "react";

import UserCard from "./UserCard";
import UserForm from "./UserForm";

import {
  deleteUser,
  getAllUsers,
  type Person,
} from "../services/personService";

function DashboardPage() {
  const [users, setUsers] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    try {
      const data = await getAllUsers();

      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleDeleteUser(
    personId: number
  ) {
    try {
      await deleteUser(personId);

      await loadUsers();
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  if (loading) {
    return <p>Loading users...</p>;
  }

  return (
    <div>
      <h1>Users</h1>

      <UserForm onUserCreated={loadUsers} />

      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onDelete={handleDeleteUser}
              onUpdated={loadUsers}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default DashboardPage;