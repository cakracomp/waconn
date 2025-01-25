module.exports = {
    apps: [
        {
            name: "app",
            script: "./app.js",
            watch: true,
            ignore_watch: ["node_modules", "whatsapp-session.json", "logs"],
            watch_options: {
                followSymlinks: false,
            },
        },
    ],
};
// JavaScript source code
