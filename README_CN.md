<div align="center">

# NebulaDB

<img src="assets/logo.png" width="128" height="128" alt="NebulaDB Logo" />

<!-- ![NebulaDB 横幅](assets/banner.png) -->

**完全免费开源的现代化、高性能数据库管理工具**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)](https://github.com/tauri-apps/tauri)
[![Tauri](https://img.shields.io/badge/Tauri-2.9.2-blue.svg)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-19.2.0-61dafb.svg)](https://reactjs.org/)

[English](README.md) | [简体中文](README_CN.md)

</div>

---

## ✨ 特性

### 🆓 **完全免费开源**
- **100% 免费** - 无付费功能，无订阅费用
- **完全开源** - MIT 协议，代码透明，社区驱动
- **无限制** - 所有人均可使用所有功能

### 🎨 **现代化界面**
- **VS Code 风格设计** - 熟悉的专业界面，配以玻璃拟态效果
- **深色/浅色主题** - 护眼主题，流畅过渡动画
- **响应式布局** - 可调整大小的面板，优化工作空间布局
- **极简美学** - 简洁、无干扰的工作环境

### 🗄️ **多数据库支持**
- **PostgreSQL** - 完整支持 PostgreSQL 数据库
- **MySQL** - 完全兼容 MySQL/MariaDB
- **SQLite** - 轻量级嵌入式数据库支持
- **Redis** - 键值存储管理（开发中）

### 🚀 **强大功能**
- **AI 驱动的 SQL 生成** - 使用自然语言生成 SQL 查询（基于 Gemini）
- **可视化表设计器** - 通过直观的图形界面创建和修改表
- **SSH 隧道支持** - 安全连接到远程数据库
- **SSL/TLS 加密** - 安全的数据库连接
- **SQL 编辑器** - Monaco 编辑器，支持语法高亮和自动补全
- **查询历史** - 跟踪并重用之前的查询
- **数据导出** - 支持导出 JSON、CSV 格式
- **多语言支持** - 中文和英文界面切换

### 🔧 **开发者工具**
- **SQL 格式化** - 自动美化 SQL 代码
- **结果表格** - 交互式数据网格，支持排序和筛选
- **连接管理** - 保存和管理多个数据库连接
- **实时控制台** - 监控查询和系统日志

---

## 📦 安装

### 前置要求
- **Node.js** 16+ 
- **Rust** 1.77.2+（从源码构建时需要）
- **Gemini API 密钥**（AI 功能所需）

### 快速开始

1. **克隆仓库**
   ```bash
   git clone https://github.com/yourusername/nebuladb.git
   cd nebuladb
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境**
   - 在项目根目录创建 `.env.local` 文件
   - 添加你的 Gemini API 密钥：
     ```
     GEMINI_API_KEY=your_api_key_here
     ```

4. **开发模式运行**
   ```bash
   npm run tauri dev
   ```

5. **生产环境构建**
   ```bash
   npm run tauri build
   ```

---

## 🎯 使用方法

### 创建连接

1. 点击侧边栏的 **+** 按钮
2. 选择数据库类型（PostgreSQL、MySQL、SQLite）
3. 填写连接详情：
   - 主机和端口
   - 用户名和密码
   - 数据库名称
4. （可选）配置 SSH 隧道或 SSL/TLS
5. 点击**测试连接**验证配置
6. 点击**保存并连接**

### 使用 AI 助手

1. 选择一个数据库和表
2. 点击 **AI 助手**按钮或按 `Ctrl+Shift+A`
3. 用自然语言描述你的查询：
   - *"查找上周注册的所有用户"*
   - *"获取销量前 10 的产品"*
   - *"显示所有活跃订单及客户详情"*
4. 审查并执行生成的 SQL

### 设计表

1. 在侧边栏右键点击数据库
2. 选择**创建表**或**设计表**
3. 使用可视化设计器：
   - 添加/修改列
   - 设置数据类型和约束
   - 创建索引
   - 定义外键
4. 预览生成的 SQL
5. 点击**保存**以创建/修改表

---

## 🛠️ 技术栈

### 前端
- **React 19.2** - UI 框架
- **TypeScript** - 类型安全开发
- **Monaco Editor** - 代码编辑器组件
- **Tailwind CSS** - 实用优先的样式框架
- **Lucide React** - 精美图标库
- **i18next** - 国际化支持

### 后端
- **Tauri 2.9** - 桌面应用框架
- **Rust** - 高性能后端
- **SQLx** - 异步 SQL 工具包
- **Tokio** - 异步运行时

### AI 集成
- **Google Gemini API** - 自然语言到 SQL 转换

---

## 🗺️ 路线图

- [ ] MongoDB 支持
- [ ] 查询构建器 GUI
- [ ] 数据库关系图可视化
- [ ] SQL 迁移工具
- [ ] 多标签查询编辑器
- [ ] 自定义主题和配色方案
- [ ] 查询性能分析器
- [ ] 备份和恢复工具

---

## 🤝 贡献

欢迎贡献！请随时提交 Pull Request。

1. Fork 本仓库
2. 创建你的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

## 🙏 致谢

- [Tauri](https://tauri.app/) - 提供强大的桌面应用框架
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - 提供强大的代码编辑器
- [Google Gemini](https://deepmind.google/technologies/gemini/) - 提供 AI 驱动功能
- [Lucide](https://lucide.dev/) - 提供精美图标

---

<div align="center">

**用 ❤️ 由 NebulaDB 团队打造**

[报告 Bug](https://github.com/yourusername/nebuladb/issues) · [请求功能](https://github.com/yourusername/nebuladb/issues)

</div>
