const { deploy } = require("./deploy.cjs")

deploy("demo", {
	KEY_PATH: "deploy/demo-google-cloud.pem", // SSH 私钥，production需要将其 ignore,
	REMOTE_USER: "lei",
	REMOTE_HOST: "35.238.xx",
	REMOTE_BASE: "/var/www/hello",
})
