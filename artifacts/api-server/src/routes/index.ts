import { Router, type IRouter } from "express";
import healthRouter from "./health";
import marketRouter from "./market";
import forecastRouter from "./forecast";
import agentsRouter from "./agents";
import aggregationRouter from "./aggregation";
import reasoningRouter from "./reasoning";
import decisionRouter from "./decision";

const router: IRouter = Router();

router.use(healthRouter);
router.use(marketRouter);
router.use(forecastRouter);
router.use(agentsRouter);
router.use(aggregationRouter);
router.use(reasoningRouter);
router.use(decisionRouter);

export default router;
