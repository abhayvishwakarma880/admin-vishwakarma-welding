import http from "./http";

export const getAllRecentSideWorks = async ({ page = 1, limit = 10, search = "", isActive = "", status = "", featured = "" } = {}) => {
  const params = new URLSearchParams({ page, limit });
  if (search)   params.append("search",   search);
  if (isActive !== "") params.append("isActive", isActive);
  if (status)   params.append("status",   status);
  if (featured !== "") params.append("featured", featured);
  const { data } = await http.get(`/recent-side-works?${params.toString()}`);
  return data;
};

export const getRecentSideWorkById = async (id) => {
  const { data } = await http.get(`/recent-side-works/${id}`);
  return data;
};

export const createRecentSideWork = async (formData) => {
  const { data } = await http.post("/recent-side-works/create", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const updateRecentSideWork = async (id, formData) => {
  const { data } = await http.put(`/recent-side-works/update/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const toggleRecentSideWorkStatus = async (id) => {
  const { data } = await http.patch(`/recent-side-works/toggle/${id}`);
  return data;
};

export const deleteRecentSideWork = async (id) => {
  const { data } = await http.delete(`/recent-side-works/delete/${id}`);
  return data;
};
