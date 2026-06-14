import http from "./http";

export const adminLogin = async ({ email, password }) => {
  const { data } = await http.post("/admin/login", { email, password });
  return data;
};

export const updateProfile = async (payload) => {
  const { data } = await http.put("/auth/update-profile", payload);
  return data;
};
