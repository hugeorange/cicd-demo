const fs = require("fs")
const path = require("path")
const archiver = require("archiver")
const { createZipFileName, log } = require("./helper.cjs")

const LOCAL_BUILD_DIR = "build" // 本地要打包的目录
const ZIP_OUTPUT_DIR = "deploy" // zip 存放目录

/**
 * 打包 build/ 目录为带时间戳 zip
 * @param {string} type demo / prod
 * @returns {Promise<string>} 生成的 zip 相对路径
 */

function createZip(type) {
	return new Promise((resolve, reject) => {
		// 确保源目录存在
		if (!fs.existsSync(LOCAL_BUILD_DIR)) {
			return reject(new Error(`本地打包源目录不存在: ${LOCAL_BUILD_DIR}`))
		}

		// 清除当前目录下所有 .zip（排除 deploy/ 子目录里面的）
		try {
			const files = fs.readdirSync(__dirname)
			files.forEach(file => {
				if (path.extname(file) === ".zip") {
					fs.unlinkSync(path.join(__dirname, file))
					log("blue", `已删除旧文件: ${file}`)
				}
			})
		} catch (err) {
			console.warn("red", "删除旧 zip 文件时出错:", err.message)
		}

		// 确保输出目录存在
		if (!fs.existsSync(ZIP_OUTPUT_DIR)) {
			fs.mkdirSync(ZIP_OUTPUT_DIR, { recursive: true })
		}

		const fullZipPath = path.join(ZIP_OUTPUT_DIR, createZipFileName(type))

		const output = fs.createWriteStream(fullZipPath)
		const archive = archiver("zip", { zlib: { level: 9 } })

		output.on("close", function () {
			const size = (archive.pointer() / 1024).toFixed(0)
			log("green", `压缩完毕，共 ${size} KB。生成的文件: ${fullZipPath}`)
			resolve(fullZipPath)
		})

		archive.on("error", function (err) {
			reject(err)
		})

		archive.pipe(output)
		archive.directory(LOCAL_BUILD_DIR + "/", false) // 把 build/ 下的内容平铺压进去
		archive.finalize()
	})
}

module.exports = { createZip }
