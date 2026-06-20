import { warn, debug, trace, info, error } from "@tauri-apps/plugin-log";

export default {
	log: (...args: unknown[]) => {
		info(args.join(" "));
	},
	debug: (...args: unknown[]) => {
		debug(args.join(" "));
	},
	trace: (...args: unknown[]) => {
		trace(args.join(" "));
	},
	info: (...args: unknown[]) => {
		info(args.join(" "));
	},
	warn: (...args: unknown[]) => {
		warn(args.join(" "));
	},
	error: (...args: unknown[]) => {
		error(args.join(" "));
	},
};
