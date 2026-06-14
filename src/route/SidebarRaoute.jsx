import { lazy } from "react";
import {
  FaCoins,
  FaUsers,
  FaBox,
  FaTachometerAlt,
  FaShoppingCart,
  FaEnvelopeOpenText,
  FaImages,
  FaBlog,
  FaVideo,
  FaMoneyBillWave,
  FaUserCircle,
  FaHome,
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
const Enquiries    = lazy(() => import("../pages/Enquiries"));
const Sliders      = lazy(() => import("../pages/Sliders"));
const ReviewVideos = lazy(() => import("../pages/ReviewVideos"));
const Blogs        = lazy(() => import("../pages/Blogs"));
const Users        = lazy(() => import("../pages/Users"));
const UserDetail   = lazy(() => import("../pages/UserDetail"));
const PayMethods   = lazy(() => import("../pages/PayMethods"));
const Profile      = lazy(() => import("../pages/Profile"));
const Rooms        = lazy(() => import("../pages/Rooms"));

const routes = [
  { path: "/dashboard",     component: Dashboard,    name: "Dashboard",     icon: FaTachometerAlt },
  { path: "/users",         component: Users,        name: "Users",         icon: FaUsers },
  { path: "/users/:id",     component: UserDetail,   name: "User Detail",   icon: FaUsers, hide: true },
  { path: "/rooms",         component: Rooms,        name: "Rooms",         icon: FaHome },
  { path: "/categories",    component: Categories,   name: "Categories",    icon: FaBox },
  { path: "/products",            component: Products,      name: "Products",       icon: FaBox },
  { path: "/products/add",         component: AddProduct,    name: "Add Product",    icon: FaBox, hide: true },
  { path: "/products/edit/:id",    component: EditProduct,   name: "Edit Product",   icon: FaBox, hide: true },
  { path: "/products/:id",         component: ProductDetail, name: "Product Detail", icon: FaBox, hide: true },
  { path: "/orders",        component: Orders,       name: "Orders",        icon: FaShoppingCart },
  { path: "/enquiries",     component: Enquiries,    name: "Enquiries",     icon: FaEnvelopeOpenText },
  { path: "/sliders",       component: Sliders,      name: "Sliders",       icon: FaImages },
  { path: "/review-videos", component: ReviewVideos, name: "Review Videos", icon: FaVideo },
  { path: "/pay-methods",   component: PayMethods,   name: "Pay Methods",   icon: FaMoneyBillWave },
  { path: "/profile",       component: Profile,      name: "Profile",       icon: FaUserCircle },
];

export default routes;
