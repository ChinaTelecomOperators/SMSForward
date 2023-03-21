require('dotenv').config()
const _ = require('lodash')
const bodyParser = require('body-parser')
const app = require('express')()
const http = require('http').Server(app)
const io = require('socket.io')(http)

const { TOKEN, HOST, PORT } = process.env
io.use((socket, next) => {
  let token = socket.handshake.query.token
  if (token !== TOKEN)
    return next(new Error('invalid token'))
  return next()
})

io.on('connection', socket => {
  console.log('connection')
})

app.get('*', bodyParser.json(), async (req, res) => {
  const { path, query} = req
  console.log(`path`, path)
  console.log(`query`, query)
  const matched = path.match(/\/(.*?)\/(.*?)\/(.*)/i)
  console.log(`matched`, matched)
  let [__, token, title, body] = matched
  token = decodeURIComponent(token)
  title = decodeURIComponent(title)
  body = decodeURIComponent(body)
  console.log(`token`, token)
  console.log(`title`, title)
  console.log(`body`, body)

  if (token !== TOKEN)
    return res.status(403).send({ error: 'invalid token' })
  try {
    
    const data = { title, body, ...query }
    io.emit('event', data)
    console.log(`emit`, data)

    res.send({
      "code": 200,
      "message": "success",
      "timestamp": Math.round(new Date().getTime()/1000)
    })
  } catch (e) {
    res.status(500).send({
      "code": 500,
      "message": `${_.get(e, "message") || e}`,
      "timestamp": Math.round(new Date().getTime()/1000)
    })
  }
})

http.listen(PORT, HOST, () => {
  console.log(`listening on ${HOST}:${PORT}`)
})