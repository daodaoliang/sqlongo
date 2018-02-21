# Sqlongo

长得最像 MongoDB 的 Sqlite3 ORM

## 安装

```bash
yarn add sqlongo  # or 'npm install sqlongo'
```

## API

Sqlongo 支持被其他模块调用，也支持交互式解释器（REPL）。在终端下运行 `node index.js` 或 `npm run start` 可启动 REPL。

### 打开数据库

使用`let db = new Sqlongo(fileName)` 打开一个 Sqlite `.db` 文件。在 REPL 中，等价的命令是 `use fileName`。

- `fileName` 可不填，缺省为内存临时数据库；
- `fileName` 可不带 `.db` 后缀，会自动添加；
- 可通过 `Sqlongo.defaults.path` 设置 `.db` 文件的保存路径。

### 定义表

使用 `await db.tableName.define(schema)` 来定义一个表。

> 注意：在 REPL 中，所有异步方法不带 `await` 直接调用。

- 定义表本质上是 `create table if not exists` 语句；

- 为了保证 SQL 安全，在每个 `db` 实例中都需要先定义表，才能对对应的表进行增删改查操作；

- `tableName` 为表名，可任意指定；

- `schema` 为表结构对象，用列名作为 `key`，类型属性作为对应的 `value`，例如：

  ```javascript
  await db.todo.define({
    id: 'int primary key',
    content: 'text'
  })
  ```

### 异步定义表

如果开发者可以保证建表语句后有足够的 I/O 时间等待建表完成（例如，在服务器开始运行时建表，当请求到来时再使用表），可以直接使用 `db.tableName = schema` 来定义表。

这种方法与 `db.tableName.define(schema)`（不带 `await`）等价。

建表语句执行未完成时，数据表处于准备状态，该状态下不允许对数据表进行操作。

### 查找数据

使用 `await db.tableName.find(criteria, limit, offset)` 查找符合条件的数据。

- `criteria` 是条件对象，默认值为`{}`（无条件），与 MongoDB 类似，用列名作为 `key`，匹配值作为对应的 `value`；若非精确匹配，对应的 `value` 写成对象形式：

  ```javascript
  await db.todo.find({ id: 1 }) // where id = 1
  await db.todo.find({ id: { $gt: 10 } }) // where id > 10
  await db.todo.find({ id: { $lt: 20 } }) // where id < 20
  await db.todo.find({ id: { $gte: 10, $lte: 20 } })
  await db.todo.find({ id: { $in: [10, 20, 30] } })
  await db.todo.find({ content: { $like: '% github %' } })

  // other operations: $glob, $not, $ne
  ```

- `limit` 默认值为 `-1`，即无限；**若 `limit` 显式设置为 `1` ，返回值将是单个对象或 `undefined`（找不到），其余情况下（即使只有一行），返回值都将是所有符合条件的行的数组；**

- `offset` 默认值为 `0`。

### 数据计数

使用 `await db.tableName.count(criteria)` 得到符合条件的数据条数。此处 `criteria` 同样有默认值`{}`（无条件）

### 单列去重

使用 `await db.tableName.distinct(column, criteria, limit, offset)` 得到列 `column` 的符合条件值的去重结果。

### 插入数据

使用  `await db.tableName.insert(row)` 插入新的一行数据：

```javascript
await db.todo.insert({ content: 'Have a cup of coffee' })
```

### 删除数据

使用  `await db.tableName.remove(criteria, limit, offset)` 删除**所有**符合条件的数据。

**注意！** 与部分 MongoDB 解释器的行为不同的是，Sqlongo 删除数据默认不限条数，例如 `await db.todo.remove({})` 将会删除 `todo` 表中所有的行。为了降低危险性，此处 `criteria` 不设默认值，必须显式指定。

### 更改数据

使用  `await db.tableName.update(criteria, row)` 将更改所有符合条件的数据，修改 `row` 中指定的列；`row` 中未指定的列将保持原状。

**注意！** 与部分 MongoDB 解释器的行为不同的是，Sqlongo 更改数据默认不限条数，例如 `await db.todo.update({}, { content: '' })` 将会更改 `todo` 表中所有的行。为了降低危险性，此处 `criteria` 不设默认值，必须显式指定。

### 原始查询

使用  `await db.raw(sql, params)` 执行参数化的原始查询，其本质是 `sqlite3.Database.prototype.all()`，因此返回值始终是一个保存结果对象的数组。

## 安全性说明

Sqlongo 只需要开发者保证**表名**和**表结构**必须固定，不得受用户控制；除表名和表结构外的动态属性均进行了参数化处理。

## 与 MongoDB 的区别

尽管 API 与 MongoDB 十分相似，Sqlongo 仍是一个 Sqlite ORM。主要的区别有两个：强类型（需要有明确的表结构）和数据扁平化（无法直接把对象存储为数据的一列）