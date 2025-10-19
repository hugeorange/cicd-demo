/**
 *
 * ssh -i deploy/demo-aws.pem ubuntu@ec2-xxx.amazonaws.com
 *
 * 一体化打包 + 部署脚本
 *
 * 步骤：
 * 1. 清除当前目录下所有 .zip（非 deploy/ 子目录下的）
 * 2. 把本地 build/ 目录打包成 deploy/<timestamp>.zip
 * 3. scp 直接上传到远端 /var/www/admin-v4/
 * 4. 远端执行：
 *    - 删除旧的 zip 文件（保留 MAX_ZIP_FILES 个）
 *    - 删除旧的 build/ 目录
 *    - 解压新 zip 为 build/
 * 5. 可选设置权限为 www-data
 *
 */

const fs = require("fs")
const path = require("path")
const { createZip } = require("./zip.cjs")
const { run, log } = require("./helper.cjs")

const UNZIP_DIR = "build" // 解压后的目录名
const MAX_ZIP_FILES = 5 // 保留的最大zip文件数量

/**
 *
 * @param {string} type demo / prod
 * @param {*} param1
 * @param {string} param1.KEY_PATH ssh 私钥
 * @param {string} param1.REMOTE_USER ssh 用户名
 * @param {string} param1.REMOTE_HOST ssh 主机
 * @param {string} param1.REMOTE_BASE 目标目录
 */

async function deploy(
	type,
	{ KEY_PATH, REMOTE_USER, REMOTE_HOST, REMOTE_BASE }
) {
	try {
		// 环境前置检查
		if (!fs.existsSync(KEY_PATH)) {
			log("red", `❌ 私钥文件不存在: ${KEY_PATH}`)
			process.exit(1)
		}

		// 检查并设置私钥文件权限
		log("blue", "🔐 检查私钥文件权限...")
		try {
			// 设置私钥文件权限为600（只有所有者可读写）
			fs.chmodSync(KEY_PATH, 0o600)
		} catch (err) {
			log("yellow", `⚠️ 设置私钥文件读取权限失败: ${err.message}`)
			process.exit(1)
		}

		// 1. 打包
		const zipPath = await createZip(type)
		const zipName = path.basename(zipPath)
		log(`zipPath: ${zipPath}`)

		// 2. 上传 zip 到远端 /var/www/admin-v4/
		log("yellow", `📤 上传 zip 到远端目标目录: ${REMOTE_BASE}/`)
		await run("scp", [
			"-i",
			KEY_PATH,
			zipPath,
			`${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_BASE}/`,
		])

		// 3. 远端操作：保留最新 5 个zip文件（方便回滚操作）, 删除旧 build/，解压新 zip
		log("blue", "🛠 远端执行部署操作...")
		const remoteScript = `
			# bash脚本的安全设置组合
      set -euo pipefail
      cd "${REMOTE_BASE}"

			echo "🧹 清理旧zip文件, 只保留最新${MAX_ZIP_FILES}个"
      # 列出所有.zip文件, 按修改时间排序, 删除超过${MAX_ZIP_FILES}个的旧文件
      ls -t *.zip 2>/dev/null | tail -n +$((${MAX_ZIP_FILES} + 1)) | xargs -r rm -f

      echo "📋 当前保留的zip文件, 必要时进行回滚操作, 如: sudo unzip -q 202508061159.zip -d build/ "
      ls -la *.zip 2>/dev/null || echo "没有zip文件"

      echo "🧹 删除旧的 ${UNZIP_DIR}/ 目录"
      sudo rm -rf "${UNZIP_DIR}"

      echo "📦 解压 ${zipName} 到 ${UNZIP_DIR}/"  
      sudo unzip -q "${zipName}" -d "${UNZIP_DIR}"

      echo "🔧 设定权限"
      sudo chown -R www-data:www-data "${UNZIP_DIR}" || true
    `

		await run("ssh", [
			"-i",
			KEY_PATH,
			`${REMOTE_USER}@${REMOTE_HOST}`,
			remoteScript,
		])

		log("green", `✅ 全流程部署完成，远端路径：${REMOTE_BASE}/${UNZIP_DIR}`)
	} catch (err) {
		log("red", `部署失败: ${err.message}`)
		process.exit(1)
	}
}

module.exports = { deploy }
