const jsonData = {
    "categories": [
        {
            "weather": ["sunny", "windy", "rainy"],
            "comfort level": ["good", "medium"],
            "formality": ["formal", "informal"],
            "style": ["business", "sport", "interview"],
            // "festival": ["Christmas", "Easter"],
        }
    ]
};

localStorage.setItem('categoryData', JSON.stringify(jsonData));
localStorage.setItem('userInput', 'outfit');

let outfit = localStorage.getItem('userInput');
let categories = JSON.parse(localStorage.getItem('categoryData')).categories[0];

const svg = d3.select("#graph"),
    width = +svg.attr("width"),
    height = +svg.attr("height"),
    gLink = svg.append("g"),
    gNode = svg.append("g");

const treeLayout = d3.tree().size([height - 40, width - 180]);

const clickedNodes = [];

function buildHierarchy(categories) {
    let hierarchy = { name: outfit, children: [] };
    for (let category in categories) {
        let categoryNode = { name: category, children: categories[category].map(item => ({ name: item, id: item })) };
        hierarchy.children.push(categoryNode);
    }
    return hierarchy;
}

function eraseTree() {
    // Clear the SVG element containing the tree
    gLink.selectAll("*").remove();
    gNode.selectAll("*").remove();
}

function updateTree(data) {
    // Compute the new tree layout
    treeLayout(data);

    // Update links
    const linkUpdate = gLink.selectAll(".link")
        .data(data.links());

    // Remove any existing links
    linkUpdate.exit().remove();

    // Add new links
    linkUpdate.enter().append("line")
        .attr("class", "link")
        .merge(linkUpdate)
        .attr("x1", d => d.source.y + 100) // Adjusted for left margin
        .attr("y1", d => d.source.x)
        .attr("x2", d => d.target.y + 100) // Adjusted for left margin
        .attr("y2", d => d.target.x);

    // Update nodes
    const nodeUpdate = gNode.selectAll(".node")
        .data(data.descendants());

    // Remove any existing nodes
    nodeUpdate.exit().remove();

    // Add new nodes
    const nodeEnter = nodeUpdate.enter().append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.y + 100},${d.x})`) // Adjusted for left margin
        .attr("cursor", "pointer")
        .on("click", clicked);

    nodeEnter.append("rect")
        .attr("width", 120)
        .attr("height", 30)
        .attr("x", -60)
        .attr("y", -15)
        .attr("fill", d => d.depth === 0 ? "#ffcccc" : d.depth === 1 ? "#cce5ff" : "#d5ccff");

    nodeEnter.append("text")
        .attr("dy", "0.35em")
        .attr("x", 0)
        .attr("text-anchor", "middle")
        .text(d => d.data.name);

    // Merge new nodes with existing nodes
    const nodeMerge = nodeEnter.merge(nodeUpdate);

    // Transition nodes to their new positions
    nodeMerge.transition()
        .duration(750)
        .attr("transform", d => `translate(${d.y + 100},${d.x})`); // Adjusted for left margin

    // Update the clicked nodes
    nodeMerge.select("rect")
        .attr("fill", d => {
            const index = clickedNodes.findIndex(node => node.id === d.data.id);
            return index !== -1 ? "#3f4294" : (d.depth === 0 ? "#ffcccc" : d.depth === 1 ? "#cce5ff" : "#d5ccff");
        });
}

function clicked(event, d) {
    const rect = d3.select(event.currentTarget).select("rect");
    const currentColor = rect.attr("fill");
    const index = clickedNodes.findIndex(node => node.id === d.data.id);

    if (index === -1) {
        // Add new node to clickedNodes with its current color
        clickedNodes.push({ id: d.data.id, color: currentColor });
        rect.attr("fill", "#3f4294"); // Change color to indicate selection
    } else {
        // Node is already in clickedNodes, remove it and revert color
        rect.attr("fill", clickedNodes[index].color);
        clickedNodes.splice(index, 1);
    }
    console.log("Clicked Nodes:", clickedNodes);
}

function sendPrompt() {
    console.log("Submit button clicked!");
    const newJson = jsonData;
    const newItem = {
        "userInput": outfit,
    };
    newJson.categories.push(newItem);
    newJson.categories.forEach(category => {
        Object.keys(category).forEach(property => {
            if (Array.isArray(category[property])) {
                category[property] = category[property].filter(item => {
                    const itemNode = clickedNodes.find(clickedNode => clickedNode.id === item);
                    return itemNode !== undefined;
                });
            }
        });
    });
    console.log("newJson!!!!!!!:" + JSON.stringify(newJson));
    const newJsonString = JSON.stringify(jsonData);
    const spinnerTarget = document.getElementsByClassName('textbox-container')[0];
    var spinner = new Spin.Spinner({
        color: '#3f4294',
    }).spin(document.getElementsByClassName('textbox-container').item(0));
    $.ajax({
        url: 'https://generative-outfit-api.momochi.me/GetOutfitRecommendation',
        type: 'POST',
        data: newJsonString,
        contentType: 'application/json',
        success: function (data) {
            console.log('data: ' + data);
            if (data){
                const textarea = document.getElementById('outfitTextarea');
                const outfitText = data;
                textarea.value = outfitText;
                spinner.stop();
            }
        }
    });

    const newRoot = d3.hierarchy(buildHierarchy(jsonData.categories[0])); // Assuming there's only one object in categories array
    eraseTree();
    updateTree(newRoot);
}

document.addEventListener('DOMContentLoaded', () => {
    const generateButton = document.getElementById('generateMyOutfitButton');
    if (generateButton) {
        generateButton.addEventListener('click', sendPrompt);
    } else {
        console.error('Generate button not found');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const addButton = document.getElementById('button-add-category');
    console.log("!!!!!!!!!!!!!");
    if (addButton) {
        console.log("@@@@@@@@@");
        addButton.addEventListener('click', addCategory);
    } else {
        console.error('Add category button not found');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const addButton = document.getElementById('button-add-subcategory');
    console.log("addCondition");
    if (addButton) {
        console.log("addCondition clicked");
        addButton.addEventListener('click', addCondition);
    } else {
        console.error('Add sub category button not found');
    }
});

let dynamicOptions = ["weather", "comfort level", "formality", "style"];

function populateSelect() {
    const select = document.getElementById("mySelect");

    // Clear existing options
    select.innerHTML = '';

    // Add new options
    dynamicOptions.forEach(option => {
        const optionElement = document.createElement("option");
        optionElement.value = option;
        optionElement.textContent = option;
        select.appendChild(optionElement);
    });
}

function addCategory() {
    const newCategoryName = document.getElementById('category-textbox').value.trim();
    console.log("addCategory:" + newCategoryName);
    if (newCategoryName !== '') {
        // Add the new category to jsonData.categories
        jsonData.categories[0][newCategoryName] = [];

        console.log("Category:" + JSON.stringify(jsonData));

        // Update dynamicOptions
        dynamicOptions.push(newCategoryName);
        populateSelect();

        // Rebuild the hierarchy and update the tree visualization
        const newRoot = d3.hierarchy(buildHierarchy(jsonData.categories[0])); // Assuming there's only one object in categories array
        eraseTree();
        updateTree(newRoot);
    }
}

function addCondition() {
    const condition = document.getElementById('subcategory-textbox').value.trim();
    const selectedCategory = document.getElementById('mySelect').value;

    if (condition !== '' && selectedCategory !== '') {
        // Construct the data object to be submitted
        const data = {
            condition: condition,
            category: selectedCategory
        };

        // Example of what to do with the data (you can replace this with your actual implementation)
        console.log("Submitted data:", data);

        jsonData.categories[0][selectedCategory].push(condition);
        console.log("Updated jsonData:", jsonData);

        // Reset input fields after submission (if needed)
        document.getElementById('subcategory-textbox').value = '';
        document.getElementById('mySelect').selectedIndex = 0; // Reset the select box to the default option
    } else {
        console.error('Condition or selected category is empty');
        alert('Condition or selected category is empty');
    }
    const newRoot = d3.hierarchy(buildHierarchy(jsonData.categories[0])); // Assuming there's only one object in categories array
    eraseTree();
    updateTree(newRoot);
}

const root = d3.hierarchy(buildHierarchy(categories));
updateTree(root);
populateSelect();
