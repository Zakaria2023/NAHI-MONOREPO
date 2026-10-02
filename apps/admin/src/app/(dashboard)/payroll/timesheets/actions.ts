"use server";

import { recordAttendance, saveTimesheet } from "services";
import { attendanceSchema, timesheetSchema } from "validators";
import { ActionResult } from "@/lib/action-result";
import { runAction } from "@/lib/server/run-action";

export const saveTimesheetAction = async (_prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => saveTimesheet(actor, input), { schema: timesheetSchema, success: "Timesheet saved" });

export const recordAttendanceAction = async (_prev: ActionResult, data: unknown) =>
  runAction(data, (actor, input) => recordAttendance(actor, input), { schema: attendanceSchema, success: "Attendance recorded" });
