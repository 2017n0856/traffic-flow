export type UserRecord = {
  id: string;
  email: string;
  phone: string;
  name: string;
  password: string;
};

export type PublicUser = Pick<UserRecord, "id" | "email" | "phone" | "name">;
