document.body.style.overflow = 'hidden';

function minX(items) { return Math.min.apply(0, items.map((item) => item.year)) - 1; }
function maxX(items) { return Math.max.apply(0, items.map((item) => item.year)) + 1; }
function maxY(items) { return Math.max.apply(0, items.map((item) => item.num)) + 1; }

function makeBarplotContext(items, color, margins, paddings) {
    const margin = margins ? margins : {top: 0, right: 0, bottom: 0, left: 0};
    const padding = paddings ? paddings : {top: 0, right: 0, bottom: 0, left: 0};
    const width = window.innerWidth - margin.left - margin.right;
    const height = Math.min(860, window.innerHeight - margin.top - margin.bottom);

    const svg = makeSvg(width, height, margin, padding)

    let xDomain = [minX(items), maxX(items)];
    let yDomain = [maxY(items), 0];

    const {yScale, xScale} = renderAxes(svg, xDomain, yDomain, width, height, padding);

    let context = {
        items: [],
        _items: items,
        svg: svg,
        margin: margin,
        padding: padding,
        color: color,
        xScale: xScale,
        yScale: yScale,
        width: width,
        height: height,
        xDomain: xDomain
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
        context.width = width
        context.height = height
        removeBoxes(svg)
        renderBoxplot(context)
    });

    return context;
}

function makeSvg(width, height, margin, padding) {
    return d3.select("body").append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
        .attr("transform", "translate("
            + margin.left + "," + (margin.top + padding.top) + ")")
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
        .attr('class', 'yaxis')
        .style('font-size', '20px')
        .style('font-family', '"Fira Sans", sans-serif')
        .style('font-weight', '400')
        .attr("transform", "translate(" + padding.left  + "," + padding.top + ")")
        .call(yAxis);
}

function renderXaxis(svg, xAxis, padding, height) {
    svg.append("g")
        .attr('class', 'xaxis')
        .style('font-size', '20px')
        .style('font-family', '"Fira Sans", sans-serif')
        .style('font-weight', '400')
        .attr("transform", "translate(" + 0 + "," + (height - padding.bottom) + ")")
        .call(xAxis);
}

function getYaxis(yDomain, height, padding) {
    const yScale = d3.scaleLinear()
        .domain(yDomain)
        .range([0, height - padding.bottom - padding.top])
        // .padding(0.4);

    const yAxis = d3.axisLeft(yScale);
    return {yScale, yAxis};
}

function getXaxis(xDomain, width, padding) {
    const xScale = d3.scaleLinear()
        .domain(xDomain)
        .range([padding.left, width - (padding.left + padding.right)]);

    const xAxis = d3.axisBottom(xScale).ticks(sizeOfDomain(xDomain)).tickFormat((d) => d);
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

function strokeRect(d) {
    let color = d.color;
    return d.isGray ? "#000" : color;
}
function gray(col)
{
    if (col && col.length === 9)
        return "#E5E4E244"
    else
        return "#E5E4E2bb"
}

function sizeOfDomain(xDomain) {
    let last = xDomain[xDomain.length - 1];
    let first = xDomain[0];
    let sizeOfDomain = last - first;
    return sizeOfDomain;
}

function getColumnWidth(context) {
    let availableWidth = context.width - context.padding.left - context.padding.right;
    let size = sizeOfDomain(context.xDomain);
    let scaleFactorIncludingSpace = 1.4;
    return availableWidth / (size * scaleFactorIncludingSpace);
}

function renderRect(node, nodeEnter, context, {left, right, fill}) {
    const columnWidth = getColumnWidth(context)
    // Add Box for the nodes
    nodeEnter.append('rect')
        .attr('class', 'box')
        .attr("y", function (d) {
            let y = context.yScale(d.num);
            console.log("Label " + d.num + " at " + y)
            return y + context.padding.top
        })
        .attr("width", function (d) {
            return columnWidth
        })
        .attr("x", function (d) {
            return context.xScale(d.year) - (columnWidth/2)
        })
        .attr("height", (d) => {
            let yScale = context.yScale(d.num);
            return (context.height - context.padding.top - context.padding.bottom)  - yScale;
        })

    // UPDATE
    const nodeUpdate = nodeEnter.merge(node);

    // Update the node attributes and style
    nodeUpdate
        .attr("fill", (d) => d.isGray ? gray(fill(d)) : context.color ? context.color(d.year) : fill(d))
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
