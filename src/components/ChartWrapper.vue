<template>
  <div class='chart-wrapper'>
    <div class="controls">

    </div>
    <!--div class='fan-controls'>
      <div class='fan-temps'>
        Fan Off: <input v-model.number="offTemp" type="number">
        Fan On: <input v-model.number="onTemp" type="number">
        <button class='set-fan-temp' @click="onFanTempSet">Set</button>
      </div>
      <button v-bind:class="{ 'fan-on':fanActive }" @click="onFanToggle">
        <img  v-if="fanOn" src="../assets/fan-on-icon.png">
        <img  v-else src="../assets/fan-off-icon.png">
        <span v-if="fanOverride" class="override-text">MANUAL</span>
      </button>
      <div v-if="fanError" class="error">
        {{ fanError }}
      </div>
    </div-->
    <vue-toggle :values="scales" :selected="scale" @change="onScaleChange" default="green"></vue-toggle>
    <div class="time-select-form">
      <DatePicker placeholder="Today" v-model="startDate" @change="onTimeChange" :disabledDate="disabledDates"></datepicker>
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
      onTemp: 0,
      offTemp: 0,
      loading: false,
      fanActive: false,
      fanConfig: null,
      data: null,
      error: null,
      fanError: null,
      fanConfigError: null,
      scale: 'daily',
      scales: {
        daily: "Daily",
        weekly: "Weekly",
        monthly: "Monthly",
        yearly: "Yearly"
      },
      disabledDates: (date) => {console.log(date); return date > new Date()},
      startDate: null,
      endDate: null
    }
  },
  computed: {
    fanOverride: function() {
      return this.fanConfig?.override
    },
    fanOn: function() {
      return this.fanActive || this.fanConfig?.override
    },
    temperatureData: function () {
      if (this.loading || !this.data)
        return null
      return this.data.map(point => {
        return {
          id: point._id,
          date: new Date(point.timestamp),
          indoor_temperature: point.input_temperature,
          outdoor_temperature: point.output_temperature,
          indoor_temperature_mean: point.avg_input_temperature,
          outdoor_temperature_mean: point.avg_output_temperature,
          indoor_temperature_max: point.max_input_temperature,
          outdoor_temperature_max: point.max_output_temperature,
          indoor_temperature_min: point.min_input_temperature,
          outdoor_temperature_min: point.min_output_temperature
        }
      })
    },
    waterTempData: function () {
      if (this.loading || !this.data)
        return null
      return this.data.map(point => {
        return {
          id: point._id,
          date: new Date(point.timestamp),
          water_temperature: point.water_temperature,
          water_temperature_mean: point.avg_water_temperature,
          water_temperature_max: point.max_water_temperature,
          water_temperature_min: point.min_water_temperature,
        }
      })
    },
    humidityData: function () {
      if (this.loading || !this.data)
        return null
      return this.data.map(point => {
        return {
          id: point._id,
          date: new Date(point.timestamp),
          indoor_humidity: point.humidity,
          indoor_humidity_mean: point.avg_humidity,
          indoor_humidity_max: point.max_indoor_humidity,
          indoor_humidity_min: point.min_indoor_humidity,
        }
      })
    }
  },
  created () {
    // fetch the data when the view is created and the data is
    // already being observed
    this.loading = true
    this.fetchData()
    //this.fetchFanStatus()
    //this.fetchFanConfig()
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
      let current_date = this.startDate || new Date()
      try {
        let startDate, endDate;
        if (this.scale === "weekly") {
          startDate = new Date(current_date.getTime() - 7 * 24 * 60 * 60 * 1000);
          endDate = current_date;
          this.data = await http.getHourlyAvg(startDate, endDate);
        } else if (this.scale === "monthly") {
          startDate = new Date(current_date.getTime() - 30 * 24 * 60 * 60 * 1000);
          endDate = current_date;
          this.data = await http.getHourlyAvg(startDate, endDate);
        } else if (this.scale === "yearly") {
          startDate = new Date(current_date.getTime() - 365 * 24 * 60 * 60 * 1000);
          endDate = current_date;
          this.data = await http.getDailyAvg(startDate, endDate);
        } else {
          startDate = new Date(current_date.getTime() - 48 * 60 * 60 * 1000);
          endDate = current_date;
          this.data = await http.getData(startDate, endDate);
        }
      } catch (err) {
        this.error = err.toString();
      } finally {
        this.loading = false;
      }
    },
    async fetchFanStatus () {
      this.fanError = null
      // replace `getPost` with your data fetching util / API wrapper
      try {
        let fanStatus = await http.getFanStatus()
        this.fanStatus = fanStatus
        this.fanActive = fanStatus.status
      } catch(err) {
        this.fanError = err.toString()
      }
    },
    async fetchFanConfig () {
      this.fanConfigError = null
      // replace `getPost` with your data fetching util / API wrapper
      try {
        let fanConfig = await http.getFanConfig()
        this.fanConfig = fanConfig
        this.onTemp = fanConfig.on_temp
        this.offTemp = fanConfig.off_temp
      } catch(err) {
        this.fanConfigError = err.toString()
      }
    },
    async setFanConfig (onTemp, offTemp, override) {
        this.fanConfigError = null
        // replace `getPost` with your data fetching util / API wrapper
        let config = this.fanConfig
        if (config) {
          try {
            let fanConfig = await http.setFanConfig(onTemp != null ? onTemp : config.on_temp,
               offTemp != null ? offTemp : config.off_temp, override != null ? override : config.override)
            this.fanConfig = fanConfig
            this.onTemp = fanConfig.on_temp
            this.offTemp = fanConfig.off_temp
          } catch(err) {
            this.fanConfigError = err.toString()
          }
        }
    },
    onScaleChange(scale) {
      this.scale = scale
      this.loading = true
      this.fetchData()
    },
    onTimeChange() {
      if (new Date(this.startDate) > new Date()) {
        this.startDate = null
        alert("Pick a date in the past please!")
        return
      }
      this.loading = true

      this.fetchData()
    },
    onFanToggle() {
      if (this.fanConfig) {
        this.setFanConfig(null, null, !this.fanConfig.override)
      }
    },
    onFanTempSet() {
      if (this.fanConfig) {
        this.setFanConfig(this.onTemp, this.offTemp, null)
      }
    }
  }
}
</script>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
$purple: #b39ae5;
$fan-color: #00a8f3;
.fan-controls {
  display: flex;

  .fan-temps {
    margin-left: auto;
    margin-right: 10px;
    display: flex;
    align-items: center;
    button {
      height: 30px;
      background-color: $purple;

      &:hover,
      &:active {

        background-color: darken($purple, 10%);
        border-color: darken($purple, 10%);
      }
    }

    input {
      width: 30px;
      height: 20px;
      margin-right: 10px;
    }
  }
  button {
    border-radius: 10px;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;

    img {
      width: 30px;
      height: 30px;
    }
    &.fan-on {
      background: white;
      border-color: $fan-color;
    }
    span.override-text {
      position: absolute;
      top: 32px;
      font-size: 8px;
      font-weight: bold;
    }
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
