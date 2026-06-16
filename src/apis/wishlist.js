import http from "./http";

export const adminGetAllWishlists = async ({ page = 1, limit = 10, search = "" } = {}) => {
  const params = new URLSearchParams({ page, limit });
  if (search) params.append("search", search);
  const { data } = await http.get(`/wishlist/admin/all?${params.toString()}`);
  return data;
};

export const adminGetWishlistById = async (id) => {
  const { data } = await http.get(`/wishlist/admin/${id}`);
  return data;
};

export const adminDeleteWishlist = async (id) => {
  const { data } = await http.delete(`/wishlist/admin/${id}`);
  return data;
};
