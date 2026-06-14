import http from "./http";

export const listProducts = async ({ page = 1, limit = 10, search = "", isActive = "", category = "" } = {}) => {
  const params = new URLSearchParams({ page, limit });
  if (search)           params.append("search", search);
  if (isActive !== "")  params.append("isActive", isActive);
  if (category)         params.append("category", category);
  const { data } = await http.get(`/products?${params.toString()}`);
  return data;
};

export const getProductById = async (id) => {
  const { data } = await http.get(`/products/${id}`);
  return data;
};

export const createProduct = async (formData) => {
  const { data } = await http.post("/products/create", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const updateProduct = async (id, formData) => {
  const { data } = await http.put(`/products/update/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const toggleProductStatus = async (id) => {
  const { data } = await http.patch(`/products/toggle/${id}`);
  return data;
};

export const deleteProduct = async (id) => {
  const { data } = await http.delete(`/products/delete/${id}`);
  return data;
};
