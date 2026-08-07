#!/usr/bin/env bash
# start-library.command
# Double-clickable macOS launcher: starts a local HTTP server and opens
# the e-book library in your default browser. Run once; ctrl-c to stop.
set -e
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$DIR"
PORT="${1:-8765}"
echo "📚 启动 IELTI 电子书图书馆..."
echo "   工作目录: $DIR"
echo "   端口:     $PORT"
echo
echo "打开浏览器访问 http://localhost:$PORT/ielts-ebook-library.html"
echo "按 Ctrl-C 关闭服务器。"
echo
# Open the browser shortly after the server starts.
(sleep 1 && open "http://localhost:$PORT/ielts-ebook-library.html") &
exec python3 -m http.server "$PORT"
