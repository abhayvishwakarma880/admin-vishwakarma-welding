import http from "./http";

export const getAllRooms = async (params = {}) => {
  const { data } = await http.get("/admin/rooms", { params });
  return data;
};

export const approveRoom = async (id) => {
  const { data } = await http.put(`/admin/rooms/${id}/approve`);
  return data;
};

export const rejectRoom = async (id, reason) => {
  const { data } = await http.put(`/admin/rooms/${id}/reject`, { reason });
  return data;
};
