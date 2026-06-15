import http from "./http";

export const getAllSliders = async ({ page = 1, limit = 10, isActive = "" } = {}) => {
  const params = new URLSearchParams({ page, limit });
  if (isActive !== "") params.append("isActive", isActive);
  const { data } = await http.get(`/slider?${params.toString()}`);
  return data;
};

export const createSlider = async (formData) => {
  const { data } = await http.post("/slider/create", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const updateSlider = async (id, formData) => {
  const { data } = await http.put(`/slider/update/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const toggleSliderStatus = async (id) => {
  const { data } = await http.patch(`/slider/toggle/${id}`);
  return data;
};

export const deleteSlider = async (id) => {
  const { data } = await http.delete(`/slider/delete/${id}`);
  return data;
};
