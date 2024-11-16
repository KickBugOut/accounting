// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const collection = db.collection('account')

// 云函数入口函数
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext() // cloud.getWXContext() 只能在 exports.main 中调用
  const { id } = event // 接收要删除的记录的ID

  // 构建查询条件，确保只有相同openid的用户可以删除记录
  const condition = {
    // _id: cloud.database().command.DBQuery.isId(id), // 确保ID是数据库中有效的ID
    _openid: OPENID
  }

  try {
    // 删除记录
    const result = await collection.doc(id).remove()
    return result
  } catch (e) {
    // 出现错误
    return e
  }
}