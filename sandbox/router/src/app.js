import express from "express"
import morgan from "morgan"
import {createProxyMiddleware} from "http-proxy-middleware"

const app = express()
app.use(morgan('combined'))

app.get('/api/status/healthz',(req,res)=>{
    res.status(200).json({
        status:'ok'
    })
})

app.get('/api/status/readyz',(req,res)=>{
    res.status(200).json({
        status:'ready'
    })
})

const proxies = {}

function getProxy(sandboxId){
    const target= `http://sandbox-service-${sandboxId}`
    if(!proxies[sandboxId]){
        proxies[sandboxId]= createProxyMiddleware({
        target,
        changeOrigin:true,
        ws:true,
       proxyTimeout: 10000,  // ← 10 sec wait
  timeout: 10000,
  on: {
    error: (err, req, res) => {
      // Retry instead of showing error
      setTimeout(() => {
        res.writeHead(302, { Location: req.url })
        res.end()
      }, 2000)
    }
  }
    })
    }

    return proxies[sandboxId]
}

app.use((req,res,next)=>{
    const host = req.headers.host;
    const sandboxId = host.split('.')[0];


return getProxy(sandboxId)(req,res,next);

})
export default app