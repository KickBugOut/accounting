const { getYMDTime } = require("../../../../utils/date")
const { padMoney } = require("../../../../utils/money")

Component({
  properties: {
    data: Object,
    time: Number
  },

  data: {
    timeStr: '',
    expend: 0,
    income: 0,
    list: [],
    lastTapTime: 0,
    doubleTapDelay: 300, // 双击间隔时间
    autoHideDelay: 2000, // 自动隐藏延迟时间
  },
  observers: {
    'data, time': function (data, time) {
      const { monthStr, dayStr } = getYMDTime(new Date(time))
      
      this._initData(data)
      
      this.setData({
        timeStr: `${monthStr}月${dayStr}日`
      })
    }
  },

  methods: {
    _initData (data) {
      let expend = 0, income = 0

      for (const item of data) {
        if (item.type === 0) expend += item.money
        if (item.type === 1) income += item.money
        item.money = padMoney(item.money / 100)
        item.showActionSheet = false // 初始化每个item的actionsheet显示状态   
      }

      this.setData({
        expend: padMoney(expend / 100),
        income: padMoney(income / 100),
        list: data
      })
    },

   
    onInfoTap: function(e) {
      const currentTime = new Date().getTime();
      const tapTimeDiff = currentTime - this.data.lastTapTime;
      const id = e.currentTarget.dataset.id;
      console.log(e)
      // 清除之前的定时器
      if (this.hideActionSheetTimer) {
        clearTimeout(this.hideActionSheetTimer);
      }

      if (tapTimeDiff < this.data.doubleTapDelay) {
        // 找到当前点击的item并设置其showActionSheet为true，其他项为false
        const newList = this.data.list.map(item => {
          if (item.id === id) {
            return { ...item, showActionSheet: true };
          } else {
            return { ...item, showActionSheet: false };
          }
        });
        this.setData({
          list: newList,
          lastTapTime: currentTime
        });

        // 设置定时器，2秒后隐藏actionsheet
        this.hideActionSheetTimer = setTimeout(() => {
          this.hideActionSheet(id);
        }, this.data.autoHideDelay);
      } else {
        this.setData({
          lastTapTime: currentTime
        });
      }
    },

    hideActionSheet: function(id) {
      // 隐藏指定id的actionsheet
      const newList = this.data.list.map(item => {
        if (item.id === id) {
          return { ...item, showActionSheet: false };
        } else {
          return item;
        }
      });
      this.setData({
        list: newList
      });
    },

    onCancelActionSheet: function(e) {
      // 隐藏当前actionsheet
      const id = e.currentTarget.dataset.id;
      this.hideActionSheet(id);
    },

    onActionTap: function(e) {
      const type = e.currentTarget.dataset.type;
      const id = e.currentTarget.dataset.id;
      if (type === 'edit') {
        this.onEdit(id);
      } else if (type === 'delete') {
        this.onDelete(id);
      }
      // 隐藏当前actionsheet
      this.hideActionSheet(id);
    },

    onEdit: function(id) {
      wx.navigateTo({
        url: `/edit-page?id=${id}`
      });
    },

    onDelete: function(id) {
      wx.showModal({
        title: '确认删除',
        content: '您确定要删除这条记录吗？',
        success: (res) => {
          if (res.confirm) {
            this.deleteData(id);
          } else if (res.cancel) {
            console.log('用户点击取消');
          }
        }
      });
    },

    deleteData: function(id) {
      // const { id } = this.data // 假设您有一个recordId字段存储要删除的记录ID
      wx.showToast({
        title: {id},
      })
      console.log(id)
      if (!id) {
        wx.showToast({
          title: '记录ID不存在',
          icon: 'none'
        })
        return
      }

      // 调用云函数删除记录
      wx.cloud.callFunction({
        name: 'delete', // 云函数名称
        data: {
          id: id // 传递要删除的记录ID
        }
      }).then(res => {
        // 删除成功的处理
        console.log('记录删除成功', res)
        wx.showToast({
          title: '删除成功',
          icon: 'success'
        })
        // 刷新页面或执行其他操作，例如重新加载数据
        //this._load() // 假设您有一个_load方法来重新加载数据
        wx.reLaunch({
          url: '/pages/index/index'
        })
      }).catch(error => {
        // 删除失败的处理
        console.error('记录删除失败', error)
        wx.showToast({
          title: '删除失败',
          icon: 'none'
        })
      });
    }
  }
})