document.body.style.overflow = 'hidden';

function makeBoxplotContext(items, margins, paddings) {
    const margin = margins ? margins : {top: 0, right: 0, bottom: 0, left: 0};
    const padding = paddings ? paddings : {top: 0, right: 0, bottom: 0, left: 300};
    const width = window.innerWidth - margin.left - margin.right;
    const height = Math.min(860, window.innerHeight - margin.top - margin.bottom);

    const svg = makeSvg(width, height, margin)

    let xDomain = [2002, 2025];
    let yDomain = items.map(function (d) {
        return d.label
    });

    const {yScale, xScale} = renderAxes(svg, xDomain, yDomain, width, height, padding);

    let context = {
        items: [],
        _items: items,
        svg: svg,
        margin: margin,
        padding: padding,
        xScale: xScale,
        yScale: yScale,
    };

    d3.select(window).on("resize", function () {
        console.log("Window resized")
        const width = window.innerWidth - margin.left - margin.right;
        const height = Math.min(860, window.innerHeight - margin.top - margin.bottom);
        removeXaxis(svg)
        removeYaxis(svg)
        const {yScale, xScale} = renderAxes(svg, xDomain, yDomain, width, height, padding);
        context.yScale = yScale
        context.xScale = xScale
        removeBoxes(svg)
        renderBoxplot(context)
    });

    return context;
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
    renderYaxis(svg, yAxis, padding, yScale);
    renderXaxis(svg, xAxis, padding, height, yScale);
    return {yScale, xScale};
}

function renderYaxis(svg, yAxis, padding, yScale) {
    svg.append("g")
        .attr('class', 'yaxis')
        .style('font-size', fontSize(yScale))
        .style('font-family', '"Fira Sans", sans-serif')
        .style('font-weight', '300')
        .attr("transform", "translate(" + padding.left + "," + 0 + ")")
        .call(yAxis);
}

function renderXaxis(svg, xAxis, padding, height, yScale) {
    svg.append("g")
        .attr('class', 'xaxis')
        .style('font-size', fontSize(yScale))
        .style('font-family', '"Fira Sans", sans-serif')
        .style('font-weight', '300')
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

function removeXaxis(svg) {
    const node = svg.selectAll('g.xaxis')
    node.remove()
}

function removeYaxis(svg) {
    const node = svg.selectAll('g.yaxis')
    node.remove()
}

function removeBoxes(svg) {
    const node = svg.selectAll('g.box')
    node.remove()
}

function showAll(context) {
    console.log("[showAll]")
    context.items = context._items
    context.items.map((item) => { item.isGray = false })
    removeBoxes(context.svg)
    renderBoxplot(context)
}

function hideAll(context) {
    console.log("[hideAll]")
    context.items = []
    removeBoxes(context.svg)
    renderBoxplot(context)
}

function labels(items) {
    return JSON.stringify(items.map((item) => item.label + " (" + item.id + ")"));
}

function addItem(id, context) {
    console.log("[addItem] " + id)
    addItems([id], context)
}

function addItems(ids, context) {
    console.log("[addItems] " + JSON.stringify(ids))

    ids.map((id) => {
        const found = context._items.find((item) => item.id === id);
        console.log("[addItems] before " + labels(context.items))
        context.items = context._items.filter((item) => (item === found || context.items.includes(item)));
        console.log("[addItems] after " + labels(context.items))
    })

    removeBoxes(context.svg)
    renderBoxplot(context)
}

function removeItem(id, context) {
    console.log("[removeItem] " + id)
    removeItems([id], context)
}

function removeItems(ids, context, colorAll) {
    console.log("[removeItems] " + JSON.stringify(ids))

    if (colorAll)
        context.items.map((item) => { item.isGray = false})

    ids.map((id) => {
        const found = context._items.find((item) => item.id === id);
        console.log("[removeItems] before " + labels(context.items))
        context.items = context.items.filter((item) => item !== found);
        console.log("[removeItems] after " + labels(context.items))
    })

    removeBoxes(context.svg)
    renderBoxplot(context)
}

function grayOut(ids, context) {
    console.log("[grayOut] " + JSON.stringify(ids))

    ids.map((id) => {
        const found = context._items.find((item) => item.id === id);
        found.isGray = true
    })
    context.items = context._items

    removeBoxes(context.svg)
    renderBoxplot(context)
}

function fillRect(d, fill) {
    let color = fill(d);
    return d.isGray ? gray(color) : color;
}

function strokeRect(d) {
    let color = d.color;
    return d.isGray ? "#000" : color;
}
function gray(col)
{
    if (col.length === 9)
        return "#E5E4E244"
    else
        return "#E5E4E2bb"
}

function fontSize(yScale) {
    return (yScale.bandwidth() * 0.4) + 'px';
}

function renderRect(node, nodeEnter, context, {left, right, fill}) {
    // Add Box for the nodes
    nodeEnter.append('rect')
        .attr('class', 'box')
        .attr("y", function (d) {
            let y = context.yScale(d.label);
            console.log("Label " + d.label + " at " + y)
            return y
        })
        .attr("width", function (d) {
            return context.xScale(right(d)) - context.xScale(left(d))
        })
        .attr("x", function (d) {
            return context.xScale(left(d))
        })
        .attr("height", context.yScale.bandwidth())

    // Add labels for the nodes
    nodeEnter.append('text')
        .attr("x", (d) => context.xScale(left(d)) )
        .attr("dy", (d) => context.yScale(d.label) - (context.yScale.bandwidth() / 10) )
        .attr("text-anchor", (d) => "start")
        .attr("fill", "black")
        .attr("stroke", "black")
        .style('font-size', fontSize(context.yScale))
        .style('font-family', '"Fira Sans", sans-serif')
        .style('font-weight', '300')
        .attr("alignment-baseline", 'auto')
        .attr("stroke-width", '0')
        .text(function (d) {
            return d.name ? d.name : "";
        });

    // UPDATE
    const nodeUpdate = nodeEnter.merge(node);

    // Update the node attributes and style
    nodeUpdate
        .attr("fill", (d) => fillRect(d, fill))
        .attr("stroke", (d) => strokeRect(d));
}

function renderBoxplot(context) {
    console.log("Items to be rendered " + labels(context.items))

    // Update the nodes...
    const node = context.svg.selectAll('g.box').data(context.items)

    const nodeEnter = node.enter().append('g')
        .attr('class', 'box');

    renderRect(node, nodeEnter, context, {left: (d) => d.min, right: (d) => d.max, fill: (d) => d.color});

    // Remove any exiting nodes
    const duration = 0
    const nodeExit = node.exit().transition()
        .duration(duration)
        .remove();
}
