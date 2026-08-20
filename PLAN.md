
# 骷髅王（Skull King）网页游戏开发规划

> 本文档供 AI 阅读并执行开发任务。请严格按照规划顺序实施，每个阶段完成后再进入下一阶段。

---

## 一、项目概述

### 目标
开发一个可在手机浏览器上直接访问、无需安装的多人骷髅王卡牌游戏网页。支持 2-8 名玩家通过房间码加入同一局游戏。

### 核心需求
- 手机浏览器可用（移动端优先）
- 通过房间码邀请朋友
- 实时多人对战（WebSocket）
- 无需登录注册
- 中文界面
- 部署在香港节点，中国大陆无需 VPN 可访问

### 技术栈
- **后端**：Node.js + Express + Socket.io
- **前端**：React + Vite（打包后由后端托管，单域名访问）
- **部署**：Fly.io 香港节点（`hkg` region）
- **无数据库**：游戏状态全部存于内存 Map

---

## 二、完整游戏规则

### 2.1 牌组（共 66 张）

| 牌型 | 数量 | 说明 |
|------|------|------|
| 黄色数字牌 | 13 张 | 1-13，普通花色 |
| 绿色数字牌 | 13 张 | 1-13，普通花色 |
| 紫色数字牌 | 13 张 | 1-13，普通花色 |
| 黑色数字牌 | 13 张 | 1-13，**王牌花色（永远压制其他颜色）** |
| 逃跑（Escape）| 5 张 | 特殊牌，永远不赢 |
| 海盗（Pirate）| 5 张 | 特殊牌，强力攻击牌 |
| 美人鱼（Mermaid）| 2 张 | 特殊牌，能战胜骷髅王 |
| 骷髅王（Skull King）| 1 张 | 最强牌（除美人鱼外） |
| 母老虎（Tigress）| 1 张 | 特殊牌，出牌时宣告为"海盗"或"逃跑" |

### 2.2 牌面大小（从低到高）

逃跑 < 有色数字牌（1-13）< 黑色数字牌（1-13）< 美人鱼 < 海盗 < 骷髅王



**关键例外（石头剪刀布循环）：**
- 骷髅王 > 海盗 ✓
- 海盗 > 美人鱼 ✓
- 美人鱼 > 骷髅王 ✓（美人鱼是唯一能赢骷髅王的牌）

**同类型多张的规则：**
- 多张海盗同时出现：**第一张出的海盗赢**
- 多张美人鱼同时出现：**第一张出的美人鱼赢**
- 多张逃跑：**第一张出的逃跑赢**（仅在该轮所有牌均为逃跑时）

### 2.3 游戏流程

1. **准备**：2-8 名玩家进入房间，房主点击开始
2. **共 10 轮**：第 N 轮每人发 N 张牌（第1轮1张，第10轮10张）
3. **每轮流程**：
   - **发牌阶段**：系统自动发牌
   - **竞标阶段**：所有玩家同时提交本轮预测赢墩数（0 到 N）
   - **出牌阶段**：轮流出牌，打完所有牌
   - **结算阶段**：显示本轮得分，准备下一轮
4. **结束**：10 轮后显示最终排名

**首出玩家**：第1轮随机，之后每轮顺时针轮换。每墩由赢墩者先出。

### 2.4 出牌规则

1. **跟花色**：若手牌中有首出牌的花色（数字牌），**必须跟花色**
2. **无该花色**：可出任意牌（包括王牌黑色、特殊牌）
3. **首出特殊牌**：出特殊牌领墩时，无跟花色要求（其他人自由出牌）；下一张出的数字牌决定本墩花色
4. **特殊牌随时可出**：无论是否有跟花色，特殊牌（逃跑/海盗/美人鱼/骷髅王/母老虎）**随时可出**

### 2.5 计分规则

**竞标成功（预测 ≥ 1 墩，实际赢墩 = 预测）：**
- 基础分：+20 × 赢墩数
- 加分奖励（见 2.6）

**竞标失败（预测 ≥ 1 墩，实际赢墩 ≠ 预测）：**
- -10 × |实际 - 预测|（差值绝对值）
- 无加分奖励

**竞标零墩（预测 = 0）：**
- 成功（一墩未赢）：+10 × 当前轮数
- 失败（赢了任何墩）：-10 × 当前轮数
- 零墩无加分奖励

### 2.6 加分奖励（仅竞标成功时有效）

| 触发条件 | 加分 |
|----------|------|
| 骷髅王赢得含海盗的墩 | +30 × 该墩中海盗数量 |
| 美人鱼赢得含骷髅王的墩 | +50 |

**重要**：母老虎宣告为"逃跑"时，仍视作**海盗**计入骷髅王加分。

加分奖励在竞标失败时全部作废（即使实际赢得了这些特殊墩）。

### 2.7 母老虎（Tigress）特殊规则

- 出牌时必须立即宣告：**"海盗"** 或 **"逃跑"**
- 宣告为海盗：等同于普通海盗牌（可赢墩）
- 宣告为逃跑：等同于普通逃跑牌（不赢墩），但**仍按海盗计算骷髅王加分**
- 宣告后不可更改

---

## 三、技术架构

### 3.1 项目结构

skullking/
├── package.json              # 根包：并发启动前后端
├── server/
│   ├── package.json
│   └── src/
│       ├── index.js          # Express + Socket.io 入口
│       ├── rooms.js          # 房间管理（内存 Map）
│       ├── events.js         # Socket.io 事件处理器
│       └── game/
│           ├── cards.js      # 牌组定义与洗牌
│           ├── engine.js     # 游戏状态机（核心逻辑）
│           ├── trick.js      # 墩胜负判断
│           └── scoring.js    # 计分逻辑
├── client/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── socket.js         # Socket.io 客户端单例
│       ├── pages/
│       │   ├── Home.jsx      # 创建/加入房间
│       │   ├── Lobby.jsx     # 等待室
│       │   ├── Game.jsx      # 游戏主界面
│       │   └── Results.jsx   # 最终排名
│       └── components/
│           ├── Card.jsx      # 单张牌组件
│           ├── Hand.jsx      # 手牌区（横向滚动）
│           ├── TrickArea.jsx # 当前墩出牌区
│           ├── BidPanel.jsx  # 竞标面板
│           ├── TigressModal.jsx # 母老虎宣告弹窗
│           └── Scoreboard.jsx   # 分数板
├── Dockerfile
└── fly.toml



### 3.2 部署方案（Fly.io 香港节点）

**Dockerfile**：
1. 第一阶段：构建 React 前端（`npm run build` in client/）
2. 第二阶段：Node.js 运行时，复制前端 dist 到 `server/public/`，服务器托管静态文件

**fly.toml** 关键配置：
```toml
[env]
  NODE_ENV = "production"
  PORT = "8080"

[[services]]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    handlers = ["http"]
    port = 80
  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443
部署命令：fly deploy --region hkg

四、数据模型
4.1 Card 对象

// type: 'number' | 'escape' | 'pirate' | 'mermaid' | 'skull_king' | 'tigress'
// suit: 'yellow' | 'green' | 'purple' | 'black' | null  (null for special cards)
// value: 1-13 for number cards, 0 for special
// id: unique string (e.g. 'yellow_7', 'pirate_1', 'tigress')

{
  id: 'black_13',
  type: 'number',
  suit: 'black',
  value: 13,
  displayName: '黑13'
}

{
  id: 'tigress',
  type: 'tigress',
  suit: null,
  value: 0,
  displayName: '母老虎',
  // 运行时添加（出牌后）：
  // declaredAs: 'pirate' | 'escape'
}
4.2 房间状态（Room）

{
  id: 'ABCDEF',            // 6位大写房间码
  hostId: 'socket-id',
  players: [
    {
      id: 'socket-id',
      name: '玩家昵称',
      connected: true,
      totalScore: 0,
      roundScores: []      // 每轮得分记录
    }
  ],
  game: null | GameState
}
4.3 游戏状态（GameState）

{
  phase: 'waiting' | 'bidding' | 'playing' | 'trick_result' | 'round_summary' | 'game_over',
  round: 1,               // 当前轮数 1-10
  dealerIndex: 0,         // 庄家索引（每轮+1）
  currentPlayerIndex: 0,  // 当前出牌者索引

  hands: {
    'socket-id': [Card, ...]   // 每个玩家的手牌（服务端保存完整）
  },

  bids: {
    'socket-id': null | number  // null = 未竞标
  },

  tricksWon: {
    'socket-id': 0
  },

  bonusPoints: {
    'socket-id': 0
  },

  currentTrick: {
    leadPlayerIndex: 0,
    leadSuit: null | 'yellow' | 'green' | 'purple' | 'black',
    plays: [
      { playerId: 'socket-id', card: Card }
    ]
  },

  lastTrickResult: null | {
    winnerId: 'socket-id',
    cards: [...],
    bonuses: [{ playerId, amount, reason }]
  },

  roundSummary: null | {
    scores: [{ playerId, bid, tricksWon, baseScore, bonus, total }]
  }
}
五、Socket.io 事件
客户端 → 服务端
事件	数据	说明
create_room	{ playerName }	创建房间，返回房间码
join_room	{ roomId, playerName }	加入房间
start_game	-	房主开始游戏
submit_bid	{ bid: number }	提交竞标
play_card	{ cardId: string }	出牌
declare_tigress	{ as: 'pirate' | 'escape' }	母老虎宣告
next_round	-	房主点击进入下一轮（在 round_summary 阶段）
next_trick	-	房主点击进入下一墩（在 trick_result 阶段）
服务端 → 客户端
事件	数据	说明
room_joined	{ roomId, playerId, room }	加入成功
room_update	{ players }	房间玩家列表变化
game_started	{ gameState }	游戏开始，附带初始状态
deal_cards	{ hand: [Card], round, totalPlayers }	发牌（每人只收到自己的牌）
bid_update	{ bids: { playerId: null|number } }	竞标进度（不透露具体数字，仅已/未竞标）
all_bids_in	{ bids }	所有人竞标完成，公布所有竞标
card_played	{ playerId, card, currentTrick, nextPlayerId }	某人出牌
request_tigress	{ playerId }	要求该玩家宣告母老虎
trick_complete	{ winnerId, cards, bonuses, tricksWon }	本墩结束
round_complete	{ roundSummary }	本轮结束，展示得分
game_over	{ finalScores }	游戏结束
error	{ message }	错误信息
六、关键算法
6.1 墩胜负判断（trick.js）

// 判断 challenger 是否能打败 current winner
// leadSuit: 本墩确立的花色（可能为 null）
function beats(challenger, current, leadSuit) {
  // 逃跑永远不赢
  if (isEscape(challenger)) return false;

  // 当前赢家是骷髅王
  if (isSkullKing(current)) {
    return isMermaid(challenger); // 只有美人鱼能赢骷髅王
  }

  // 挑战者是骷髅王
  if (isSkullKing(challenger)) {
    return !isMermaid(current); // 骷髅王赢一切，除了美人鱼
  }

  // 当前赢家是海盗（含母老虎-海盗）
  if (isPirate(current)) {
    return false; // 第一张海盗赢，后续海盗不能取代
  }

  // 挑战者是海盗
  if (isPirate(challenger)) {
    return true; // 海盗赢一切数字牌和美人鱼（骷髅王已在上面处理）
  }

  // 当前赢家是美人鱼
  if (isMermaid(current)) {
    return false; // 第一张美人鱼赢（海盗已处理）
  }

  // 挑战者是美人鱼
  if (isMermaid(challenger)) {
    return true; // 美人鱼赢一切数字牌（海盗/骷髅王已处理）
  }

  // 数字牌 vs 数字牌
  const cBlack = current.suit === 'black';
  const hBlack = challenger.suit === 'black';

  if (cBlack && hBlack) return challenger.value > current.value;
  if (cBlack) return false;   // 黑色挡着，挑战者非黑输
  if (hBlack) return true;    // 挑战者黑色，赢有色

  // 两者都非黑
  if (challenger.suit === leadSuit && current.suit !== leadSuit) return true;
  if (challenger.suit === current.suit) return challenger.value > current.value;
  return false;
}

// 辅助判断
function isEscape(card) {
  return card.type === 'escape' || (card.type === 'tigress' && card.declaredAs === 'escape');
}
function isPirate(card) {
  return card.type === 'pirate' || (card.type === 'tigress' && card.declaredAs === 'pirate');
}
function isMermaid(card) { return card.type === 'mermaid'; }
function isSkullKing(card) { return card.type === 'skull_king'; }

// 判断本墩赢家（plays 按出牌顺序排列）
// 同时返回奖励加分
function resolveTrick(plays, leadSuit) {
  let winnerIndex = 0;

  // 全逃跑特例：第一张赢
  const allEscape = plays.every(p => isEscape(p.card));
  if (!allEscape) {
    for (let i = 1; i < plays.length; i++) {
      if (beats(plays[i].card, plays[winnerIndex].card, leadSuit)) {
        winnerIndex = i;
      }
    }
  }

  const winner = plays[winnerIndex];
  const bonuses = [];

  // 计算加分
  if (isSkullKing(winner.card)) {
    // 骷髅王赢：统计海盗数（含母老虎-逃跑，因其仍算海盗）
    const pirateCount = plays.filter(p =>
      p.playerId !== winner.playerId &&
      (p.card.type === 'pirate' ||
       p.card.type === 'tigress') // 母老虎无论宣告什么都算
    ).length;
    if (pirateCount > 0) {
      bonuses.push({ playerId: winner.playerId, amount: pirateCount * 30, reason: `骷髅王俘获${pirateCount}名海盗` });
    }
  }

  if (isMermaid(winner.card)) {
    // 美人鱼赢：检查是否有骷髅王在场
    const hasSkullKing = plays.some(p =>
      p.playerId !== winner.playerId && isSkullKing(p.card)
    );
    if (hasSkullKing) {
      bonuses.push({ playerId: winner.playerId, amount: 50, reason: '美人鱼战胜骷髅王' });
    }
  }

  return { winnerId: winner.playerId, bonuses };
}
6.2 计分算法（scoring.js）

function calculateRoundScore(bid, tricksWon, bonusPoints, round) {
  if (bid === 0) {
    return tricksWon === 0 ? round * 10 : -(round * 10);
  }
  const diff = Math.abs(bid - tricksWon);
  if (diff === 0) {
    return bid * 20 + bonusPoints; // 竞标成功才算奖励分
  }
  return -(diff * 10);
}
6.3 母老虎宣告流程（服务端状态机）

玩家出母老虎牌
  → 服务端记录 pendingTigress = { playerId, cardId }
  → 向该玩家发送 'request_tigress' 事件
  → 等待 'declare_tigress' 事件
  → 收到宣告 → 更新 card.declaredAs
  → 继续正常出牌流程（广播 'card_played'）
七、前端页面说明
7.1 Home.jsx（首页）
输入昵称
两个按钮：「创建房间」「加入房间」
加入房间时需输入 6 位房间码
简洁居中布局，背景深色海盗风格
7.2 Lobby.jsx（等待室）
显示房间码（大号字体，方便分享）
玩家列表（头像用 emoji 随机分配）
房主可见「开始游戏」按钮（≥2人时激活）
非房主显示「等待房主开始...」
7.3 Game.jsx（游戏主界面）
布局（从上到下）：

顶部状态栏：第 N 轮 / 10，当前阶段提示
其他玩家区：展示每个对手的竞标、手牌数量、本轮赢墩数
当前墩区域（TrickArea）：展示已出的牌，谁先出的在中间
竞标面板（BidPanel）：竞标阶段显示，数字滑块 0 到 N
手牌区（Hand）：横向滚动，可点击的手牌
7.4 Card.jsx（牌组件）
颜色：黄/绿/紫对应颜色背景，黑色用深色背景
特殊牌：emoji 表示（逃跑🏃，海盗🏴‍☠️，美人鱼🧜，骷髅王💀，母老虎🐯）
可点击状态：亮色描边；不可点击：半透明
大小：手机适配，约 60x90px
7.5 TigressModal.jsx
全屏遮罩弹窗
标题：「母老虎如何出击？」
两个大按钮：「作为海盗 🏴‍☠️」「作为逃跑 🏃」
只有出母老虎牌的玩家看到此弹窗
八、实施阶段
Phase 1：项目初始化
任务：

创建根 package.json（concurrently 并发运行前后端）
初始化 server/（Express + Socket.io + nodemon）
初始化 client/（Vite + React）
验证：npm run dev 启动后，浏览器访问 localhost:5173 看到 React 页面
依赖：

server: express, socket.io, cors
client: react, react-dom, socket.io-client
dev: nodemon, concurrently, vite, @vitejs/plugin-react
Phase 2：游戏核心逻辑
任务：

实现 cards.js：牌组定义、createDeck()、shuffle(deck)
实现 trick.js：beats()、resolveTrick()
实现 scoring.js：calculateRoundScore()
实现 engine.js：游戏状态机（createGame、startRound、submitBid、playCard、resolveTrick）
编写并通过单元测试（Jest）：
骷髅王赢海盗 ✓
美人鱼赢骷髅王 ✓
海盗赢美人鱼 ✓
黑13赢黄13 ✓
逃跑永远不赢 ✓
全逃跑第一张赢 ✓
母老虎-逃跑：骷髅王仍得+30 ✓
计分：竞标成功/失败/零墩 各情况 ✓
Phase 3：服务端与房间管理
任务：

实现 rooms.js：createRoom()、joinRoom()、getRoom()
实现 events.js：所有 Socket.io 事件处理
Express 托管 client/dist 静态文件（生产环境）
开发环境：Express 监听 3001，Vite 代理 /socket.io 到 3001
Phase 4：前端客户端
任务：

socket.js：Socket.io 客户端单例，封装事件监听
App.jsx：路由（用状态机管理 home/lobby/game/results）
实现所有页面和组件（见第七章）
CSS：移动优先，最小触控目标 44x44px，支持横竖屏
Phase 5：部署
任务：

编写 Dockerfile（多阶段构建）
编写 fly.toml（region = hkg，port = 8080）
fly launch + fly deploy
验证：手机浏览器访问域名，创建房间，两人能完成一轮游戏
九、Dockerfile 参考

# Stage 1: Build frontend
FROM node:20-alpine AS frontend
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Production server
FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --only=production
COPY server/ ./
COPY --from=frontend /app/client/dist ./public
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production
CMD ["node", "src/index.js"]
十、验收标准
在手机浏览器上完成以下流程：

 玩家 A 创建房间，获得房间码
 玩家 B 通过房间码加入
 房主开始游戏，双方收到手牌
 双方完成竞标
 轮流出牌，墩结束后正确判断赢家
 出母老虎时弹出宣告界面
 骷髅王赢海盗时出现+30提示
 美人鱼赢骷髅王时出现+50提示
 10轮后显示最终排名
 竞标失败时奖励分不计入
附：卡牌 ID 命名约定
格式	示例
{suit}_{value}	yellow_7, black_13
escape_{n}	escape_1 到 escape_5
pirate_{n}	pirate_1 到 pirate_5
mermaid_{n}	mermaid_1, mermaid_2
skull_king	skull_king
tigress	tigress
