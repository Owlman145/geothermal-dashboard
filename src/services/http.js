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
  },

  async getFanConfig() {
    const { data } = await axios.get(`${this.apiRoot}/controls/getFanTemps`)
    return data
  },

  async getFanStatus() {
    const { data } = await axios.get(`${this.apiRoot}/fanStatus`)
    return data
  },

  async setFanConfig(onTemp, offTemp, override) {
    const { data } = await axios.get(`${this.apiRoot}/controls/setFanTemps?onTemp=${onTemp}&offTemp=${offTemp}&override=${override}`)
    return data
  },
}
