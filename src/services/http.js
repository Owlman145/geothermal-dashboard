import axios from 'axios'

export default {
  apiRoot: '/api/v1',

  async getData(start, end) {
    const { data } = await axios.get(`${this.apiRoot}/resources/data`, {
      params: {
        start,
        end
      }
    })
    return data
  },

  async getHourlyAvg(start, end) {
    const { data } = await axios.get(`${this.apiRoot}/resources/hourlyData`, {
      params: {
        start,
        end
      }
    })
    return data
  },

  async getDailyAvg(start, end) {
    const { data } = await axios.get(`${this.apiRoot}/resources/dailyData`, {
      params: {
        start,
        end
      }
    })
    return data
  },

  async getWeeklyAvg(start, end) {
    const { data } = await axios.get(`${this.apiRoot}/resources/weeklyData`, {
      params: {
        start,
        end
      }
    })
    return data
  },

  async getMonthlyAvg(start, end) {
    const { data } = await axios.get(`${this.apiRoot}/resources/monthlyData`, {
      params: {
        start,
        end
      }
    })
    return data
  }
}
