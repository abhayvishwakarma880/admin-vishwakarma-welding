import http from "./http";

export const getAllContacts = async ({ page = 1, limit = 10, search = "", isRead = "" } = {}) => {
  const params = new URLSearchParams({ page, limit });
  if (search)          params.append("search", search);
  if (isRead !== "")   params.append("isRead", isRead);
  const { data } = await http.get(`/contact?${params.toString()}`);
  return data;
};

export const deleteContact = async (id) => {
  const { data } = await http.delete(`/contact/delete/${id}`);
  return data;
};

export const markContactRead = async (id, isRead) => {
  const { data } = await http.put(`/contact/update/${id}`, { isRead });
  return data;
};
