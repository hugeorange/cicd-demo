# cicd-demo
前端极简的 CICD 流程
npm 脚本 `"deploy-demo": "tsc --noEmit && vite build --mode demo && node deploy/demo.cjs"`
1. 将 build 后的 dist 目录压缩成 zip
2. 用 scp 方式将 zip 放到目标服务指定位置（对zip文件加上版本号命名）
3. 在服务器上解压 zip 文件
4. 删除历史 zip 文件（仅保留最近 5 个 方便回滚）
5. 回滚操作 `sudo unzip -q 202508061159.zip -d build/`
