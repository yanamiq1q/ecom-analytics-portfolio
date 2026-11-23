// Chart configuration for the Olist insight report.
// All colours are read from the page's CSS variables so the charts stay in theme.
(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var bg = style.getPropertyValue('--bg').trim();

  var FONT = "'InstrumentSans', system-ui, sans-serif";
  var MONO = "'GeistMono', ui-monospace, monospace";

  var axisLabel = { color: muted, fontSize: 11, fontFamily: MONO };
  var axisLine = { lineStyle: { color: rule } };
  var splitLine = { lineStyle: { color: rule, type: 'dashed' } };
  var tooltip = {
    trigger: 'axis',
    appendToBody: true,
    backgroundColor: bg,
    borderColor: rule,
    borderWidth: 1,
    textStyle: { color: ink, fontSize: 12, fontFamily: FONT },
    axisPointer: { type: 'shadow', shadowStyle: { color: bg2 } }
  };
  var tipItem = {
    trigger: 'item',
    appendToBody: true,
    backgroundColor: bg,
    borderColor: rule,
    borderWidth: 1,
    textStyle: { color: ink, fontSize: 12, fontFamily: FONT }
  };

  function mount(id) {
    var el = document.getElementById(id);
    if (!el) return null;
    var chart = echarts.init(el, null, { renderer: 'svg' });
    window.addEventListener('resize', function () { chart.resize(); });
    return chart;
  }

  // ---------------------------------------------------------------- 01 reviews
  var review = mount('chart-review');
  if (review) {
    review.setOption({
      animation: false,
      grid: { left: 44, right: 16, top: 24, bottom: 52 },
      tooltip: Object.assign({}, tooltip, {
        valueFormatter: function (v) { return v.toFixed(2) + ' stars'; }
      }),
      xAxis: {
        type: 'category',
        data: ['Early', 'On time', '1–5 days late', '6–15 days late', '15+ days late'],
        axisLabel: Object.assign({}, axisLabel, { interval: 0, fontSize: 10 }),
        axisLine: axisLine,
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 5,
        name: 'avg review score',
        nameTextStyle: { color: muted, fontSize: 10, fontFamily: MONO, align: 'left' },
        nameGap: 14,
        axisLabel: axisLabel,
        axisLine: { show: false },
        splitLine: splitLine
      },
      series: [{
        type: 'bar',
        barWidth: '52%',
        data: [
          { value: 4.29, itemStyle: { color: accent } },
          { value: 4.04, itemStyle: { color: accent + 'b3' } },
          { value: 2.99, itemStyle: { color: accent2 + '99' } },
          { value: 1.74, itemStyle: { color: accent2 + 'cc' } },
          { value: 1.73, itemStyle: { color: accent2 } }
        ],
        label: {
          show: true,
          position: 'top',
          color: ink,
          fontSize: 11,
          fontFamily: MONO,
          formatter: function (p) { return p.value.toFixed(2); }
        }
      }]
    });
  }

  // ---------------------------------------------------------------- 02 distance
  var distance = mount('chart-distance');
  if (distance) {
    distance.setOption({
      animation: false,
      grid: { left: 44, right: 16, top: 24, bottom: 44 },
      tooltip: Object.assign({}, tooltip, {
        valueFormatter: function (v) { return v + '% late'; }
      }),
      xAxis: {
        type: 'category',
        data: ['<100 km', '100–500 km', '500–1,000 km', '1,000 km+'],
        axisLabel: Object.assign({}, axisLabel, { fontSize: 11 }),
        axisLine: axisLine,
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        name: 'late rate (%)',
        nameTextStyle: { color: muted, fontSize: 10, fontFamily: MONO, align: 'left' },
        nameGap: 14,
        max: 12,
        axisLabel: axisLabel,
        axisLine: { show: false },
        splitLine: splitLine
      },
      series: [{
        type: 'bar',
        barWidth: '40%',
        itemStyle: { color: accent },
        data: [4.5, 6.1, 7.1, 10.5],
        label: {
          show: true, position: 'top', color: ink, fontSize: 11, fontFamily: MONO,
          formatter: '{c}%'
        }
      }]
    });
  }

  // ---------------------------------------------------------------- 03 concentration
  var conc = mount('chart-concentration');
  if (conc) {
    conc.setOption({
      animation: false,
      grid: { left: 110, right: 24, top: 20, bottom: 36 },
      tooltip: Object.assign({}, tipItem, {
        formatter: function (p) { return p.seriesName + '<br/>' + p.marker + ' ' + p.value + '% of GMV'; }
      }),
      xAxis: {
        type: 'value',
        max: 100,
        axisLabel: Object.assign({}, axisLabel, { formatter: '{value}%' }),
        axisLine: { show: false },
        splitLine: splitLine
      },
      yAxis: {
        type: 'category',
        data: ['All sellers'],
        axisLabel: { show: false },
        axisLine: { show: false },
        axisTick: { show: false }
      },
      series: [
        {
          name: 'Top 10% of sellers',
          type: 'bar',
          stack: 'gmv',
          barWidth: 64,
          itemStyle: { color: accent },
          label: { show: true, color: bg, fontSize: 12, fontFamily: MONO, formatter: '67.6%' },
          data: [67.6]
        },
        {
          name: 'Next 10% of sellers',
          type: 'bar',
          stack: 'gmv',
          itemStyle: { color: accent + '99' },
          label: { show: true, color: ink, fontSize: 11, fontFamily: MONO, formatter: '15.1%' },
          data: [15.1]
        },
        {
          name: 'Bottom 80% of sellers',
          type: 'bar',
          stack: 'gmv',
          itemStyle: { color: accent2 + 'b3' },
          label: { show: true, color: ink, fontSize: 11, fontFamily: MONO, formatter: '17.3%' },
          data: [17.3]
        }
      ]
    });
  }

  // ---------------------------------------------------------------- 04 rfm
  var rfm = mount('chart-rfm');
  if (rfm) {
    rfm.setOption({
      animation: false,
      grid: { left: 44, right: 16, top: 34, bottom: 44 },
      legend: {
        top: 0,
        left: 0,
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { color: muted, fontSize: 11, fontFamily: MONO }
      },
      tooltip: Object.assign({}, tooltip, {
        valueFormatter: function (v) { return v + '%'; }
      }),
      xAxis: {
        type: 'category',
        data: ['Champions', 'At Risk', 'All other segments'],
        axisLabel: Object.assign({}, axisLabel, { fontSize: 11 }),
        axisLine: axisLine,
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        name: 'share (%)',
        nameTextStyle: { color: muted, fontSize: 10, fontFamily: MONO, align: 'left' },
        nameGap: 14,
        max: 72,
        axisLabel: axisLabel,
        axisLine: { show: false },
        splitLine: splitLine
      },
      series: [
        {
          name: 'Share of customers',
          type: 'bar',
          barWidth: '28%',
          itemStyle: { color: muted + '66' },
          data: [16.4, 15.5, 68.1],
          label: { show: true, position: 'top', color: muted, fontSize: 10, fontFamily: MONO, formatter: '{c}%' }
        },
        {
          name: 'Share of revenue',
          type: 'bar',
          barWidth: '28%',
          itemStyle: { color: accent },
          data: [30.2, 29.2, 40.6],
          label: { show: true, position: 'top', color: ink, fontSize: 10, fontFamily: MONO, formatter: '{c}%' }
        }
      ]
    });
  }

  // ---------------------------------------------------------------- 05 payments
  var pay = mount('chart-payments');
  if (pay) {
    pay.setOption({
      animation: false,
      tooltip: Object.assign({}, tipItem, {
        formatter: function (p) {
          return p.name + '<br/>' + p.marker + ' ' + p.value.toLocaleString() + ' orders (' + p.percent + '%)';
        }
      }),
      legend: {
        bottom: 0,
        left: 'center',
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { color: muted, fontSize: 11, fontFamily: MONO }
      },
      series: [{
        type: 'pie',
        radius: ['54%', '76%'],
        center: ['50%', '44%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: bg, borderWidth: 2 },
        label: { show: false },
        data: [
          { value: 99054, name: 'Reconciles exactly', itemStyle: { color: accent } },
          { value: 294, name: 'Overpaid (installment interest)', itemStyle: { color: accent2 } },
          { value: 93, name: 'Underpaid (vouchers, discounts)', itemStyle: { color: accent2 + '80' } }
        ]
      }],
      graphic: [
        { type: 'text', left: 'center', top: '38%', style: { text: '387', font: '400 30px ' + FONTSERIF(), fill: ink, textAlign: 'center' } },
        { type: 'text', left: 'center', top: '50%', style: { text: 'MISMATCHED', font: '400 10px ' + MONO, fill: muted, textAlign: 'center', letterSpacing: 1 } }
      ]
    });
  }

  function FONTSERIF() { return "'InstrumentSerif', Georgia, serif"; }

  // ---------------------------------------------------------------- 06 dose-response
  var dose = mount('chart-doseresponse');
  if (dose) {
    dose.setOption({
      animation: false,
      grid: { left: 46, right: 16, top: 24, bottom: 52 },
      tooltip: Object.assign({}, tooltip, {
        valueFormatter: function (v) { return v + '% late'; }
      }),
      xAxis: {
        type: 'category',
        data: ['Shipped on time', '≤1 day late', '1–3 days late', '3–7 days late', '7+ days late'],
        axisLabel: Object.assign({}, axisLabel, { interval: 0, fontSize: 10 }),
        axisLine: axisLine,
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        name: 'late rate (%)',
        nameTextStyle: { color: muted, fontSize: 10, fontFamily: MONO, align: 'left' },
        nameGap: 14,
        max: 66,
        axisLabel: axisLabel,
        axisLine: { show: false },
        splitLine: splitLine
      },
      series: [{
        type: 'bar',
        barWidth: '48%',
        data: [
          { value: 5.4, itemStyle: { color: accent } },
          { value: 11.6, itemStyle: { color: accent + 'cc' } },
          { value: 17.5, itemStyle: { color: accent2 + '99' } },
          { value: 25.4, itemStyle: { color: accent2 + 'cc' } },
          { value: 59.8, itemStyle: { color: accent2 } }
        ],
        label: {
          show: true, position: 'top', color: ink, fontSize: 11, fontFamily: MONO,
          formatter: '{c}%'
        }
      }]
    });
  }

  // ---------------------------------------------------------------- 06 attribution
  var attr = mount('chart-attribution');
  if (attr) {
    attr.setOption({
      animation: false,
      grid: { left: 110, right: 24, top: 20, bottom: 36 },
      tooltip: Object.assign({}, tipItem, {
        formatter: function (p) {
          return p.marker + ' ' + p.seriesName + ': ' + p.value + '% (' +
            Math.round(6533 * p.value / 100).toLocaleString() + ' orders)';
        }
      }),
      xAxis: {
        type: 'value', max: 100,
        axisLabel: Object.assign({}, axisLabel, { formatter: '{value}%' }),
        axisLine: { show: false },
        splitLine: splitLine
      },
      yAxis: {
        type: 'category', data: ['All late deliveries'],
        axisLabel: { show: false }, axisLine: { show: false }, axisTick: { show: false }
      },
      series: [
        {
          name: 'Handed over on time, late in transit',
          type: 'bar', stack: 'split', barWidth: 64,
          itemStyle: { color: accent },
          label: { show: true, color: bg, fontSize: 13, fontFamily: MONO, formatter: '72.4%' },
          data: [72.4]
        },
        {
          name: 'Handed over after the seller deadline',
          type: 'bar', stack: 'split',
          itemStyle: { color: accent2 },
          label: { show: true, color: bg, fontSize: 13, fontFamily: MONO, formatter: '27.6%' },
          data: [27.6]
        }
      ]
    });
  }

  // ---------------------------------------------------------------- 06 distance x overdue
  var dOverdue = mount('chart-distance-overdue');
  if (dOverdue) {
    dOverdue.setOption({
      animation: false,
      grid: { left: 46, right: 16, top: 34, bottom: 44 },
      legend: {
        top: 0, left: 0, itemWidth: 10, itemHeight: 10,
        textStyle: { color: muted, fontSize: 11, fontFamily: MONO }
      },
      tooltip: Object.assign({}, tooltip, {
        valueFormatter: function (v) { return v + '%'; }
      }),
      xAxis: {
        type: 'category',
        data: ['<100 km', '100–500 km', '500–1,000 km', '1,000 km+'],
        axisLabel: Object.assign({}, axisLabel, { fontSize: 11 }),
        axisLine: axisLine,
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        name: 'rate (%)',
        nameTextStyle: { color: muted, fontSize: 10, fontFamily: MONO, align: 'left' },
        nameGap: 14,
        max: 12,
        axisLabel: axisLabel,
        axisLine: { show: false },
        splitLine: splitLine
      },
      series: [
        {
          name: 'Shipped overdue',
          type: 'bar', barWidth: '26%',
          itemStyle: { color: muted + '80' },
          data: [9.5, 8.5, 8.8, 9.2],
          label: { show: true, position: 'top', color: muted, fontSize: 10, fontFamily: MONO, formatter: '{c}%' }
        },
        {
          name: 'Delivered late',
          type: 'bar', barWidth: '26%',
          itemStyle: { color: accent2 },
          data: [4.5, 6.1, 7.1, 10.5],
          label: { show: true, position: 'top', color: ink, fontSize: 10, fontFamily: MONO, formatter: '{c}%' }
        }
      ]
    });
  }

  // ---------------------------------------------------------------- 06 monthly
  var monthly = mount('chart-monthly');
  if (monthly) {
    var months = ['2017-01', '2017-02', '2017-03', '2017-04', '2017-05', '2017-06', '2017-07',
      '2017-08', '2017-09', '2017-10', '2017-11', '2017-12', '2018-01', '2018-02', '2018-03',
      '2018-04', '2018-05', '2018-06', '2018-07', '2018-08'];
    var overdue = [21.6, 17.3, 6.7, 7.2, 7.2, 7.8, 7.7, 6.7, 7.0, 7.7, 12.7, 10.8,
      10.0, 12.0, 8.4, 5.9, 6.4, 6.5, 8.7, 8.9];
    var late = [2.9, 3.0, 4.6, 6.6, 3.0, 3.0, 2.8, 2.9, 4.4, 4.2, 12.4, 7.5,
      5.7, 14.1, 19.0, 4.5, 6.6, 1.2, 3.4, 6.2];

    monthly.setOption({
      animation: false,
      grid: { left: 46, right: 24, top: 44, bottom: 64 },
      legend: {
        top: 0, left: 0, itemWidth: 10, itemHeight: 10,
        textStyle: { color: muted, fontSize: 11, fontFamily: MONO }
      },
      tooltip: Object.assign({}, tooltip, {
        valueFormatter: function (v) { return v + '%'; }
      }),
      xAxis: {
        type: 'category',
        data: months,
        boundaryGap: false,
        axisLabel: Object.assign({}, axisLabel, { rotate: 45, fontSize: 9, margin: 10 }),
        axisLine: axisLine,
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        name: 'rate (%)',
        nameTextStyle: { color: muted, fontSize: 10, fontFamily: MONO, align: 'left' },
        nameGap: 14,
        max: 24,
        axisLabel: axisLabel,
        axisLine: { show: false },
        splitLine: splitLine
      },
      series: [
        {
          name: 'Shipped overdue',
          type: 'line',
          smooth: false,
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: { color: accent, width: 1.6 },
          itemStyle: { color: accent },
          data: overdue
        },
        {
          name: 'Delivered late',
          type: 'line',
          smooth: false,
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: { color: accent2, width: 2 },
          itemStyle: { color: accent2 },
          data: late,
          markArea: {
            silent: true,
            itemStyle: { color: accent2 + '1a' },
            label: {
              show: true,
              position: 'top',
              distance: 6,
              rotate: 0,
              color: accent2,
              fontSize: 10,
              fontFamily: MONO,
              formatter: 'Mar 2018 · 8.4% overdue vs 19.0% late'
            },
            data: [[{ xAxis: '2018-03' }, { xAxis: '2018-03' }]]
          },
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { color: accent2, type: 'dashed', width: 1, opacity: 0.5 },
            label: { show: false },
            data: [{ xAxis: '2018-03' }]
          }
        }
      ]
    });
  }
})();
