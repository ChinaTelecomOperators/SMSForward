require('dotenv').config()

const notifier = require('node-notifier')
const _ = require('lodash')

const io = require('socket.io-client')

const {SERVER, MAX_LENGTH } = process.env
const socket = io.connect(
  SERVER,
  { reconnect: true,  transports: [ 'websocket', 'polling' ]  }
)

socket.on('connect',  () => {
  const engine = socket.io.engine;
  console.log(`Connected! ${engine.transport.name}`)
})
socket.on('event', async (data) => {
  const { default: clipboardy } = await import('clipboardy')

  console.log(`data`, data)
  const { title, body, autoCopy, copy, ...opts } = data

  let copyTooLong = _.size(copy) > MAX_LENGTH
  const shouldAutoCopy = !copyTooLong && autoCopy && String(await clipboardy.readSync()) !== String(copy)

  let copyBtn = '复制'
  let fullBtn = '显示全部'

  const fullNotify = async () => {
    notifier.notify({
      ...opts,
      title,
      message: _.truncate(body, {
        length: MAX_LENGTH,
        omission: '...',
      }),
      actions: [copyBtn]
    },  async (error, response, metadata) => {
      // console.log(response, metadata);
      if (response === 'activate' && _.get(metadata, 'activationValue') === copyBtn) {
        await copyNotify()
      }
    })
  }
  const copyNotify = async () => {
    await clipboardy.writeSync(copy)
    notifier.notify({
      ...opts,
      title: '已复制',
      message: copy,
      actions: [fullBtn],
      
    },  async (error, response, metadata) => {
      // console.log(response, metadata);
      if (response === 'activate' && _.get(metadata, 'activationValue') === fullBtn) {
        await fullNotify()
      }
    })
  }
  await fullNotify()
  if (shouldAutoCopy) {
    await copyNotify()
  }
})

socket.on('disconnect',  () => {
  console.log(`disconnect`)
})
socket.on('error', e => {
  console.error(`error`, e)
})