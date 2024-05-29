function makeListContext(items, color) {
    let tree = makeTree(items);

    // Set the dimensions and margins of the diagram
    const margin = {top: 0, right: 90, bottom: 30, left: 90};
    const width = window.innerWidth - margin.left - margin.right;
    const height = Math.min(860, window.innerHeight - margin.top - margin.bottom);

    console.log("Height : " + height)

    let hierarchy = makeHierarchy(tree, height);
    const svg = makeSvg(width, height, margin);

    // Right to left? https://klimenko.dk/blog/2021/right-to-left-d3-tree/
    // https://observablehq.com/@romaklimenko/right-to-left-tidy-tree

    let context = {
        items: items,
        treeData: tree,
        root: hierarchy,
        svg: svg,
        margin: margin,
        width: width,
        height: height,
        linkLength: width / (items.length - 1),
        idSequence: 0,
        color: color
    };
    hideSubtree(hierarchy, context)
    return context;
}

function makeTreeContext(tree, color, linkLength, margins) {
    // Set the dimensions and margins of the diagram
    const margin = margins ? margins : {top: 0, right: 90, bottom: 30, left: 90};
    const width = window.innerWidth - margin.left - margin.right;
    const height = Math.min(860, window.innerHeight - margin.top - margin.bottom);

    console.log("Height : " + height)

    let hierarchy = makeHierarchy(tree, height);
    const svg = makeSvg(width, height, margin);

    let context = {
        items: items,
        treeData: tree,
        root: hierarchy,
        svg: svg,
        margin: margin,
        width: width,
        height: height,
        linkLength: linkLength ? linkLength : 180,
        idSequence: 0,
        color: color
    };
    hideSubtree(hierarchy, context)
    return context;
}

function makeTree(strings) {

    function makeNode(item) {
        const nodeType = {
            name: "",
            children: []
        };
        const node = Object.create(nodeType);
        node.name = item
        node.children = []
        return node
    }

    let nodes = strings
        .map(function (item) {
            return makeNode(item)
        })
        .reverse()

    let treeData = null

    nodes.forEach(function (node) {
        if (treeData) {
            node.children.push(treeData)
            treeData = node
        } else {
            treeData = node
        }
    })

    console.log(JSON.stringify(treeData))
    return treeData;
}

// Assigns parent, children, height, depth
function makeHierarchy(data, height) {
    let hierarchy = d3.hierarchy(data, function (d) {
        return d.children;
    });
    hierarchy.x0 = height / 2;
    hierarchy.y0 = 0;
    return hierarchy;
}

function makeSvg(width, height, margin) {
    // append the svg object to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    return d3.select("body").append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate("
            + margin.left + "," + margin.top + ")")
}

// Collapse the node and all it's children
function collapse(d) {
    if (d.children) {
        d._children = d.children
        d._children.forEach(collapse)
        d.children = null
    } else if (d._children) {
        d._children.forEach(collapse)
    }
}

function expand(d) {
    if (d._children) {
        d.children = d._children
        d.children.forEach(expand)
        d._children = null
    } else if (d.children) {
        d.children.forEach(expand)
    }
}

function showChildren(d, listContext) {
    if (d._children) {
        d.children = d._children;
        d._children = null;
        update(d, listContext);
    }
}

function findNode(name, nodes) {
    var current = nodes.shift();
    let nodeName = current.data.name;
    if (nodeName === name) {
        return current;
    }
    if (current.children) {
        nodes = nodes.concat(current.children);
    }
    if (current._children) {
        nodes = nodes.concat(current._children);
    }
    return findNode(name, nodes)
}

function showAll(itemName, listContext) {
    console.log("Show all " + itemName)
    expand(listContext.root)
    let node = findNode(itemName, [listContext.root])
    console.log("Show all " + JSON.stringify(node.data.name))
    update(node.parent, listContext);
}

function makeTransitions(listContext) {
    function makeTransition(current, index) {
        return {
            transitionForward: () => addItem(current, listContext),
            transitionBackward: () => removeItem(current, listContext),
            index: index
        }
    }

    let _transitions = []

    listContext.items.forEach(function (element, index) {
        if (index !== 0) {
            if (index === listContext.items.length - 1) {
                let transition = {
                    transitionForward: () => showAll(element, listContext),
                    transitionBackward: () => removeItem(element, listContext),
                    index: index - 1
                }
                _transitions.push(transition)
            } else {
                let transition = makeTransition(element, index - 1)
                _transitions.push(transition)
            }
        }
    })

    console.log(_transitions)
    console.log(JSON.stringify(_transitions))
    return _transitions;
}

function hideSubtree(subtree, listContext) {
    collapse(subtree)
    update(subtree, listContext);
}

function addItem(childName, listContext) {
    console.log("Add : " + childName)
    let node = findNode(childName, [listContext.root])
    console.log("Show : " + node)
    if (node && node.parent) {
        showChildren(node.parent, listContext)
    }
}

function removeItem(childName, listContext) {
    console.log("Remove : " + childName)
    let node = findNode(childName, [listContext.root])
    console.log("Hide : " + node)
    if (node && node.parent) {
        hideSubtree(node.parent, listContext)
    }
}

function update(source, listContext) {

    // Specify the color scale.
    // const color = d3.scaleOrdinal(d3.schemeCategory10);
    // const color = d3.scaleOrdinal(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"], d3.schemeCategory10);

    // Assigns the x and y position for the nodes
    let root = listContext.root;
    console.log("root : " + root)
    // declares a tree layout and assigns the size
    const treemap = d3.tree().size([listContext.height, listContext.width]);

    const treeData = treemap(root);

    // Compute the new tree layout.
    const nodes = treeData.descendants()
    const links = treeData.descendants().slice(1);

    // Normalize for fixed-depth.
    nodes.forEach(function (d) {
        d.y = d.depth * listContext.linkLength
    });

    const duration = 750

    // ****************** Nodes section ***************************

    // Update the nodes...
    const node = listContext.svg.selectAll('g.node')
        .data(nodes, function (d) {
            return d.id || (d.id = ++listContext.idSequence);
        });

    // Enter any new modes at the parent's previous position.
    const nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr("transform", function (d) {
            return "translate(" + source.y0 + "," + source.x0 + ")";
        })
        .on('click', click);

    // Add Circle for the nodes
    nodeEnter.append('circle')
        .attr('class', 'node')
        .attr('r', 1e-6)
        .attr("stroke", "#24425C")
        .attr("stroke-width", "2px")

    // Add labels for the nodes
    nodeEnter.append('text')
        .attr("dy", -25)
        .attr("text-anchor", 'middle')
        .attr("fill", "#24425C")
        .style('font-size', '30px')
        .style('font-family', '"Fira Sans", sans-serif')
        .style('font-weight', '400')
        .attr("alignment-baseline", 'middle')
        .text(function (d) {
            return d.data.name;
        });

    // UPDATE
    const nodeUpdate = nodeEnter.merge(node);

    // Transition to the proper position for the node
    nodeUpdate.transition()
        .duration(duration)
        .attr("transform", function (d) {
            return "translate(" + d.y + "," + d.x + ")";
        });

    // Update the node attributes and style
    nodeUpdate.select('circle.node')
        .attr('r', 10)
        .attr("fill", d => listContext.color ? listContext.color(d.data.name) : (d._children ? "#24425C" : "#fff"))
        .attr('cursor', 'pointer');


    // Remove any exiting nodes
    const nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function (d) {
            return "translate(" + source.y + "," + source.x + ")";
        })
        .remove();

    // On exit reduce the node circles size to 0
    nodeExit.select('circle')
        .attr('r', 1e-6);

    // On exit reduce the opacity of text labels
    nodeExit.select('text')
        .attr('fill-opacity', 1e-6);

    // ****************** links section ***************************

    // Update the links...
    const link = listContext.svg.selectAll('path.link')
        .data(links, function (d) {
            return d.id;
        });

    // Enter any new links at the parent's previous position.
    const linkEnter = link.enter().insert('path', "g")
        .attr("class", "link")
        .attr("fill", "none")
        .attr("stroke", "#24425C")
        .attr("stroke-width", "2px")
        .attr('d', function (d) {
            const o = {x: source.x0, y: source.y0};
            return diagonal(o, o)
        });

    // UPDATE
    const linkUpdate = linkEnter.merge(link);

    // Transition back to the parent element position
    linkUpdate.transition()
        .duration(duration)
        .attr('d', function (d) {
            return diagonal(d, d.parent)
        });

    // Remove any exiting links
    link.exit().transition()
        .duration(duration)
        .attr('d', function (d) {
            const o = {x: source.x, y: source.y};
            return diagonal(o, o)
        })
        .remove();

    // Store the old positions for transition.
    nodes.forEach(function (d) {
        d.x0 = d.x;
        d.y0 = d.y;
    });

    // Creates a curved (diagonal) path from parent to the child nodes
    function diagonal(s, d) {

        path = `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}`

        return path
    }

// Toggle children on click.
    function click(d) {
        if (d.children) {
            hideSubtree(d, listContext);
        } else {
            showChildren(d, listContext);
        }
    }
}
