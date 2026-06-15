import http from "./http";

export const getAllBlogs = async ({ page = 1, limit = 10, search = "", isPublished = "", isActive = "", category = "" } = {}) => {
  const params = new URLSearchParams({ page, limit });
  if (search)      params.append("search",      search);
  if (isPublished !== "") params.append("isPublished", isPublished);
  if (isActive    !== "") params.append("isActive",    isActive);
  if (category)    params.append("category",    category);
  const { data } = await http.get(`/blog?${params.toString()}`);
  return data;
};

export const createBlog = async (formData) => {
  const { data } = await http.post("/blog/create", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const updateBlog = async (id, formData) => {
  const { data } = await http.put(`/blog/update/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const toggleBlogStatus = async (id) => {
  const { data } = await http.patch(`/blog/toggle/${id}`);
  return data;
};

export const toggleBlogPublished = async (id) => {
  const { data } = await http.patch(`/blog/publish/${id}`);
  return data;
};

export const getBlogById = async (id) => {
  const { data } = await http.get(`/blog/${id}`);
  return data;
};

export const deleteBlog = async (id) => {
  const { data } = await http.delete(`/blog/delete/${id}`);
  return data;
};
