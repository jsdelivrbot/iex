import * as d3 from 'd3';

export function lineChart(element, data) {
    const days = (data.range) ? data.data : data;

    if (element.innerHTML) {
        element.innerHTML = '';
    }

    const width = element.clientWidth;
    const height = element.clientHeight;

    const margin = {top: 20, bottom: 30, left: 8 * 5, right: 16};
    const svgWidth = width - margin.left - margin.right;
    const svgHeight = height - margin.top - margin.bottom;

    const firstDay = days[0];
    const lastDay = days[days.length - 1];

    const [minClose, maxClose] = d3.extent(days, (d) => d.close);
    const closeDelta = (maxClose - minClose);

    const [minVolume, maxVolume] = d3.extent(days, (d) => d.volume);

    const x = d3.scaleTime()
        .domain([new Date(firstDay.date), new Date(lastDay.date)])
        .range([0, svgWidth]);

    const y = d3.scaleLinear()
        .domain([(minClose - Math.ceil((closeDelta * .1))), maxClose + Math.ceil((closeDelta * .1))])
        .range([svgHeight * .65, 0]);

    const xVolumeScale = d3.scaleBand()
        .rangeRound([0, svgWidth])
        .domain(days.map(d => d.date))
        .padding(.3);

    const yVolumeScale = d3.scaleLinear()
        .domain([minVolume, maxVolume])
        .range([svgHeight, svgHeight * .70]);

    const line = d3.line()
        .x((d) => {
            const date = new Date(d.date);
            return x(date);
        })
        .y((d) => {
            return y(d.close);
        });

    const xAxis = d3.axisBottom(x)
        .ticks(4);

    const yAxis = d3.axisLeft(y).tickSizeOuter(0);

    const yVolume = d3.axisLeft(yVolumeScale).ticks(3).tickSizeOuter(0).tickFormat(d3.format('~s'));

    const svg = d3.select(element)
        .append('svg')
        .attr('class', 'line-chart')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', `translate(0,${svgHeight})`)
        .call(xAxis);

    svg.append('g')
        .attr('class', 'y axis')
        .call(yAxis);

    svg.append('g')
        .attr('class', 'volume axis')
        .call(yVolume);

    svg.append("path")
        .datum(days)
        .attr("fill", "none")
        .attr("stroke", '#0d9da8')
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1.5)
        .attr("d", line);

    svg.selectAll(".bar")
        .data(days)
        .enter().append("rect")
        .attr("class", "bar")
        .style('fill', '#0d9da8')
        .style('opacity', .5)
        .attr("x", function (d, i) {
            const date = new Date(d.date);
            return x(date);
        })
        .attr("y", function (d) {
            return yVolumeScale(d.volume);
        })
        .attr("width", xVolumeScale.bandwidth())
        .attr("height", function (d) {
            return svgHeight - yVolumeScale(d.volume);
        });
}

export function dynamicLineChart(element, data) {

    const days = (data.range) ? data.data : data;

    const width = element.clientWidth;
    const height = element.clientHeight;

    const margin = {top: 20, bottom: 30, left: 8 * 5, right: 16};
    const svgWidth = width - margin.left - margin.right;
    const svgHeight = height - margin.top - margin.bottom;

    const [minClose, maxClose] = d3.extent(days, (d) => d.average);
    const closeDelta = (maxClose - minClose);

    const [minVolume, maxVolume] = d3.extent(days, (d) => d.volume);

    const timeParse = d3.timeParse("%H:%M");
    const formatTime = d3.timeFormat("%H:%M");

    let svg;

    const x = d3.scaleTime()
        .domain([timeParse('9:30'), timeParse('16:00')])
        .range([0, svgWidth]);

    const y = d3.scaleLinear()
        .domain([(minClose - Math.ceil((closeDelta * .1))), maxClose + Math.ceil((closeDelta * .1))])
        .range([svgHeight * .65, 0]);

    const minutes = d3.timeMinutes(timeParse('9:30'), timeParse('16:00'), 1);

    const xVolumeScale = d3.scaleBand()
        .rangeRound([0, svgWidth])
        .domain(minutes)
        .padding(.3);

    const yVolumeScale = d3.scaleLinear()
        .domain([minVolume, maxVolume])
        .range([svgHeight, svgHeight * .70]);

    const line = d3.line()
        .x((d) => {
            const date = timeParse(d.minute);
            return x(date);
        })
        .y((d) => {
            return y(d.average);
        });

    const xAxis = d3.axisBottom(x)
        .tickFormat(formatTime)
        .ticks(10);

    const yAxis = d3.axisLeft(y).tickSizeOuter(0);

    const yVolume = d3.axisLeft(yVolumeScale).ticks(3).tickSizeOuter(0).tickFormat(d3.format('~s'));

    if (!d3.select(element).select('svg').empty()) {
        updateBars();
        updateLine();
    } else {
        svg = d3.select(element)
            .append('svg')
            .attr('class', 'line-chart')
            .attr('width', width)
            .attr('height', height - 5)
            .append('g')
            .attr('class', 'dynamic')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        svg.append('g')
            .attr('class', 'x axis')
            .attr('transform', `translate(0,${svgHeight})`)
            .call(xAxis);

        svg.append('g')
            .attr('class', 'y axis')
            .call(yAxis);

        svg.append('g')
            .attr('class', 'volume axis')
            .call(yVolume);

        svg.append("path")
            .datum(days)
            .attr('class', '.line')
            .attr("fill", "none")
            .attr("stroke", '#0d9da8')
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("stroke-width", 1.5)
            .attr("d", line)
            .transition()
            .duration(500)
            .ease(d3.easeLinear);

        const bars = svg.selectAll(".bar")
            .data(days);

        bars.enter().append("rect")
            .attr("class", "bar")
            .style('fill', '#0d9da8')
            .style('opacity', .5)
            .attr("x", function (d, i) {
                const date = timeParse(d.minute);
                return x(date);
            })
            .attr("y", function (d) {
                return yVolumeScale(d.volume);
            })
            .attr("width", xVolumeScale.bandwidth())
            .attr("height", 0)
            .transition().duration(1000)
            .attr("height", function (d) {
                return svgHeight - yVolumeScale(d.volume);
            });
    }

    function updateBars() {
        const svg = d3.select(element).select('svg > g');

        const bars = svg.selectAll(".bar")
            .data(days);

        bars.enter().append("rect")
            .attr("class", "bar")
            .style('fill', '#0d9da8')
            .style('opacity', .5)
            .attr("x", function (d, i) {
                const date = timeParse(d.minute);
                return x(date);
            })
            .attr("y", function (d) {
                return yVolumeScale(d.volume);
            })
            .attr("width", xVolumeScale.bandwidth())
            .attr("height", 0)
            .transition().duration(1000)
            .attr("height", function (d) {
                return svgHeight - yVolumeScale(d.volume);
            });
    }

    function updateLine() {
        const svg = d3.select(element).select('svg > g');

        svg.select(".line").remove();

        svg.append("path")
            .datum(days)
            .attr('class', '.line')
            .attr("fill", "none")
            .attr("stroke", '#0d9da8')
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("stroke-width", 1.5)
            .attr("d", line);
    }

}