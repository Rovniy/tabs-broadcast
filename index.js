class TabsBroadcast {
  constructor() {
    this.instance = null
    this.callbacks = []
    
    this._createInstance()
  }
  
  _createInstance() {
    this.instance = new BroadcastChannel('broadcast')
    
    this.instance.onmessage = (postedMessage) => {
      this.callbacks.forEach((item, index) => {
        if (postedMessage.data.type === item.type) {
          item.callback(postedMessage.data.payload)
          
          if (item.to_remove) this.callbacks.splice(index, 1)
        }
      })
    }
  }
  
  $on(type, callback) {
    this.callbacks.push({
      type,
      callback
    })
  }
  
  $once(type, callback) {
    this.callbacks.push({
      type,
      callback,
      to_remove: true
    })
  }
  
  $off(type) {
    this.callbacks.forEach((item, index) => {
      if (item.type === type) {
        this.callbacks.splice(index, 1);
      }
    })
  }
  
  $emit(type, payload = null) {
    this.instance.postMessage({
      type,
      payload
    })
  }
}

export default TabsBroadcast
