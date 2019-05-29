const ms = require('ms')

class StopWatch {
  constructor() {
    this.startedAt = Date.now()
    this.timeseries = []
  }

  record(title) {
    this.timeseries.push({ title, time: Date.now() })
  }

  dump() {
    let currentTime = this.startedAt

    for (let item of this.timeseries) {
      console.log(`- ${ms(item.time - currentTime)} ${item.title}`)
      currentTime = item.time
    }
  }
}

module.exports = { StopWatch }
