import http from "./http";

export const getOrders = async () => {
  const { data } = await http.get(`/orders`);
  return data;
};

export const getOrderById = async (id) => {
  const { data } = await http.get(`/orders/${id}`);
  return data;
};

export const updateOrder = async (id, payload) => {
  const { data } = await http.put(`/orders/${id}`, payload);
  return data;
};