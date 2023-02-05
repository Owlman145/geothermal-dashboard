<template>
  <div class='chart-el' ref="chartdiv"></div>
</template>

<script>
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";

am4core.useTheme(am4themes_animated);


export default {
  name: 'WaterTempChart',
  props: {
    data: Array,
    scale: String
  },
  data () {
    return {
      loading: false,
      error: null
    }
  },
  mounted () {
    this.createChart()
  },

  beforeDestroy() {
    if (this.chart) {
      this.chart.dispose();
    }
  },
  methods: {
    createChart() {
      let tension = 0.8

      let chart = am4core.create(this.$refs.chartdiv, am4charts.XYChart);
      chart.hiddenState.properties.opacity = 0; // this creates initial fade-in

      chart.paddingRight = 20;

      let data = this.data || []

      if (this.scale === "daily") {
        chart.data = data.map(row => {
          return {
            name: row.id,
            date: new Date(row.date),
            temp: parseFloat(row.water_temperature)
          }
        })
      } else {
        chart.data = data.map(row => {
          return {
            name: row.id,
            date: new Date(row.id),
            temp_max: parseFloat(row.water_temperature_max),
            temp: parseFloat(row.water_temperature_mean),
            temp_min: parseFloat(row.water_temperature_min),
          }
        })
      }

      //chart.data = data || [];

      let dateAxis = chart.xAxes.push(new am4charts.DateAxis());
      dateAxis.renderer.grid.template.location = 10;

      let valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
      valueAxis.tooltip.disabled = true;
      valueAxis.renderer.minWidth = 35;
      valueAxis.title.text = "Temperature (°C)"

      let series1 = chart.series.push(new am4charts.LineSeries());
      series1.dataFields.dateX = "date";
      series1.dataFields.valueY = "temp";
      series1.tensionX = tension;
      series1.stroke = chart.colors.getIndex(1);


      if (this.scale === 'daily') {
        series1.tooltipText = "Water Temp: {valueY.value}";
        series1.name = "Water Temperature";
      } else {
        series1.name = "Water Temperature (mean)";

        let series3 = chart.series.push(new am4charts.LineSeries());
        series3.name = "Water Temperature (max)";
        series3.dataFields.dateX = "date";
        series3.dataFields.valueY = "temp_max";
        series3.dataFields.openValueY = "temp_min";
        series3.dataFields.meanValueY = "temmp";
        series3.tooltipText = "mean: {meanValueY.value} min: {openValueY.value} max:{valueY.value}";
        series3.sequencedInterpolation = true;
        series3.fillOpacity = 0.3;
        series3.defaultState.transitionDuration = 0;
        series3.tensionX = tension;
        series3.stroke = chart.colors.getIndex(2);
        series3.adapter.add("tooltipText", function() {
          let text = "[bold]{date}[/]\n"
          let indoorSeries = [chart.series.getIndex(1), chart.series.getIndex(0), chart.series.getIndex(2)]
          indoorSeries.forEach(function(item) {
            if (item.name)
              text += "[" + item.stroke.hex + "]●[/] " + item.name + ": {" + item.dataFields.valueY + "}\n";
          })
          return text;
        });

        let series4 = chart.series.push(new am4charts.LineSeries());
        series4.name = "Water Temperature (min)";
        series4.dataFields.dateX = "date";
        series4.dataFields.valueY = "temp_min";
        series4.sequencedInterpolation = true;
        series4.defaultState.transitionDuration = 10;
        series4.stroke = chart.colors.getIndex(0);
        series4.tensionX = tension;
      }

      if (this.scale !== "monthly") {
        chart.dateFormatter.dateFormat = "yyyy-MM-dd HH:mm";
      }

      chart.cursor = new am4charts.XYCursor();

      let scrollbarX = new am4charts.XYChartScrollbar();
      scrollbarX.series.push(series1);
      chart.scrollbarX = scrollbarX;

      this.chart = chart;
    },
  }
}
</script>

<style scoped>
.chart-el {
  width: 100%;
  height: 500px;
}
</style>
