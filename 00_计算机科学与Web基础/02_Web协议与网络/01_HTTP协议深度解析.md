# 01. HTTP 协议深度解析 - 餐厅点餐模型

> 所有的 Web 开发，本质上都是在处理“请求”与“响应”。

我们会把互联网想象成一家**超大型自助餐厅**。你是顾客（Browser/Client），服务器是后厨（Server）。

## 🛠️ 准备工作：运行环境

本节包含 `curl` 命令实战。
**Windows 用户**：请使用 **Git Bash** 运行命令，以避免单引号转义问题。

---

---

## 🎭 场景一：一次标准的点单流程 (Request & Response)

### 1. 顾客点单 (The Request)

你想吃“红烧肉”。你叫来服务员（网络），递给 TA 一张单子（HTTP Request）。

这张单子长这样：

```http
POST /order/create HTTP/1.1
Host: api.restaurant.com
Content-Type: application/json
Authorization: Bearer my-vip-card-123

{
  "dish": "红烧肉",
  "spicy": false
}
```

- **请求行 (Request Line)**: `POST /order/create` —— “我要提交（POST）一个创建订单（/order/create）的请求”。
- **请求头 (Headers)**:
  - `Host`: 对着哪家店喊的？
  - `Content-Type`: 我这张单子是用什么格式写的？这里是 JSON。
  - `Authorization`: 我是 VIP（带了 Token），能不能打折？
- **请求体 (Body)**: 具体内容（红烧肉，不要辣）。

### 2. 后厨反馈 (The Response)

后厨做好了，通过服务员端给你一盘菜（HTTP Response）。

这个盘子下面压着一张单子：

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-cache

{
  "orderId": "998",
  "status": "cooking",
  "estimatedTime": "10mins"
}
```

- **状态行 (Status Line)**: `200 OK` —— “没问题，接单了”。
- **响应头 (Headers)**:
  - `Content-Type`: 盘子里装的是什么格式的数据？
  - `Cache-Control`: `no-cache` —— 这菜得热着吃，别存起来（缓存）下次吃。
- **响应体 (Body)**: 订单确认信息。

---

## 🎭 场景二：各种动作的含义 (Methods)

在 HTTP 餐厅里，顾客不仅仅是“点菜”，还有其他动作：

1.  **GET (获取)**: “服务员，把菜单拿来看看。”
    - _特点_: **幂等 (Idempotent)**。你喊一万次“看菜单”，菜单的内容都不会变，也不会对后厨产生副作用。
2.  **POST (提交)**: “服务员，我要点这个菜！”
    - _特点_: **非幂等**。你喊两次，后厨就可能做两份红烧肉（扣你两次钱）。
3.  **PUT (整体替换)**: “服务员，我不吃红烧肉了，把整桌菜换成全素宴。”
    - _特点_: 全量覆盖。
4.  **PATCH (局部修改)**: “服务员，红烧肉少放点盐。”
    - _特点_: 局部更新。
5.  **DELETE (删除)**: “服务员，退菜！”

---

## 🎭 场景三：状态码的暗语 (Status Codes)

服务员给你比手势，你要懂：

- **2xx (成功)**:
  - `200 OK`: 做好了，端走。
  - `201 Created`: 新订单创建成功。
- **3xx (重定向)**:
  - `301 Moved Permanently`: “这家店倒闭了，新店地址在转角。”（浏览器会自动记住新地址）。
  - `302 Found`: “今天前门装修，请走后门。”（临时的）。
- **4xx (你的错)**:
  - `400 Bad Request`: “你单子字太潦草，看不懂。”（参数格式错误）。
  - `401 Unauthorized`: “您还没登录，请出示会员卡。”
  - `403 Forbidden`: “您是会员，但在这个包间没有权限点这道菜。”（权限不足）。
  - `404 Not Found`: “我们要么没这道菜，要么没这个厨师。”
- **5xx (后厨的错)**:
  - `500 Internal Server Error`: “后厨炸了。”（代码报错）。
  - `502 Bad Gateway`: “传菜员摔倒了。”（网关/代理错误）。

---

## 🛠️ 实战调试技巧

不要只听故事，我们要动手看。

1.  **Chrome Network 面板**: F12 打开开发者工具 -> Network。刷新网页，随便点一个请求。看 Headers, Payload, Preview。
2.  **Curl 命令行**:

    ````bash
    ```bash
    # 假装发一个 POST 请求 (单行命令，方便复制避免格式错误)
    curl -v -X POST https://httpbin.org/post -H "Content-Type: application/json" -d '{"name": "antigravity"}'
    ````

    - `-v`: 啰嗦模式 (Verbose)，能看到握手过程和 Header。
    - `-d`: data，请求体。

    > **Windows 用户注意**: CMD 不支持单引号。
    >
    > 1. 推荐使用 **Git Bash** 运行上述命令。
    > 2. 若必须用 CMD，需将单引号改为双引号，并转义内部引号：`-d "{\"name\": \"antigravity\"}"`。

---

> 💡 **核心最佳实践**
>
> 1.  **无状态 (Stateless)**: HTTP 协议本身记不住你是谁。每次请求都必须带上身份证明（如 Cookie 或 Token）。
> 2.  **HTTPS**: 在餐厅和后厨之间拉一条黑色帷幕（加密通道）。防止有人在半路偷吃或者给你的菜里下毒。**生产环境必须上 HTTPS**。
