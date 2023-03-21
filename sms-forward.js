const key = 'sms_forward'

const config = {
  tencent: {
    sender: 'query.sender',
    text: 'query.message.text',
  },
  360: {
    sender: 'query.sender',
    text: 'query.message.text',
  },
}
const $ = new Env(key)

const KEY_INITED = `@ChinaTelecomOperators.${key}.inited`
const KEY_TYPE = `@ChinaTelecomOperators.${key}.type`
const KEY_KEYS = `@ChinaTelecomOperators.${key}.keys`

const keys = `${$.getdata(KEY_KEYS) || ''}`
  .split(',')
  .map(i => i.trim())
  .filter(i => i.length > 0)
keys.unshift(key)
$.log(`ℹ️ 所有配置的 key: ${keys.join(', ')}`)

$.setdata(new Date().toLocaleString('zh'), KEY_INITED)

let result

!(async () => {
  const KEY_DISABLED = `@ChinaTelecomOperators.${key}.disabled`
  const disabled = $.getdata(KEY_DISABLED)

  if (String(disabled) === 'true') {
    $.log('ℹ️ 已禁用')
    return
  }
  const type = $.getdata(KEY_TYPE) || 'tencent'

  let input = $request.body
  $.log('ℹ️ 请求')
  $.log(input)
  try {
    input = JSON.parse(input)
  } catch (e) {
    console.log(e)
    throw new Error('解析请求失败')
  }
  $.log('ℹ️ 解析后的请求')
  $.log(input)
  let text
  let sender
  if (type === 'tencent') {
    text = $.lodash_get(input, $.lodash_get(config, `${type}.text`))
    sender = $.lodash_get(input, $.lodash_get(config, `${type}.sender`))
  } else if (type === '360') {
    text = $.lodash_get(input, $.lodash_get(config, `${type}.text`))
    sender = $.lodash_get(input, $.lodash_get(config, `${type}.sender`))
  } else {
    throw new Error(`不支持的类型: ${type}`)
  }
  sender = sender == null ? '' : `${sender}`
  text = text == null ? '' : `${text}`
  console.log(`号码 ${sender}`)
  console.log(`内容 ${text}`)

  const fn = async (key, index) => {
    $.log(`👉🏻 [${index}][${key}] 配置开始`)
    const KEY_DISABLED = `@ChinaTelecomOperators.${key}.disabled`
    const disabled = $.getdata(KEY_DISABLED)

    if (String(disabled) === 'true') {
      $.log(`👉🏻 [${index}][${key}] 配置已禁用`)
      return
    }

    const KEY_SENDER_ALLOW = `@ChinaTelecomOperators.${key}.sender_allow`
    const KEY_SENDER_DENY = `@ChinaTelecomOperators.${key}.sender_deny`
    const KEY_TEXT_ALLOW = `@ChinaTelecomOperators.${key}.text_allow`
    const KEY_TEXT_DENY = `@ChinaTelecomOperators.${key}.text_deny`

    const KEY_TITLE = `@ChinaTelecomOperators.${key}.title`
    const KEY_SUBTITLE = `@ChinaTelecomOperators.${key}.subtitle`
    const KEY_BODY = `@ChinaTelecomOperators.${key}.body`
    const KEY_BARK = `@ChinaTelecomOperators.${key}.bark`
    const KEY_PUSHDEER = `@ChinaTelecomOperators.${key}.pushdeer`

    const senderAllow = $.getdata(KEY_SENDER_ALLOW) || ''
    const senderAllowRegExp = new RegExp(senderAllow)
    const senderDeny = $.getdata(KEY_SENDER_DENY) || ''
    const senderDenyRegExp = new RegExp(senderDeny)
    const textAllow = $.getdata(KEY_TEXT_ALLOW) || ''
    const textAllowRegExp = new RegExp(textAllow)
    const textDeny = $.getdata(KEY_TEXT_DENY) || ''
    const textDenyRegExp = new RegExp(textDeny)

    let isSenderAllow = true
    let isTextAllow = true
    if (senderAllow) {
      console.log(`👉🏻 [${index}][${key}] 允许转发的号码的正则字符串 ${senderAllow}`)
      console.log(`👉🏻 [${index}][${key}] 允许转发的号码的正则 ${senderAllowRegExp}`)
      if (!senderAllowRegExp.test(sender)) {
        console.log(`👉🏻 [${index}][${key}] ${sender} 不符合允许转发的号码 ❌不会转发`)
        isSenderAllow = false
      }
    } else if (senderDeny) {
      console.log(`👉🏻 [${index}][${key}] 不允许转发的号码的正则字符串 ${senderDeny}`)
      console.log(`👉🏻 [${index}][${key}] 不允许转发的号码的正则 ${senderDenyRegExp}`)
      if (senderDenyRegExp.test(sender)) {
        console.log(`👉🏻 [${index}][${key}] ${sender} 符合不允许转发的号码 ❌不会转发`)
        isSenderAllow = false
      }
    }
    if (textAllow) {
      console.log(`👉🏻 [${index}][${key}] 允许转发的内容的正则字符串 ${textAllow}`)
      console.log(`👉🏻 [${index}][${key}] 允许转发的内容的正则 ${textAllowRegExp}`)
      if (!textAllowRegExp.test(text)) {
        console.log(`👉🏻 [${index}][${key}] ${text} 不符合允许转发的内容 ❌不会转发`)
        isTextAllow = false
      }
    } else if (textDeny) {
      console.log(`👉🏻 [${index}][${key}] 不允许转发的内容的正则字符串 ${textDeny}`)
      console.log(`👉🏻 [${index}][${key}] 不允许转发的内容的正则 ${textDenyRegExp}`)
      if (textDenyRegExp.test(text)) {
        console.log(`👉🏻 [${index}][${key}] ${text} 符合不允许转发的内容 ❌不会转发`)
        isTextAllow = false
      }
    }
    if (!isSenderAllow || !isTextAllow) {
      console.log('已判断号码和内容 ❌ 不会转发')
      return
    }
    const KEY_CODE_TEST = `@ChinaTelecomOperators.${key}.code_test`
    const KEY_CODE_GET = `@ChinaTelecomOperators.${key}.code_get`

    const codeTest = $.getdata(KEY_CODE_TEST) || '.+(码)'
    const codeTestRegExp = new RegExp(codeTest)
    const codeGet = $.getdata(KEY_CODE_GET) || '\\d{4,6}'
    const codeGetRegExp = new RegExp(codeGet)

    let hasCode
    let code
    if (codeTest) {
      console.log(`👉🏻 [${index}][${key}] 判断内容是否包含验证码的正则字符串 ${codeTest}`)
      console.log(`👉🏻 [${index}][${key}] 判断内容是否包含验证码的正则 ${codeTestRegExp}`)
      if (codeTestRegExp.test(text)) {
        console.log(`👉🏻 [${index}][${key}] ${text} 包含验证码 ✅`)
        hasCode = true
        if (codeGet) {
          console.log(`👉🏻 [${index}][${key}] 从内容提取验证码的正则字符串 ${codeGet}`)
          console.log(`👉🏻 [${index}][${key}] 从内容提取验证码的正则 ${codeGetRegExp}`)
          const matched = text.match(codeGetRegExp)
          if (matched) {
            code = matched[0]
            if (code) {
              console.log(`👉🏻 [${index}][${key}] ${text} 提取到验证码 ${code} ✅`)
            }
          }
        }
      }
    }
    let copy = text
    if (code) {
      console.log(`👉🏻 [${index}][${key}] 判断包含验证码 且提取到验证码 将复制验证码`)
      copy = code
    }
    console.log(`👉🏻 [${index}][${key}] 📋 复制的内容 ${copy}`)
    const msgData = {
      sender,
      text,
      hasCode,
      code,
      copy,
    }
    const titleTpl = $.getdata(KEY_TITLE) || '[号码]'
    const subtitleTpl = $.getdata(KEY_SUBTITLE) || '[码][复制提示]'
    const bodyTpl = $.getdata(KEY_BODY) || '[内容]'

    const title = renderTpl(titleTpl, msgData)
    const subtitle = renderTpl(subtitleTpl, msgData)
    const body = renderTpl(bodyTpl, msgData)

    console.log(`👉🏻 [${index}][${key}] 标题 ${title}`)
    console.log(`👉🏻 [${index}][${key}] 副标题 ${subtitle}`)
    console.log(`👉🏻 [${index}][${key}] 正文 ${body}`)

    await notify(title, subtitle, body, { copy, KEY_PUSHDEER, KEY_BARK })
    $.log(`👉🏻 [${index}][${key}] 配置结束`)
  }
  for (const [index, key] of keys.entries()) {
    await fn(key, index)
  }

  const KEY_REPLACE_NUM = `@ChinaTelecomOperators.${key}.replace_num`
  const KEY_NO_POST = `@ChinaTelecomOperators.${key}.no_post`

  const noPost = $.getdata(KEY_NO_POST)

  if (String(noPost) === 'true') {
    $.log('ℹ️ 不提交数据给腾讯/360等接口')
    result = { fuck: type }
  } else {
    $.log('ℹ️ 将提交数据给腾讯/360等接口')
    result = input
    const replaceNnum = $.getdata(KEY_REPLACE_NUM)

    if (String(replaceNnum) !== 'false') {
      $.log('ℹ️ 替换数字')
      $.log(`ℹ️ 原内容 ${text}`)
      text = text.replace(/\d/g, i => Math.floor(Math.random() * (9 - 1 + 1)) + 1)
      $.log(`🆕 新内容 ${text}`)
      if (type === 'tencent') {
        lodash_set(result, $.lodash_get(config, `${type}.text`), text)
      } else if (type === '360') {
        lodash_set(result, $.lodash_get(config, `${type}.text`), text)
      }
    }
  }
})()
  .catch(e => {
    console.log(e)
    notify(`短信转发`, `❌`, `${$.lodash_get(e, 'message') || $.lodash_get(e, 'error') || e}`, {})
  })
  .finally(() => {
    console.log(`提交给腾讯/360等接口的数据`)
    console.log(result)
    $.done(result)
  })

async function notify(title, subtitle, body, { copy, KEY_PUSHDEER, KEY_BARK }) {
  const pushdeer = $.getdata(KEY_PUSHDEER)
  const bark = $.getdata(KEY_BARK)

  if (pushdeer || bark) {
    if (pushdeer) {
      try {
        const url = pushdeer.replace('[推送全文]', encodeURIComponent(`${title}\n${subtitle}\n${body}`))
        $.log(`开始 PushDeer 请求: ${url}`)
        const res = await $.http.get({ url })
        // console.log(res)
        const status = $.lodash_get(res, 'status')
        $.log('↓ res status')
        $.log(status)
        let resBody = String($.lodash_get(res, 'body') || $.lodash_get(res, 'rawBody'))
        try {
          resBody = JSON.parse(resBody)
        } catch (e) {}
        $.log('↓ res body')
        console.log($.toStr(resBody))
        if (!['0', '200'].includes(String($.lodash_get(resBody, 'code')))) {
          throw new Error($.lodash_get(resBody, 'message') || $.lodash_get(resBody, 'msg') || '未知错误')
        }
      } catch (e) {
        console.log(e)
        $.msg('短信转发', `❌ PushDeer 请求`, `${$.lodash_get(e, 'message') || $.lodash_get(e, 'error') || e}`, {})
      }
    }
    if (bark) {
      try {
        const url = bark
          .replace('[推送标题]', encodeURIComponent(title))
          .replace('[推送内容]', encodeURIComponent(`${subtitle}\n${body}`))
          .replace('[复制内容]', encodeURIComponent(copy))
        $.log(`开始 bark 请求: ${url}`)
        const res = await $.http.get({ url })
        // console.log(res)
        const status = $.lodash_get(res, 'status')
        $.log('↓ res status')
        $.log(status)
        let resBody = String($.lodash_get(res, 'body') || $.lodash_get(res, 'rawBody'))
        try {
          resBody = JSON.parse(resBody)
        } catch (e) {}
        $.log('↓ res body')
        console.log($.toStr(resBody))
        if (!['0', '200'].includes(String($.lodash_get(resBody, 'code')))) {
          throw new Error($.lodash_get(resBody, 'message') || $.lodash_get(resBody, 'msg') || '未知错误')
        }
      } catch (e) {
        console.log(e)
        $.msg('短信转发', `❌ bark 请求`, `${$.lodash_get(e, 'message') || $.lodash_get(e, 'error') || e}`, {})
      }
    }
  } else {
    $.msg(`[无转发 本地预览] ${title}`, subtitle, body)
  }
}
function renderTpl(tpl, data) {
  return (
    tpl
      .replace('[号码]', data.sender || '')
      .replace('[内容]', data.text || '')
      .replace('[时间]', new Date().toLocaleString('zh'))
      // .replace('[含码]', data.hasCode ? '✅' : '❌')
      .replace('[复制提示]', data.code ? '(长按/下拉复制验证码)' : '(长按/下拉复制)')
      .replace('[码]', data.code || '')
      .replace(/  +/g, ' ')
  )
}

function lodash_set(obj, path, value) {
  if (Object(obj) !== obj) return obj // When obj is not an object
  // If not yet an array, get the keys from the string-path
  if (!Array.isArray(path)) path = path.toString().match(/[^.[\]]+/g) || []
  path.slice(0, -1).reduce(
    (
      a,
      c,
      i // Iterate all of them except the last one
    ) =>
      Object(a[c]) === a[c] // Does the key exist and is its value an object?
        ? // Yes: then follow that path
          a[c]
        : // No: create the key. Is the next key a potential array-index?
          (a[c] =
            Math.abs(path[i + 1]) >> 0 === +path[i + 1]
              ? [] // Yes: assign a new array object
              : {}), // No: assign a new plain object
    obj
  )[path[path.length - 1]] = value // Finally assign the value to the last key
  return obj // Return the top-level object to allow chaining
}

// prettier-ignore
function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.encoding="utf-8",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`\ud83d\udd14${this.name}, \u5f00\u59cb!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}isShadowrocket(){return"undefined"!=typeof $rocket}isStash(){return"undefined"!=typeof $environment&&$environment["stash-version"]}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,a]=i.split("@"),n={url:`http://${a}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(n,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),a=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(a);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){if(t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,i)});else if(this.isQuanX())this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t&&t.error||"UndefinedError"));else if(this.isNode()){let s=require("iconv-lite");this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:i,statusCode:r,headers:o,rawBody:a}=t,n=s.decode(a,this.encoding);e(null,{status:i,statusCode:r,headers:o,rawBody:a,body:n},n)},t=>{const{message:i,response:r}=t;e(i,r,r&&s.decode(r.rawBody,this.encoding))})}}post(t,e=(()=>{})){const s=t.method?t.method.toLocaleLowerCase():"post";if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient[s](t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status?s.status:s.statusCode,s.status=s.statusCode),e(t,s,i)});else if(this.isQuanX())t.method=s,this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t&&t.error||"UndefinedError"));else if(this.isNode()){let i=require("iconv-lite");this.initGotEnv(t);const{url:r,...o}=t;this.got[s](r,o).then(t=>{const{statusCode:s,statusCode:r,headers:o,rawBody:a}=t,n=i.decode(a,this.encoding);e(null,{status:s,statusCode:r,headers:o,rawBody:a,body:n},n)},t=>{const{message:s,response:r}=t;e(s,r,r&&i.decode(r.rawBody,this.encoding))})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl,i=t["update-pasteboard"]||t.updatePasteboard;return{"open-url":e,"media-url":s,"update-pasteboard":i}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this.isMuteLog){let t=["","==============\ud83d\udce3\u7cfb\u7edf\u901a\u77e5\ud83d\udce3=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t.stack):this.log("",`\u2757\ufe0f${this.name}, \u9519\u8bef!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`\ud83d\udd14${this.name}, \u7ed3\u675f! \ud83d\udd5b ${s} \u79d2`),this.log(),this.isSurge()||this.isQuanX()||this.isLoon()?$done(t):this.isNode()&&process.exit(1)}}(t,e)}
