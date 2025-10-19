const fs = require('fs')
const fsp = require('fs/promises')
const path = require('path')
const archiver = require('archiver')
const { createZipFileName } = require('./helper.cjs')

async function createZip(type) {
  const srcDir = '../restaurant-site-v3'
  const zipName = createZipFileName(`restaurant-site-v3_${type}`)

  return new Promise(async (resolve, reject) => {
    const absSrcDir = path.resolve(srcDir)
    const tempZipPath = path.resolve(`../${zipName}`) // 临时 ZIP 路径
    const targetZipPath = path.join(absSrcDir, 'deploy', zipName) // 目标 ZIP 路径

    await deleteDeployZips(absSrcDir)

    const output = fs.createWriteStream(tempZipPath)
    const archive = archiver('zip', { zlib: { level: 1 } }) // 1 = 快速压缩

    output.on('close', async () => {
      console.log(`✅ 完成: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`)

      // 移动 ZIP 文件到 deploy/ 目录
      await fsp.rename(tempZipPath, targetZipPath)
      console.log(`📦 打包文件已移动到: ${targetZipPath}`)
      resolve(targetZipPath)
    })

    archive.on('error', reject)
    archive.pipe(output)

    archive.on('progress', () => {
      process.stdout.write(
        `\r📦 进度: ${(archive.pointer() / 1024 / 1024).toFixed(2)}MB`,
      )
    })

    // 使用 glob 模式排除 deploy 目录
    archive.glob('**/*', {
      cwd: path.resolve(srcDir),
      ignore: [
        'deploy/**',
        '.git/**',
        '.vscode/**',
        '.commitlintrc.js',
        '.eslintrc.js',
        '.eslintignore',
        '.gitignore',
        '.prettierrc.js',
        '.prettierignore',
        '.stylelintrc',
        'tsconfig.json',
        'jest.config.js',
        'settings.json',
        'README.md',
        'package-lock.json',
        '.DS_Store',
      ], // 排除 deploy 目录和可能存在的 zip 文件
      dot: true, // 包含隐藏文件
    })
    archive.finalize()
  })
}

module.exports = { createZip }
// 示例调用
// createZip('../restaurant-site-v3', createZipFileName('demo-restaurant-site-v3'))

/**
 * 删除 restaurant-site-v3/deploy/ 目录下的所有 ZIP 文件
 * @param {string} projectDir - 项目根目录（如 '../restaurant-site-v3'）
 */
async function deleteDeployZips(projectDir) {
  const deployDir = path.join(projectDir, 'deploy')

  try {
    // 1. 检查 deploy 目录是否存在
    await fsp.access(deployDir)

    // 2. 读取 deploy 目录下的所有文件
    const files = await fsp.readdir(deployDir)

    // 3. 过滤出 .zip 文件
    const zipFiles = files.filter(file => file.endsWith('.zip'))

    if (zipFiles.length === 0) {
      console.log(' deploy/ 目录下没有 ZIP 文件可删除')
      return
    }

    // 4. 逐个删除 ZIP 文件
    await Promise.all(
      zipFiles.map(async file => {
        const filePath = path.join(deployDir, file)
        await fsp.unlink(filePath)
        console.log(`🗑️ 已删除: ${filePath}`)
      }),
    )

    console.log(`✅ 已清理 ${zipFiles.length} 个 ZIP 文件`)
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log('deploy/ 目录不存在，无需清理')
    } else {
      console.error('❌ 删除 ZIP 文件失败:', err)
      throw err
    }
  }
}
