const { spawn } = require("child_process")

/**
 * 运行外部命令，输出透传
 * @param {string} cmd
 * @param {string[]} args
 * @returns {Promise<void>}
 */
function run(cmd, args) {
	return new Promise((resolve, reject) => {
		const p = spawn(cmd, args, { stdio: "inherit" })
		p.on("close", code => {
			if (code === 0) resolve()
			else
				reject(new Error(`${cmd} ${args.join(" ")} exited with code ${code}`))
		})
		p.on("error", err => reject(err))
	})
}

/**
 * 生成UTC时间戳文件名
 * @returns {string} UTC时间戳文件名
 */
function createZipFileName(type) {
	const dateStr = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "_")
	return `${type}_${dateStr}.zip`
}

// 定义颜色常量
const colors = {
	reset: "\x1b[0m",
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
}

function log(color, ...args) {
	// 如果第一个参数不是颜色，则使用默认颜色
	if (typeof color !== "string" || !colors[color]) {
		// 第一个参数不是颜色，恢复原来的行为
		console.log(new Date().toISOString(), color, ...args)
	} else {
		// 使用指定颜色
		console.log(
			colors.reset + new Date().toISOString() + colors.reset,
			colors[color] + args.join(" ") + colors.reset
		)
	}
}

module.exports = { run, createZipFileName, log }
