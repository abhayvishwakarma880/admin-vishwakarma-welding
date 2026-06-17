import { lazy } from "react";
import {
  FaCoins,
  FaUsers,
  FaBox,
  FaTachometerAlt,
  FaShoppingCart,
  FaAddressBook,
  FaImages,
  FaBlog,
  FaVideo,
  FaMoneyBillWave,
  FaUserCircle,
  FaPhotoVideo,
  FaHammer,
  FaHeart,
} from "react-icons/fa";

// pages
const Dashboard    = lazy(() => import("../pages/Dashboard"));
const Categories   = lazy(() => import("../pages/Categories"));
const Products     = lazy(() => import("../pages/Products"));
const AddProduct   = lazy(() => import("../pages/AddProduct"));
const EditProduct  = lazy(() => import("../pages/EditProduct"));
const ProductDetail = lazy(() => import("../pages/ProductDetail"));
const Offers       = lazy(() => import("../pages/Offers"));
const Orders       = lazy(() => import("../pages/Orders"));
const OrderView    = lazy(() => import("../pages/OrderView"));
const Contacts     = lazy(() => import("../pages/Contacts"));
const Sliders      = lazy(() => import("../pages/Sliders"));
const ReviewVideos = lazy(() => import("../pages/ReviewVideos"));
const Blogs        = lazy(() => import("../pages/Blogs"));
const BlogForm     = lazy(() => import("../pages/BlogForm"));
const Users        = lazy(() => import("../pages/Users"));
const UserDetail   = lazy(() => import("../pages/UserDetail"));
const PayMethods   = lazy(() => import("../pages/PayMethods"));
const Profile      = lazy(() => import("../pages/Profile"));
const Gallery      = lazy(() => import("../pages/Gallery"));
const RecentSideWorks   = lazy(() => import("../pages/RecentSideWorks"));
const RecentSideWorkForm = lazy(() => import("../pages/RecentSideWorkForm"));
const Wishlists          = lazy(() => import("../pages/Wishlists"));
const WishlistDetail     = lazy(() => import("../pages/WishlistDetail"));

const routes = [
  { path: "/dashboard",          component: Dashboard,     name: "Dashboard",      icon: FaTachometerAlt },
  { path: "/users",              component: Users,         name: "Users",          icon: FaUsers },
  { path: "/users/add",          component: UserDetail,    name: "Add User",       icon: FaUsers, hide: true },
  { path: "/users/edit/:id",     component: UserDetail,    name: "Edit User",      icon: FaUsers, hide: true },
  { path: "/users/:id",          component: UserDetail,    name: "User Detail",    icon: FaUsers, hide: true },
  { path: "/categories",         component: Categories,    name: "Categories",     icon: FaBox },
  { path: "/products",           component: Products,      name: "Products",       icon: FaBox },
  { path: "/products/add",        component: AddProduct,    name: "Add Product",    icon: FaBox, hide: true },
  { path: "/products/edit/:id",   component: EditProduct,   name: "Edit Product",   icon: FaBox, hide: true },
  { path: "/products/:id",        component: ProductDetail, name: "Product Detail", icon: FaBox, hide: true },
  { path: "/orders",             component: Orders,        name: "Orders",         icon: FaShoppingCart },
  { path: "/orders/:id",         component: OrderView,     name: "Order Detail",   icon: FaShoppingCart, hide: true },
  { path: "/contacts",           component: Contacts,      name: "Contacts",       icon: FaAddressBook },
  { path: "/blogs",              component: Blogs,         name: "Blogs",          icon: FaBlog },
  { path: "/blogs/add",          component: BlogForm,      name: "Add Blog",       icon: FaBlog, hide: true },
  { path: "/blogs/edit/:id",     component: BlogForm,      name: "Edit Blog",      icon: FaBlog, hide: true },
  { path: "/blogs/:id",          component: BlogForm,      name: "Blog Detail",    icon: FaBlog, hide: true },
  { path: "/sliders",            component: Sliders,       name: "Sliders",        icon: FaImages },
  { path: "/gallery",            component: Gallery,       name: "Gallery",        icon: FaPhotoVideo },
  { path: "/recent-side-works",          component: RecentSideWorks,    name: "Recent Side Works", icon: FaHammer },
  { path: "/recent-side-works/add",       component: RecentSideWorkForm, name: "Add Side Work",     icon: FaHammer, hide: true },
  { path: "/recent-side-works/edit/:id",  component: RecentSideWorkForm, name: "Edit Side Work",    icon: FaHammer, hide: true },
  { path: "/recent-side-works/:id",       component: RecentSideWorkForm, name: "View Side Work",    icon: FaHammer, hide: true },
  { path: "/wishlists",                   component: Wishlists,          name: "Wishlists",         icon: FaHeart },
  { path: "/wishlists/:id",               component: WishlistDetail,     name: "Wishlist Detail",   icon: FaHeart, hide: true },
  { path: "/review-videos",      component: ReviewVideos,  name: "Review Videos",  icon: FaVideo },
  { path: "/pay-methods",        component: PayMethods,    name: "Pay Methods",    icon: FaMoneyBillWave },
  { path: "/profile",            component: Profile,       name: "Profile",        icon: FaUserCircle },
];

export default routes;
