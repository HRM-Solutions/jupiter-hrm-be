import { format } from "date-fns";
import LeaveApplication from "../models/leave_application.model.js";
import LeaveBalance from "../models/leave_balance.model.js";
import User from "../models/user.model.js";

export default class LeaveCtrl {
	static async getAllLeavesByUser(req, res) {
		const emp_id = req.user.emp_id;

		LeaveApplication.getByEmployeeID(emp_id, (err, result) => {
			if (err) {
				return res
					.status(500)
					.send({ error: "Something went wrong on our side." });
			}
			return res.send(
				result.map((leave) => ({
					...leave,
					date: format(leave.date, "yyyy-MM-dd"),
				}))
			);
		});
	}

	static async getLeavesToReviewBySupervisor(req, res) {
		// Grabbing the supervisor id from the decoded token.
		const supervisor_id = req.user.emp_id;

		LeaveApplication.getBySupervisorId(supervisor_id, (err, result) => {
			if (err) {
				console.log(err);
			}

			return res.send(
				result.map((leave) => ({
					...leave,
					date: format(leave.date, "yyyy-MM-dd"),
				}))
			);
		});
	}

	static async applyLeave(req, res) {
		const emp_id = req.user.emp_id;

		let { startDate, endDate } = req.body;

		startDate = new Date(startDate);
		endDate = new Date(endDate);

		while (startDate.getTime() <= endDate.getTime()) {
			// Looping through dates skipping sunday.
			if (startDate.getDay() !== 0) {
				const date_formatted = format(startDate, "yyyy-MM-dd");

				const application = new LeaveApplication({
					date: date_formatted,
					...req.body,
					emp_id,
					status: "pending",
				});

				application.create((err, result) => {
					if (err) {
						if (err) console.log(err);
					}
					console.log(result);
				});
			}

			startDate.setDate(startDate.getDate() + 1);
		}

		return res.send({ status: "Successfully created leave entries.!" });
	}

	static async reviewLeave(req, res) {
		const { leave_id, action } = req.body;

		LeaveApplication.takeAction(leave_id, action, (err, result) => {
			if (err) {
				return res
					.status(500)
					.send({ error: "something went wrong on our side." });
			}

			return res.send(result);
		});
	}

	static async deleteLeave(req, res) {
		console.log(req.params);
		const leave_id = req.params.id;
		const emp_id = req.user.emp_id;

		LeaveApplication.delete(leave_id, emp_id, (err, result) => {
			if (err) {
				console.log(err);
				return res
					.status(500)
					.send({ error: "Something went wrong on our side." });
			}

			return res.send(result);
		});
	}

	static async getLeaveBalance(req, res) {
		const { emp_id, leave_type } = req.body;

		LeaveBalance.getCount(emp_id, leave_type, (err, result) => {
			if (err) {
				console.log(err);
				return res.status(500).send({ error: "Error retrieving leave count." });
			}

			return res.send(result);
		});
	}

	static async getAllocatedLeaves(req, res) {
		const { emp_id, leave_type } = req.body;

		LeaveBalance.getTotal(emp_id, leave_type, (err, result) => {
			if (err) {
				console.log(err);
				return res.status(500).send({ error: "Error retrieving leave count." });
			}

			return res.send(result);
		});
	}
}
