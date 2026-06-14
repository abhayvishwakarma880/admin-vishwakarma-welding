import http from "./http";

export const getCategories = async ({ page = 1, limit = 10, search = "", isActive = "" } = {}) => {
  const params = new URLSearchParams({ page, limit });
  if (search)            params.append("search", search);
  if (isActive !== "")   params.append("isActive", isActive);
  const { data } = await http.get(`/category/all?${params.toString()}`);
  return data;
};

export const getCategoryById = async (id) => {
  const { data } = await http.get(`/category/${id}`);
  return data;
};

export const createCategory = async (formData) => {
  const { data } = await http.post("/category/create", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const updateCategory = async (id, formData) => {
  const { data } = await http.put(`/category/update/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const deleteCategory = async (id) => {
  const { data } = await http.delete(`/category/delete/${id}`);
  return data;
};
