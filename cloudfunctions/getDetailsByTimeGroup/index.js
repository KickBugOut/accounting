// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const collection = db.collection('account')
const _ = db.command
const $ = _.aggregate

// 云函数入口函数
exports.main = async event => {
  const { OPENID } = cloud.getWXContext()
  const { type, name, beginTime, endTime, isNeedDetails, isNeedTotalMoney } = event

  return await collection.aggregate()
    .match({
      _openid: OPENID,
      type: type === -1 ? undefined : type,   // -1 表示全部类型，0 表示支出，1 表示收入，2 表示不计入收支
      name: name ? (name === '全部类型' ? undefined : name) : undefined,
      time: _.and(_.gte(beginTime), _.lt(endTime))  // match 不可使用聚合操作符，只能使用查询操作符
    })
    .group({
      _id: '$time',  // 根据 time 字段分组
      data: isNeedDetails ? $.push({
        account: '$account',
        money: '$money',
        type: '$type',
        name: '$name',
        py: '$py',
        sub: '$sub',
        how: '$how',
        time: '$time',
        remark: '$remark'
      }) : undefined,
      money: isNeedTotalMoney ? $.sum('$money') : undefined
    })
    .sort({
      _id: -1   // -1 为降序，1 为升序
    })
    .limit(31)  // 默认返回 20 条数据，这里根据时间聚合后最多能查询到 31 条数据
    .end()
}