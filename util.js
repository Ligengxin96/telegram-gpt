const moment = require('moment')

const dateFormat = (date = moment(), format = 'YYYY-MM-DD HH:mm:ss') => {
  return moment(date).format(format);
}

module.exports = {
  dateFormat,
}