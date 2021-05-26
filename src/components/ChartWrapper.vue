<template>
  <div class='chart-wrapper'>
    <div class='fan-controls'>
      <img src="../assets/fan-icon.png">
    </div>
    <vue-toggle :values="scales" :selected="scale" @change="onScaleChange" default="green"></vue-toggle>
    <div class="time-select-form">
      <DatePicker placeholder="Today" v-model="date1" @change="onTimeChange"></datepicker>
    </div>
    <div v-if="loading" class="loading">
      Loading...
    </div>
    <div v-if="error" class="error">
      {{ error }}
    </div>
    <h3 v-if="temperatureData" class="chart-title">Temperature</h3>
    <TempChart v-if="temperatureData" :data="temperatureData" :scale="scale"/>
    <h3 v-if="waterTempData" class="chart-title">Water Temperature</h3>
    <WaterTempChart v-if="waterTempData" :data="waterTempData" :scale="scale"/>
    <h3 v-if="humidityData" class="chart-title">Humidity</h3>
    <HumidityChart v-if="humidityData" :data="humidityData" :scale="scale"/>
  </div>
</template>

<script>
import TempChart from './TempChart.vue'
import WaterTempChart from './WaterTempChart.vue'
import HumidityChart from './HumidityChart.vue'
import VueToggle from './vue-toggle.vue'
import http from "../services/http"
import DatePicker from 'vue2-datepicker'
import 'vue2-datepicker/index.css'

export default {
  name: 'ChartWrapper',
  components: {
    TempChart,
    WaterTempChart,
    HumidityChart,
    VueToggle,
    DatePicker
  },
  data () {
    return {
      loading: false,
      data: null,
      error: null,
      scale: 'daily',
      scales: {
        daily: "Daily",
        weekly: "Weekly",
        monthly: "Monthly"
      },
      date1: null,
    }
  },
  computed: {
    temperatureData: function () {
      if (this.loading || !this.data)
        return null
      return this.data.map(point => {
        return {
          id: point.id,
          date: new Date(point.id),
          indoor_temperature: point.indoor_temperature,
          outdoor_temperature: point.outdoor_temperature,
          indoor_temperature_mean: point.indoor_temperature_mean,
          outdoor_temperature_mean: point.outdoor_temperature_mean,
          indoor_temperature_max: point.indoor_temperature_max,
          outdoor_temperature_max: point.outdoor_temperature_max,
          indoor_temperature_min: point.indoor_temperature_min,
          outdoor_temperature_min: point.outdoor_temperature_min
        }
      })
    },
    waterTempData: function () {
      if (this.loading || !this.data)
        return null
      return this.data.map(point => {
        return {
          id: point.id,
          date: new Date(point.id),
          water_temperature: point.water_temperature,
          water_temperature_mean: point.water_temperature_mean,
          water_temperature_max: point.water_temperature_max,
          water_temperature_min: point.water_temperature_min,
        }
      })
    },
    humidityData: function () {
      if (this.loading || !this.data)
        return null
      return this.data.map(point => {
        return {
          id: point.id,
          date: new Date(point.id),
          indoor_humidity: point.indoor_humidity,
          outdoor_humidity: point.outdoor_humidity,
          indoor_humidity_mean: point.indoor_humidity_mean,
          outdoor_humidity_mean: point.outdoor_humidity_mean,
          indoor_humidity_max: point.indoor_humidity_max,
          outdoor_humidity_max: point.outdoor_humidity_max,
          indoor_humidity_min: point.indoor_humidity_min,
          outdoor_humidity_min: point.outdoor_humidity_min
        }
      })
    }
  },
  created () {
    // fetch the data when the view is created and the data is
    // already being observed
    this.loading = true
    this.fetchData()
  },

  beforeDestroy() {
    if (this.chart) {
      this.chart.dispose();
    }
  },
  methods: {
    async fetchData () {
      this.error = this.data = null
      // replace `getPost` with your data fetching util / API wrapper
      try {
        if (this.scale === "weekly") {
          this.data = await http.getWeekly(this.date1)
        } else if (this.scale === "monthly") {
          this.data = await http.getMonthly(this.date1)
        } else {
          this.data = await http.getDaily(this.date1)
        }
      } catch(err) {
        this.error = err.toString()
      } finally {
        this.loading = false
      }
    },
    onScaleChange(scale) {
      this.scale = scale
      this.loading = true
      this.fetchData()
    },
    onTimeChange() {
      this.loading = true
      this.fetchData()
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
.fan-controls {
  img {
    width: 20px;
    height: 20px;
  }
}
h3 {
  margin: 40px 0 0;
}
.time-select-form {
  margin-top: 5px;
}
.loading,
.error {
  margin: 10px 0 0;
}
</style>
