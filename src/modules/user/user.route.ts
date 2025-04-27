import auth from "@/middlewares/auth";
import { upload } from "@/middlewares/multer.middleware";
import { UserController } from "@/user/user.controller";
import express, { Router } from "express";
import { ENUM_USER_ROLE } from "../../enums/user";

const router = express.Router();
//  auth(ENUM_USER_ROLE.ADMIN)

// Route to get all users
router.get("/all", UserController.getAllUser);

// Route to get a user by ID
router.get("/:id", UserController.getOneUser);

// Route to Update an User
router.patch("/:userId", upload.single("avatar"), UserController.updateUser);

export const UserRoutes: Router = router;
