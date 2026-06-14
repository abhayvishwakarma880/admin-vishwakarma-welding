import http from "./http";

export const getAllUsers = async ({ page = 1, limit = 10, search = "", isActive = "" } = {}) => {
  const params = new URLSearchParams({ page, limit });
  if (search)   params.append("search", search);
  if (isActive !== "") params.append("isActive", isActive);
  const { data } = await http.get(`/users?${params.toString()}`);
  return data;
};

export const getUserById = async (id) => {
  const { data } = await http.get(`/users/${id}`);
  return data;
};
