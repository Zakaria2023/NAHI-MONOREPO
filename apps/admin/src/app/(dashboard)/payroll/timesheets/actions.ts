"use server";

import { recordAttendance } from "services";
import { attendanceSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const recordAttendanceAction = async (_prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => recordAttendance(actor, input), { schema: attendanceSchema, success: "Attendance recorded" });
