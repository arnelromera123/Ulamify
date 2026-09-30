import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ulamifyRouter from "./ulamify";

const router: IRouter = Router();

router.use(healthRouter);
router.use(ulamifyRouter);

export default router;
