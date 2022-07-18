import http from 'http'
import serveStatic from 'serve-static'
import finalhandler from 'finalhandler'

const serve = serveStatic('public')
const server = http.createServer((req, res) => serve(req, res, finalhandler(req, res)))

server.listen(9000)