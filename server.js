
const http = require("http");
const config = require("./config");
const handleRoutes = require("./router");

require("./activity");

const PORT = config.PORT || process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
    try {
        await handleRoutes(req, res);
    } catch (error) {
        console.error("Server Error:", error);

        if (!res.headersSent) {
            res.writeHead(500, {
                "Content-Type": "application/json"
            });

            res.end(JSON.stringify({
                error: "Internal Server Error"
            }));
        }
    }
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Handle server errors
server.on("error", (error) => {
    console.error("HTTP Server Error:", error.message);
});
