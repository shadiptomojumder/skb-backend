import express from "express";

import { AuthRoutes } from "@/modules/auth/auth.route";
import { CategoryRoutes } from "@/modules/categories/categories.route";
import { ProductRoutes } from "@/modules/product/product.route";
import { UserRoutes } from "@/modules/user/user.route";

const router = express.Router();

const moduleRoutes = [
    // ... routes
    {
        path: "/user",
        route: UserRoutes,
    },
    {
        path: "/auth",
        route: AuthRoutes,
    },
    {
        path: "/product",
        route: ProductRoutes,
    },
    {
        path: "/categories",
        route: CategoryRoutes,
    },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));
export default router;
