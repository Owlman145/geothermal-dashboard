import axios from 'axios'

export default {
  apiRoot: '/api/v1',

  async getDaily(date) {
    const { data } = await axios.get(`${this.apiRoot}/resources/dailyData`, {
      params: {
        date
      }
    })
    return data
  },

  async getWeekly(date) {
    const { data } = await axios.get(`${this.apiRoot}/resources/weeklyData`, {
      params: {
        date
      }
    })
    return data
  },

  async getMonthly(date) {
    const { data } = await axios.get(`${this.apiRoot}/resources/monthlyData`, {
      params: {
        date
      }
    })
    return data
  }
}
