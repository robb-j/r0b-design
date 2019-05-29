const ms = require('ms')

/** A utility to time a series of events and output them to the console */
class StopWatch {
  /** Creates a time and log the initial time */
  constructor() {
    this.startedAt = Date.now()
    this.timeseries = []
  }

  /** Record an event */
  record(title) {
    this.timeseries.push({ title, time: Date.now() })
  }

  /** Output all events with relative durations */
  dump() {
    let currentTime = this.startedAt

    for (let item of this.timeseries) {
      console.log(`- ${ms(item.time - currentTime)} ${item.title}`)
      currentTime = item.time
    }
  }
}

module.exports = { StopWatch }
