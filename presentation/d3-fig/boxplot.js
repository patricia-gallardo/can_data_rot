function makeBoxplotContext(items) {
    const margin = {top: 200, right: 100, bottom: 200, left: 200};
    const padding = {top: 0, right: 100, bottom: 0, left: 200};
    const width = window.innerWidth - margin.left - margin.right;
    const height = Math.min(860, window.innerHeight - margin.top - margin.bottom);

    console.log("Height : " + height)

    const svg = makeSvg(width, height, margin)

    let context = {
        items: items,
        svg: svg,
        margin: margin,
        padding: padding,
        width: width,
        height: height,
    };
    renderBoxplot(context);
    return context;
}

function makeSvg(width, height, margin) {
    return d3.select("body").append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
        .attr("transform", "translate("
            + margin.left + "," + margin.top + ")")
}

function renderBoxplot(context) {
    const yScale = d3.scaleBand()
        .domain(context.items.map(function (d) {
            return d.label
        }))
        .range([context.height - (context.padding.top + context.padding.bottom), context.padding.bottom])
        .padding(0.4);

    const yAxis = d3.axisLeft(yScale);

    context.svg.append("g")
        .style('font-size', '20px')
        .style('font-family', '"Fira Sans", sans-serif')
        .style('font-weight', '400')
        .attr("transform", "translate(" + context.padding.left + "," + 0 + ")")
        .call(yAxis);

    const xScale = d3.scaleLinear()
        .domain([2002, 2025])
        .range([context.padding.left, context.width - (context.padding.left + context.padding.right)]);

    const xAxis = d3.axisBottom(xScale).tickFormat((d) => d);

    context.svg.append("g")
        .style('font-size', '20px')
        .style('font-family', '"Fira Sans", sans-serif')
        .style('font-weight', '400')
        .attr("transform", "translate(" + 0 + "," + (context.height - (context.padding.top + context.padding.bottom)) + ")")
        .call(xAxis);

    context.svg.selectAll("foo")
        .data(context.items)
        .enter()
        .append("rect")
        .attr("fill", (d) => d.color)
        .attr("stroke", "black")
        .attr("y", function (d) {
            return yScale(d.label)
        })
        .attr("width", function (d) {
            return xScale(d.max) - xScale(d.min)
        })
        .attr("x", function (d) {
            return xScale(d.min)
        })
        .attr("height", yScale.bandwidth());
}
