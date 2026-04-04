class NotificationService {
  async send(event, data) {
    // for assignment → console is enough
    console.log(`📩 Notification [${event}]`, data);

    // future:
    // email / sms / push
  }
}

module.exports = NotificationService;