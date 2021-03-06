const bind = require("./util/bind")

const setDay = require("./util/date/setDay")
const setTime = require("./util/date/setTime")
const setDate = require("./util/date/setDate")

// setTimeout doesn't support values more than int32
// See: https://stackoverflow.com/questions/3468607
// So, mark this value for the further usage.
const TIMEOUT_MAXVALUE = 2147483647

/**
 * Minuette Job constructor
 */
class Job {
  constructor(params = {}) {
    const now = Date.now()

    // Set initial date from previous value
    // to make sure they're will be the same by default.
    // So, when nothing was set, setTimeout will fire on next tick
    let date = new Date(now)
    if (params.runAt.day) {
      date = setDay(date, params.runAt.day)
    } else if (params.runAt.date) {
      date = setDate(date, params.runAt.date)
    }

    if (params.runAt.time) {
      date = setTime(date, params.runAt.time)
    }

    const idle = date.getTime() - now

    if (idle < 0) {
      throw new RangeError(
        "IDLE time couldn't be negative." +
        `Did you just passed a date/time before ${new Date(now)}?`
      )
    }

    this.__callee = {
      action: params.action,
      args: params.args,
      ctx: params.ctx
    }

    // A total idle time of Timer
    this.__idle = idle

    // A count of setTimeout idle time in current Timer's tick
    this.__currentIdle = idle

    this.__repeat = params.repeat

    // A ref to the current setTimeout instance
    this.__tick = null

    bind(this, ["__createTimer", "__executeAction", "cancel", "run"])
  }

  __createTimer() {
    // TODO: Calculate idle for big time intervals manually
    this.__tick = setTimeout(this.__executeAction, this.__currentIdle)
  }

  __executeAction() {
    const {action, args, ctx} = this.__callee

    action.apply(ctx, args)
  }

  get states() {
    return this.__states
  }

  run() {
    this.__createTimer()

    return this
  }

  cancel() {
    clearInterval(this.__tick)

    return this
  }
}

module.exports = Job
