// src/apis/admin.js
import http from "./http";

export const changePassword = async (payload) => {
  const { data } = await http.post("/admin/change-password", payload);
  return data;
};

export const getDashboardStats = async () => {
  const { data } = await http.get("/admin/stats");
  return data;
};

export const banUser = async (id, reason = "") => {
  const { data } = await http.put(`/admin/users/${id}/ban`, { reason });
  return data;
};

export const unbanUser = async (id) => {
  const { data } = await http.put(`/admin/users/${id}/unban`);
  return data;
};
