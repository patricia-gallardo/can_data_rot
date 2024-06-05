document.body.style.overflow = 'hidden';

function makeGraphContext(_graph) {
    // Set the dimensions and margins of the diagram
    const margin = {top: 0, right: 0, bottom: 0, left: 0};
    const width = window.innerWidth - margin.left - margin.right;
    const height = window.innerHeight - margin.top - margin.bottom;

    const svg = makeSvg(width, height, margin);

    // the data - an object with nodes and links
    const graph = _graph;

    // The force simulation mutates links and nodes, so create a copy
    // so that re-evaluating this cell produces the same result.
    const links = _graph.links.map(d => ({...d}));
    const nodes = _graph.nodes.map(d => ({...d}));
    graph.links = links
    graph.nodes = nodes

    // values for all forces
    let forceProperties = {
        center: {
            x: 0.5,
            y: 0.5
        },
        charge: {
            enabled: true,
            strength: -400,
            distanceMin: 1,
            distanceMax: 2000
        },
        collide: {
            enabled: true,
            strength: .7,
            iterations: 1,
            radius: 10
        },
        forceX: {
            enabled: false,
            strength: .1,
            x: .5
        },
        forceY: {
            enabled: false,
            strength: .1,
            y: .5
        },
        link: {
            enabled: true,
            distance: 30,
            iterations: 1
        }
    }

    // force simulator
    const simulation = d3.forceSimulation();

    let context = {
        svg: svg,
        graph: graph,
        simulation: simulation,
        forceProperties: forceProperties,
        margin: margin,
        width: width,
        height: height,
        // // svg objects
        // link: {},
        // node: {}
    };

    initializeDisplay(context);
    initializeSimulation(context);

    // update size-related forces
    d3.select(window).on("resize", function () {
        // width = +svg.node().getBoundingClientRect().width;
        // height = +svg.node().getBoundingClientRect().height;
        context.width = window.innerWidth - margin.left - margin.right;
        context.height = Math.min(850, window.innerHeight - margin.top - margin.bottom);
        updateForces(context);
    });

    return context;
}

function makeSvg(width, height, margin) {
// append the svg object to the body of the page
    return d3.select("body")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            `translate(${margin.left}, ${margin.top})`)
}

//////////// FORCE SIMULATION ////////////

// set up the simulation and event to update locations after each tick
function initializeSimulation(context) {
    console.log("[initializeSimulation]")
    context.simulation.nodes(context.graph.nodes);
    initializeForces(context);
    context.simulation.on("tick", ticked);

    // Set the position attributes of links and nodes each time the simulation ticks.
    function ticked() {
        // console.log("Tick2")
        context.link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        context.node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);
    }
}

// add forces to the simulation
function initializeForces(context) {
    console.log("[initializeForces]")
    // add forces and associate each with a name
    context.simulation
        .force("link", d3.forceLink())
        .force("charge", d3.forceManyBody())
        .force("collide", d3.forceCollide())
        .force("center", d3.forceCenter())
        .force("forceX", d3.forceX())
        .force("forceY", d3.forceY());
    // apply properties to each of the forces
    updateForces(context);
}

// apply new force properties
function updateForces(context) {
    console.log("[updateForces]")
    // get each force by name and update the properties
    context.simulation.force("center")
        .x(context.width * context.forceProperties.center.x)
        .y(context.height * context.forceProperties.center.y);
    context.simulation.force("charge")
        .strength(context.forceProperties.charge.strength * context.forceProperties.charge.enabled)
        .distanceMin(context.forceProperties.charge.distanceMin)
        .distanceMax(context.forceProperties.charge.distanceMax);
    context.simulation.force("collide")
        .strength(context.forceProperties.collide.strength * context.forceProperties.collide.enabled)
        .radius(context.forceProperties.collide.radius)
        .iterations(context.forceProperties.collide.iterations);
    context.simulation.force("forceX")
        .strength(context.forceProperties.forceX.strength * context.forceProperties.forceX.enabled)
        .x(context.width * context.forceProperties.forceX.x);
    context.simulation.force("forceY")
        .strength(context.forceProperties.forceY.strength * context.forceProperties.forceY.enabled)
        .y(context.height * context.forceProperties.forceY.y);
    context.simulation.force("link")
        .id(function (d) {
            return d.id;
        })
        .distance(context.forceProperties.link.distance)
        .iterations(context.forceProperties.link.iterations)
        .links(context.forceProperties.link.enabled ? context.graph.links : []);

    // updates ignored until this is run
    // restarts the simulation (important if simulation has already slowed down)
    context.simulation.alpha(1).restart();
}


//////////// DISPLAY ////////////

// generate the svg objects and force simulation
function initializeDisplay(context) {
    console.log("[initializeDisplay]")

    // Specify the color scale.
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // Add a line for each link, and a circle for each node.
    context.link = context.svg.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .selectAll()
        .data(context.graph.links)
        .join("line")
        .attr("stroke-width", d => Math.sqrt(d.value));

    context.node = context.svg.append("g")
        .attr("stroke", "#000")
        .attr("stroke-width", 1.5)
        .selectAll()
        .data(context.graph.nodes)
        .join("circle")
        .attr("r", 5)
        .attr("fill", d => d.color ? d.color : color(d.group))
        .on("mouseenter", mouseEnter)
        .on("mouseleave", mouseLeave)

    const tooltipBackground = context.svg.append("g")
        .insert("rect", "text")
        .style("stroke", "black")
        .style("fill", "white");

    const tooltip = context.svg.append("g")
        .append("text")
        .attr("class", "text")
        .attr("fill", "black")
        .style('font-size', '30px')
        .style('font-family', '"Fira Sans", sans-serif')
        .style('font-weight', '300')
        .style("pointer-events", "none")

    function mouseEnter(event, d) {
        let padding = 10
        tooltip
            .attr("x", d.x + padding)
            .attr("y", d.y)
            .text(d.id)

        let textBoundingBox = tooltip.node().getBBox()
        tooltipBackground
            .attr("x", d.x + (padding/2))
            .attr("y", d.y - textBoundingBox.height)
            .attr("width", textBoundingBox.width + padding)
            .attr("height", textBoundingBox.height + padding)
            .transition()
            .duration(2)
            .attr("opacity", 1)
    }

    function mouseLeave(d) {
        // TODO?
    }

    // Add a drag behavior.
    context.node.call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    // Reheat the simulation when drag starts, and fix the subject position.
    function dragstarted(event) {
        console.log("Drag Start")
        if (!event.active) context.simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }

    // Update the subject (dragged node) position during drag.
    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }

    // Restore the target alpha so the simulation cools after dragging ends.
    // Unfix the subject position now that it’s no longer being dragged.
    function dragended(event) {
        console.log("Drag Stopped")
        if (!event.active) context.simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }

    // visualize the graph
    updateDisplay(context);
}

// update the display based on the forces (but not positions)
function updateDisplay(context) {
    context.node
        .attr("r", context.forceProperties.collide.radius)
    // .attr("stroke", context.forceProperties.charge.strength > 0 ? "blue" : "red")
    // .attr("stroke-width", context.forceProperties.charge.enabled == false ? 0 : Math.abs(context.forceProperties.charge.strength) / 15);

    context.link
        .attr("stroke-width", context.forceProperties.link.enabled ? 1 : .5)
        .attr("opacity", context.forceProperties.link.enabled ? 1 : 0);
}

// convenience function to update everything (run after UI input)
function updateAll(context) {
    updateForces(context);
    updateDisplay(context);
}
