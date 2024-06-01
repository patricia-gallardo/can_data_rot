function makeBoxplotContext(items) {
    const margin = {top: 200, right: 100, bottom: 200, left: 200};
    const padding = {top: 0, right: 100, bottom: 0, left: 200};
    const width = window.innerWidth - margin.left - margin.right;
    const height = Math.min(860, window.innerHeight - margin.top - margin.bottom);

    const svg = makeSvg(width, height, margin)

    let xDomain = [2002, 2025];
    let yDomain = items.map(function (d) { return d.label });

    const {yScale, xScale} = renderAxes(svg, xDomain, yDomain, width, height, padding);

    return {
        items: [],
        _items: items,
        svg: svg,
        margin: margin,
        padding: padding,
        xScale: xScale,
        yScale: yScale,
    };
}

function makeSvg(width, height, margin) {
    return d3.select("body").append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
        .attr("transform", "translate("
            + margin.left + "," + margin.top + ")")
}

function renderAxes(svg, xDomain, yDomain, width, height, padding) {
    const {yScale, yAxis} = getYaxis(yDomain, height, padding);
    const {xScale, xAxis} = getXaxis(xDomain, width, padding);
    renderYaxis(svg, yAxis, padding);
    renderXaxis(svg, xAxis, padding, height);
    return {yScale, xScale};
}

function renderYaxis(svg, yAxis, padding) {
    svg.append("g")
        .style('font-size', '20px')
        .style('font-family', '"Fira Sans", sans-serif')
        .style('font-weight', '400')
        .attr("transform", "translate(" + padding.left + "," + 0 + ")")
        .call(yAxis);
}

function renderXaxis(svg, xAxis, padding, height) {
    svg.append("g")
        .style('font-size', '20px')
        .style('font-family', '"Fira Sans", sans-serif')
        .style('font-weight', '400')
        .attr("transform", "translate(" + 0 + "," + (height - (padding.top + padding.bottom)) + ")")
        .call(xAxis);
}

function getYaxis(yDomain, height, padding) {
    const yScale = d3.scaleBand()
        .domain(yDomain)
        .range([height - (padding.top + padding.bottom), padding.bottom])
        .padding(0.4);

    const yAxis = d3.axisLeft(yScale);
    return {yScale, yAxis};
}

function getXaxis(xDomain, width, padding) {
    const xScale = d3.scaleLinear()
        .domain(xDomain)
        .range([padding.left, width - (padding.left + padding.right)]);

    const xAxis = d3.axisBottom(xScale).tickFormat((d) => d);
    return {xScale, xAxis};
}

function showAll(context) {
    console.log("[showAll]")
    context.items = context._items
    renderBoxplot(context)
}

function hideAll(context) {
    console.log("[hideAll]")
    context.items = []
    renderBoxplot(context)
}

function labels(items) {
    return JSON.stringify(items.map((item) => item.label));
}

function addItem(itemName, context) {
    console.log("[addItem] " + itemName)
    const found = context._items.find((item) => item.id === itemName);

    console.log("[addItem] before " + labels(context.items))
    context.items = context._items.filter((item) => (item === found || context.items.includes(item)));
    console.log("[addItem] after " + labels(context.items))

    renderBoxplot(context)
}

function removeItem(itemName, context) {
    console.log("[removeItem] " + itemName)
    const found = context._items.find((item) => item.id === itemName);

    console.log("[removeItem] before " + labels(context.items))
    context.items = context.items.filter((item) => item !== found);
    console.log("[removeItem] after " + labels(context.items))

    renderBoxplot(context)
}

function renderRect(node, nodeEnter, context, { left, right, fill }) {
    // Add Box for the nodes
    nodeEnter.append('rect')
        .attr('class', 'box')
        .attr("y", function (d) {
            return context.yScale(d.label)
        })
        .attr("width", function (d) {
            return context.xScale(right(d)) - context.xScale(left(d))
        })
        .attr("x", function (d) {
            return context.xScale(left(d))
        })
        .attr("height", context.yScale.bandwidth())

    // UPDATE
    const nodeUpdate = nodeEnter.merge(node);

    // Update the node attributes and style
    nodeUpdate
        .attr("fill", (d) => fill(d))
        .attr("stroke", (d) => d.color);
}

function renderBoxplot(context) {
    console.log("Items to be rendered " + labels(context.items))

    // Update the nodes...
    const node = context.svg.selectAll('g.box').data(context.items)

    const nodeEnter = node.enter().append('g')
        .attr('class', 'box');

    renderRect(node, nodeEnter, context, { left: (d) => d.min, right: (d) => d.max, fill: (d) => d.color });

    // Remove any exiting nodes
    const duration = 0
    const nodeExit = node.exit().transition()
        .duration(duration)
        .remove();
}
