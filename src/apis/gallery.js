import http from "./http";

export const listGallery = async ({ page = 1, limit = 10, search = "", isActive = "", category = "" } = {}) => {
  const params = new URLSearchParams({ page, limit });
  if (search)          params.append("search", search);
  if (isActive !== "") params.append("isActive", isActive);
  if (category)        params.append("category", category);
  const { data } = await http.get(`/gallery?${params.toString()}`);
  return data;
};

export const getGalleryById = async (id) => {
  const { data } = await http.get(`/gallery/${id}`);
  return data;
};

export const createGallery = async (formData) => {
  const { data } = await http.post("/gallery/create", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const updateGallery = async (id, formData) => {
  const { data } = await http.put(`/gallery/update/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const toggleGalleryStatus = async (id) => {
  const { data } = await http.patch(`/gallery/toggle/${id}`);
  return data;
};

export const deleteGallery = async (id) => {
  const { data } = await http.delete(`/gallery/delete/${id}`);
  return data;
};
