function makeBoxplotContext(items, renderLowerBound) {
    const margin = {top: 200, right: 100, bottom: 200, left: 200};
    const padding = {top: 0, right: 100, bottom: 0, left: 200};
    const width = window.innerWidth - margin.left - margin.right;
    const height = Math.min(860, window.innerHeight - margin.top - margin.bottom);

    console.log("Height : " + height)

    const svg = makeSvg(width, height, margin)

    let context = {
        items: [],
        _items: items,
        svg: svg,
        margin: margin,
        padding: padding,
        width: width,
        height: height,
        renderLowerBound: renderLowerBound
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

function addItem(itemName, context) {
    console.log("[addItem] " + itemName)
    const found = context._items.find((item) => item.label === itemName);
    if (!found) return;
    if (!context.items.includes(found)) {
        context.items.push(found)
        renderBoxplot(context)
    }
}

function removeItem(itemName, context) {
    console.log("[removeItem] " + itemName)
    const found = context._items.find((item) => item.label === itemName);
    if (!found) return;
    if (context.items.includes(found)) {
        context.items = context.items.filter((item) => item.label !== itemName);
        renderBoxplot(context)
    }
}

function renderBoxplot(context) {
    console.log("Items to be rendered " + context.items)
    const yScale = d3.scaleBand()
        .domain(context._items.map(function (d) {
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
        .attr("stroke", (d) => d.color)
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

    if (context.renderLowerBound) {
        context.svg.selectAll("foo")
            .data(context.items)
            .enter()
            .append("rect")
            .attr("fill", (d) => d.color2)
            .attr("stroke", (d) => d.color)
            .attr("y", function (d) {
                return yScale(d.label)
            })
            .attr("width", function (d) {
                return xScale(d.min) - xScale(d.lower)
            })
            .attr("x", function (d) {
                return xScale(d.lower)
            })
            .attr("height", yScale.bandwidth());
    }
}
