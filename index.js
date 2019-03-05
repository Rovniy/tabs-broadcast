/**
 * Broadcast system for emit message and payload between browser tabs. Can sync any UI behavior
 */
class Intercom {
  constructor() {
    this.instance = null
    this.callbacks = []
    
    this._createInstance()
  }
  
  _createInstance() {
    this.instance = new BroadcastChannel('intercom')
    
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

export default {
  install(Vue) {
    Vue.prototype.$intercom = new Intercom();
  }
};
