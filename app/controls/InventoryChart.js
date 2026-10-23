sap.ui.define(['sap/ui/core/Control'], function (Control) {
  'use strict';
  return Control.extend('shocktwin.controls.InventoryChart', {
    metadata: { properties: { scenario: { type: 'object', defaultValue: null } } },
    renderer: {
      apiVersion: 2,
      render: function (rm, control) {
        const scenario = control.getScenario() || {};
        const stockout =
          scenario.daysToStockout == null
            ? 'beyond the displayed horizon'
            : 'day ' + scenario.daysToStockout;
        rm.openStart('div', control)
          .class('stInventoryChart')
          .attr('data-testid', 'simulation-chart')
          .attr('role', 'img')
          .attr(
            'aria-label',
            'Illustrative inventory comparison. Without action stock-out is ' +
              stockout +
              '. Replacement series and assumptions are shown in the metric cards.',
          )
          .attr('tabindex', '0')
          .openEnd()
          .close('div');
      },
    },
    onAfterRendering: function () {
      const element = this.getDomRef();
      const d3 = window.d3;
      const scenario = this.getScenario();
      if (!element || !d3 || !scenario) return;
      const width = Math.max(element.clientWidth, 650);
      const height = 360;
      const margin = { top: 25, right: 50, bottom: 46, left: 68 };
      const baseline = scenario.baselineSeries || [];
      const mitigated = scenario.mitigatedSeries || [];
      const all = baseline.concat(mitigated);
      const horizon =
        Number((scenario.assumptions || {}).horizon) ||
        d3.max(all, function (point) {
          return Number(point.day);
        }) ||
        30;
      const maxStock =
        d3.max(all, function (point) {
          return Number(point.stock);
        }) || 1800;
      const x = d3
        .scaleLinear()
        .domain([0, horizon])
        .range([margin.left, width - margin.right]);
      const y = d3
        .scaleLinear()
        .domain([0, maxStock * 1.09])
        .range([height - margin.bottom, margin.top]);
      d3.select(element).selectAll('*').remove();
      const svg = d3
        .select(element)
        .append('svg')
        .attr('viewBox', '0 0 ' + width + ' ' + height)
        .attr('aria-hidden', 'true');
      svg
        .append('g')
        .attr('class', 'stChartGrid')
        .attr('transform', 'translate(' + margin.left + ',0)')
        .call(
          d3
            .axisLeft(y)
            .ticks(4)
            .tickSize(-(width - margin.left - margin.right))
            .tickFormat(''),
        )
        .call(function (group) {
          group.select('.domain').remove();
        });
      svg
        .append('g')
        .attr('class', 'stChartAxis')
        .attr('transform', 'translate(0,' + (height - margin.bottom) + ')')
        .call(
          d3
            .axisBottom(x)
            .ticks(6)
            .tickFormat(function (value) {
              return 'Day ' + value;
            }),
        )
        .call(function (group) {
          group.select('.domain').attr('stroke', '#cad6d6');
        });
      svg
        .append('g')
        .attr('class', 'stChartAxis')
        .attr('transform', 'translate(' + margin.left + ',0)')
        .call(d3.axisLeft(y).ticks(4).tickFormat(d3.format(',')))
        .call(function (group) {
          group.select('.domain').remove();
        });
      svg
        .append('text')
        .attr('x', margin.left)
        .attr('y', 14)
        .attr('class', 'stChartUnits')
        .text('RESIN STOCK · UNITS');
      const line = d3
        .line()
        .x(function (point) {
          return x(Number(point.day));
        })
        .y(function (point) {
          return y(Number(point.stock));
        });
      svg
        .append('path')
        .datum(baseline)
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', '#718d94')
        .attr('stroke-width', 2.8);
      svg
        .append('path')
        .datum(mitigated)
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', '#c68929')
        .attr('stroke-width', 3.5);
      if (baseline.length) {
        const last = baseline[baseline.length - 1];
        svg
          .append('text')
          .attr('x', width - margin.right - 8)
          .attr('y', y(Number(last.stock)) - 15)
          .attr('text-anchor', 'end')
          .attr('class', 'stChartDirectLabel')
          .text('Without action');
      }
      if (mitigated.length) {
        const last = mitigated[mitigated.length - 1];
        svg
          .append('text')
          .attr('x', width - margin.right - 8)
          .attr('y', y(Number(last.stock)) - 15)
          .attr('text-anchor', 'end')
          .attr('class', 'stChartDirectLabel stChartAmberLabel')
          .text('With replacement');
      }
      if (scenario.daysToStockout != null) {
        const px = x(Number(scenario.daysToStockout));
        const py = y(0);
        svg
          .append('line')
          .attr('x1', px)
          .attr('x2', px)
          .attr('y1', margin.top + 25)
          .attr('y2', py)
          .attr('stroke', '#d2aa67')
          .attr('stroke-dasharray', '4 5');
        svg
          .append('circle')
          .attr('cx', px)
          .attr('cy', py)
          .attr('r', 5)
          .attr('fill', '#d7922d')
          .attr('stroke', 'white')
          .attr('stroke-width', 2);
        svg
          .append('rect')
          .attr('x', px - 66)
          .attr('y', margin.top)
          .attr('width', 132)
          .attr('height', 28)
          .attr('rx', 8)
          .attr('fill', '#fff0d5');
        svg
          .append('text')
          .attr('x', px)
          .attr('y', margin.top + 19)
          .attr('text-anchor', 'middle')
          .attr('class', 'stChartFailureLabel')
          .text('Day ' + scenario.daysToStockout + ' stock-out');
      }
      const switchDay = Number((scenario.assumptions || {}).switchDay);
      const switchPoint = mitigated.find(function (point) {
        return Number(point.day) === switchDay;
      });
      if (switchPoint && switchDay <= horizon) {
        const px = x(switchDay);
        const py = y(Number(switchPoint.stock));
        svg
          .append('circle')
          .attr('cx', px)
          .attr('cy', py)
          .attr('r', 4.5)
          .attr('fill', '#c68929')
          .attr('stroke', 'white')
          .attr('stroke-width', 2);
        svg
          .append('text')
          .attr('x', px + 10)
          .attr('y', py + 25)
          .attr('class', 'stChartSwitchLabel')
          .text('Day ' + switchDay + ' switch');
      }
    },
  });
});
