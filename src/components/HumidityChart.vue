<template>
  <div class='chart-el' ref="chartdiv"></div>
</template>

<script>
import * as am4core from "@amcharts/amcharts4/core";
import * as am4charts from "@amcharts/amcharts4/charts";
//import am4themes_animated from "@amcharts/amcharts4/themes/animated";

//am4core.useTheme(am4themes_animated);


export default {
  name: 'HumidityChart',
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

      chart.paddingRight = 20;

      let data = this.data || []

      if (this.scale === "daily") {
        chart.data = data.map(row => {
          return {
            name: row.id,
            date: new Date(row.date),
            input: parseFloat(row.input_humidity)
          }
        })
      } else {
        chart.data = data.map(row => {
          return {
            name: row.id,
            date: new Date(row.id),
            input_max: parseFloat(row.input_humidity_max),
            input: parseFloat(row.input_humidity_mean),
            input_min: parseFloat(row.input_humidity_min),
          }
        })
      }

      //chart.data = data || [];

      let dateAxis = chart.xAxes.push(new am4charts.DateAxis());
      dateAxis.renderer.grid.template.location = 0;

      let valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
      valueAxis.tooltip.disabled = true;
      valueAxis.renderer.minWidth = 35;
      valueAxis.title.text = "Humidity (%)"

      let series1 = chart.series.push(new am4charts.LineSeries());
      series1.dataFields.dateX = "date";
      series1.dataFields.valueY = "input";
      series1.tensionX = tension;
      series1.stroke = chart.colors.getIndex(1);


      if (this.scale === 'daily') {
        series1.tooltipText = " Humidity: {valueY.value}";
        series1.name = "Humidity";
      } else {
        series1.name = "Humidity (mean)";

        let series3 = chart.series.push(new am4charts.LineSeries());
        series3.name = "Humidity (max)";
        series3.dataFields.dateX = "date";
        series3.dataFields.valueY = "input_max";
        series3.dataFields.openValueY = "input_min";
        series3.dataFields.meanValueY = "input";
        series3.tooltipText = "mean: {meanValueY.value} min: {openValueY.value} max:{valueY.value}";
        series3.sequencedInterpolation = true;
        series3.fillOpacity = 0.3;
        series3.defaultState.transitionDuration = 1000;
        series3.tensionX = tension;
        series3.stroke = chart.colors.getIndex(2);
        series3.adapter.add("tooltipText", function() {
          let text = "[bold]{date}[/]\n"
          let inputSeries = [chart.series.getIndex(2), chart.series.getIndex(0), chart.series.getIndex(3)]
          inputSeries.forEach(function(item) {
            if (item.name)
              text += "[" + item.stroke.hex + "]●[/] " + item.name + ": {" + item.dataFields.valueY + "}\n";
          })
          return text;
        });

        let series4 = chart.series.push(new am4charts.LineSeries());
        series4.name = "Input Humidity (min)";
        series4.dataFields.dateX = "date";
        series4.dataFields.valueY = "input_min";
        series4.sequencedInterpolation = true;
        series4.defaultState.transitionDuration = 1500;
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
