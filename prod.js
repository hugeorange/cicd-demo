const { deploy } = require("./deploy.cjs")

/**
 * prod 部署函数写在这里
 */
deploy("prod", {
	KEY_PATH: "deploy/prod-aws.pem", // SSH 私钥，production需要将其 ignore,
	REMOTE_USER: "ubuntu",
	REMOTE_HOST: "xxx.us-east-2.compute.amazonaws.com",
	REMOTE_BASE: "/var/www/admin-v4",
})
