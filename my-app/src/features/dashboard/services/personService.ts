import { api } from "../../../lib/axios";

export type Person = {
  id: number;
  name: string;
  age: number | null;
};

export type CreatePersonPayload = {
  name: string;
};

export type UpdatePersonPayload = {
  name?: string;
  age?: number;
};

export async function getAllUsers(): Promise<Person[]> {
  const response = await api.get("/start/user");

  return response.data;
}

export async function getUserById(
  personId: number
): Promise<Person> {
  const response = await api.get(
    `/start/user/${personId}`
  );

  return response.data;
}

export async function createUser(
  data: CreatePersonPayload
): Promise<Person> {
  const response = await api.post(
    "/start/add_user",
    data
  );

  return response.data;
}

export async function updateUser(
  personId: number,
  data: UpdatePersonPayload
): Promise<Person> {
  const response = await api.put(
    `/start/user/${personId}`,
    data
  );

  return response.data;
}

export async function deleteUser(
  personId: number
): Promise<void> {
  await api.delete(`/start/user/${personId}`);
}