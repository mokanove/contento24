const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');

const PORT = 3000;
const httpServer = http.createServer((req, res) => {
    fs.readFile('index.html', (err, data) => {
        if (err) {
            res.writeHead(500);
            return res.end('Error loading index.html');
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(data);
    });
});

const wss = new WebSocket.Server({ server: httpServer });
function formatIP(ip) {
    if (!ip) return '未知IP';
    if (ip.startsWith('::ffff:')) {
        return `[IPv4] ${ip.substring(7)}`;
    }
    if (ip === '::1') {
        return '[IPv6] 本地回环(localhost)';
    }
    if (ip.includes(':')) {
        return `[IPv6] ${ip}`;
    }
    return `[IPv4] ${ip}`;
}

wss.on('connection', (ws, req) => {
    const clientIP = formatIP(req.socket.remoteAddress);
    console.log(`\n[系统连接] 新设备加入！来源: ${clientIP}`);
    ws.on('message', (message) => {
        try {
            const parsedData = JSON.parse(message);
            const nickname = parsedData.nickname || '匿名极客';
            const text = parsedData.text || '';

            if (!text.trim()) return;
            const broadcastPayload = JSON.stringify({
                nickname: nickname,
                text: text,
                ip: clientIP,
                time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            });

            console.log(`[消息] ${nickname}(${clientIP}): ${text}`);

            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(broadcastPayload);
                }
            });
        } catch (err) {
            console.error('解析消息失败:', err);
        }
    });

    ws.on('close', () => {
        console.log(`[系统断开] 设备离开: ${clientIP}`);
    });
});

httpServer.listen(PORT, '::', () => {
    console.log(`=================================================`);
    console.log(`🚀 世界光明网全双工聊天室已成功发射！`);
    console.log(`端口: ${PORT}`);
    console.log(`内网测试: http://localhost:${PORT}`);
    console.log(`外网测试: 请直接通过你的IP地址/域名:端口访问`);
    console.log(`=================================================`);
});
