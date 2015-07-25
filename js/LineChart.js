import _ from 'lodash';
import d3 from 'd3';
import React from 'react';

const yAxisLabelWidth = 54;
const yAxisTickPadding = 8;
const eventHeight = 34;
const eventWidth = 100;
const checkboxSize = 18;
const checkboxPadding = eventHeight / 2 - checkboxSize / 2;
const dateHeight = 34;
const pointCount = 15;

// Why mix DOM and SVG?
// - For many components we want to use with charts (checkboxes, dropdowns), we have components defined using the DOM that we want to reuse. It would be a waste of effort to reimplement these components in SVG.
// - SVG requires manual layout. This is high effort with low reward, unless there are hundreds of data points. For example, chart data or axes are ideal for SVG, but interactive legends are easier to implement with the DOM.

function update(options) {
  console.log('LineChart: Update:', options);
  const svg = d3.select(options.svgElement);
  const width = svg.attr('width');
  const height = svg.attr('height');
  const graphHeight = height - eventHeight - dateHeight;

  // Compare events
  const eventsGroup = svg.append('g');
  eventsGroup.append('rect')
    .classed('events', true)
    .attr('width', width)
    .attr('height', eventHeight);
  const eventColorScale = d3.scale.ordinal()
    .range(['rgb(83,163,235)', 'rgb(50,187,189)', 'rgb(162,140,203)', 'rgb(218,123,128)']);
  const checkboxGroup = svg.selectAll('.checkbox-group')
      // TODO Calculate ellipsis for text...
      .data(['Song play', 'Song pla...']);
  const checkboxGroupEnter = checkboxGroup.enter().append('g')
    .classed('checkbox-group', true)
    .attr('transform', (d, i) => {
      return 'translate(' + (eventWidth * i) + ',0)';
    })
    .on('click', function (d) {
      update({
        events: options.events.concat(d),
        t: options.t,
        data: options.data
      });
    });
  checkboxGroupEnter.append('rect')
    .classed('checkbox-group-background', true)
    .attr('width', eventWidth)
    .attr('height', eventHeight);
  checkboxGroupEnter.append('rect')
    .classed('checkbox', true)
    .classed('active', d => {
      return _(options.events).contains(d);
    })
    .attr('x', checkboxPadding)
    .attr('y', checkboxPadding)
    .attr('width', checkboxSize)
    .attr('height', checkboxSize)
    .attr('rx', 4)
    .attr('ry', 4)
    .style('fill', d => {
      return _(options.events).contains(d) ? eventColorScale(d) : 'white';
    });
  checkboxGroupEnter.append('line')
    .classed('checkbox-group-border', true)
    .attr('x1', eventWidth)
    .attr('y1', 0)
    .attr('x2', eventWidth)
    .attr('y2', eventHeight);
  checkboxGroupEnter.append('text')
    .attr('x', checkboxSize + 2 *checkboxPadding)
    .attr('y', eventHeight / 2)
    .text(d => d);
  checkboxGroupEnter.append('text')
    .classed('check', true)
    .attr('x', checkboxPadding + checkboxSize / 2)
    .attr('y', eventHeight / 2)
    .text('\uf00c');

  const graphArea = svg.append('g')
    .attr('transform', 'translate(0,' + eventHeight + ')');
  graphArea.append('rect')
    .classed('graph-area-background', true)
    .attr('width', width)
    .attr('height', graphHeight);

  const yAxisLabelBackground = graphArea.append('rect')
    .classed('y-axis-label-background', true)
    .attr('width', yAxisLabelWidth)
    .attr('height', graphHeight)
    .attr('rx', 5)
    .attr('ry', 5);

  const yAxisLabelBorder = graphArea.append('line')
    .classed('y-axis-label-border', true)
    .attr('x1', yAxisLabelWidth)
    .attr('y1', 0)
    .attr('x2', yAxisLabelWidth)
    .attr('y2', graphHeight);

  const yScale = d3.scale.linear()
    .domain([0, 25])
    .range([graphHeight, 0]);

  const yAxis = d3.svg.axis()
    .scale(yScale)
    .orient('left')
    .tickValues(yScale.ticks(5).slice(1, -1))
    .tickSize(-(width - yAxisLabelWidth - 2 * yAxisTickPadding), 0)
    .tickPadding(2 * yAxisTickPadding);

  const yAxisGroup = graphArea.append('g')
    .attr('transform', 'translate(' + (yAxisLabelWidth + yAxisTickPadding) + ',0)')
    .classed('y-axis', true)
    .call(yAxis);

  const chartArea = graphArea.append('g')
    .attr('transform', 'translate(' + yAxisLabelWidth + ',0)');
  const xScale = d3.time.scale()
    .domain(d3.extent(options.t))
    .range([0, width - yAxisLabelWidth - 2 * yAxisTickPadding]);
  const xAxis = d3.svg.axis()
    .scale(xScale)
    .orient('bottom')
    .tickValues(_(options.t).filter((d, i) => {
      return i % 2 === 0;
    }).slice(1, -1).value())
    .tickFormat(d3.time.format('%b %-d'))
    .tickSize(0)
    .tickPadding(12);
  const xAxisGroup = chartArea.append('g')
    .classed('x-axis', true)
    .attr('transform', 'translate(0,' + graphHeight + ')')
    .call(xAxis);

  graphArea.append('line')
    .classed('graph-area-border', true)
    .attr('x1', 0)
    .attr('y1', 0)
    .attr('x2', width)
    .attr('y2', 0);

  // TODO Draw this BELOW the data points.
  const cardBorder = svg.append('rect')
    .classed('card-border', true)
    .attr('width', width)
    .attr('height', height - dateHeight)
    .attr('rx', 5)
    .attr('ry', 5);

  // TODO .points-group with ALL event names.
  const eventName = 'Song play';
  const pointsGroup = chartArea.selectAll('.points-group')
    .data(_(options.data).map((v, k) => {
      return {
        eventName: k,
        data: v
      };
    }).value());
  pointsGroup.enter().append('g')
  pointsGroup.classed('pointsGroup', true)
    .attr('transform', 'translate(' + yAxisTickPadding + ',0)');
  pointsGroup.exit().remove();
  const pointGroup = pointsGroup.selectAll('.point-group')
    .data(function (d) {
      return _(d.data).map(value => {
        return {
          eventName: d.eventName,
          value: value
        };
      }).value();
    });
  pointGroup.enter().append('g');
  pointGroup.classed('pointGroup', true)
    .attr('transform', (d, i) => {
      return 'translate(' + xScale(options.t[i]) + ',' + yScale(d.value) + ')';
    });
  pointGroup.exit().remove();
  const pointHalo = pointGroup.selectAll('.point-halo')
    .data(d => {
      return [d];
    });
  pointHalo.enter().append('circle');
  pointHalo.classed('point-halo', true)
    .attr('r', 7);
  pointHalo.exit().remove();
  const point = pointGroup.selectAll('.point')
    .data(d => {
      return [d];
    });
  point.enter().append('circle');
  point.classed('point', true)
    .attr('r', 4)
  .style('fill', d => {
    return eventColorScale(d.eventName);
  });
  point.exit().remove();

  const lineGenerator = d3.svg.line()
    .x((d, i) => {
      return xScale(options.t[i]);
    })
    .y(d => {
      return yScale(d);
    });
  const line = pointsGroup.selectAll('.line')
    .data(d => {
      return [d];
    });
  line.enter().append('path');
  line.classed('line', true)
    .attr('d', d => {
      return lineGenerator(d.data);
    })
    .style('stroke', d => {
      return eventColorScale(d.eventName);
    });
  line.exit().remove('path');
}

class LineChart extends React.Component {
  static defaultProps = {
    events: ['Song play', 'Song pla...'],
    // Data is graphed together so must share a time scale.
    t: _(_.range(pointCount)).map(i => {
      return new Date(2015, 7, 1 + i);
    }).value(),
    data: {
      'Song play': _(_.range(pointCount)).map(i => {
        return i < 3 ?
          0 :
          10 + (i % 5);
      }).value(),
      'Song pla...':  _(_.range(pointCount)).map(i => {
        return 5 + (i % 2);
      }).value()
    }
  };

  componentDidMount() {
    update({
      events: this.props.events,
      t: this.props.t,
      data: this.props.data,
      svgElement: React.findDOMNode(this)
    });
  }

  render() {
    return <svg width={400} height={300}/>;
  }
}

export default LineChart;
