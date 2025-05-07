/* ==================================================================== */
/* URLs
======================================================================= */
let url = new URL(window.location.href);
let baseURL = window.location.origin + window.location.pathname;
let folderURL = window.location.origin + '/' + window.location.pathname.replace(/\/[^\/]+$/, "");
let urlParams = new URLSearchParams(window.location.search);


/* ==================================================================== */
/* Load Header and Footer
======================================================================= */
$(function () {
    $(".load-html").each(function () {$(this).load(this.dataset.source)});
});


/* ==================================================================== */
/* Clean Sheet Data
======================================================================= */
const scrubData = (sheetData) => {

    cleanJson = JSON.parse(sheetData.substring(47).slice(0, -2));

    // Grab column headers
    const col = [];
    if (cleanJson.table.cols[0].label) {
        cleanJson.table.cols.forEach((headers) => {
            if (headers.label) {
                col.push(headers.label.toLowerCase().replace(/\s/g, ""));
            }
        });
    }

    // Scrubs columns and puts them in a readable object
    const scrubbedData = [];
    cleanJson.table.rows.forEach((info, num) => {
        const row = {};
        const isBoolean = val => 'boolean' === typeof val;
        col.forEach((ele, ind) => {
            row[ele] = info.c[ind] != null ? info.c[ind].f != null && !isBoolean(info.c[ind].v) ? info.c[ind].f : info.c[ind].v != null ? info.c[ind].v : "" : "";
        });
        scrubbedData.push(row);
    });

    let publicData = scrubbedData.filter((i) => { return i['hide'] !== true; });

    return publicData;

}


/* ================================================================ */
/* Sort Options
/* ================================================================ */
let optionSorter = (options) => {

    // Clean up the sheetID - in case they used a link instead
    let scrubbedSheetId = sheetID ? sheetID.includes('/d/') ? sheetID.split('/d/')[1].split('/edit')[0] : sheetID : "1lR8-Zd9bXT1nASnb_H9dx3MDzU9NtjvcFGWPrRwS8m4";

    // Call all options, make defaults of our own
    let userOptions = options;
    let defaultOptions = {

        sheetID: scrubbedSheetId,
        sheetPage: userOptions.sheetPage ? userOptions.sheetPage : "masterlist",
        fauxFolderColumn: userOptions.fauxFolderColumn ? keyCreator(userOptions.fauxFolderColumn) : false,
        filterColumn: userOptions.filterColumn ? keyCreator(userOptions.filterColumn) : false,
        searchFilterParams: userOptions.searchFilterParams ? addAll(userOptions.searchFilterParams) : false,

    }

    // Merge options
    let mergedOptions = {...userOptions, ...defaultOptions};

    return mergedOptions;

}


/* ================================================================ */
/* QOL Funcs
/* ================================================================ */
let sheetPage = (id, pageName) => {
    return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json&headers=1&tq=WHERE A IS NOT NULL&sheet=${pageName}`
};

let fetchSheet = async (page, sheet = sheetID) => {
    const JSON = await fetch(sheetPage(sheet, page)).then(i => i.text());
    return scrubData(JSON);
}

let keyCreator = (key) => {
    return key.toLowerCase().replace(/\s/g, "");
};

let addAll = (key) => {
    key.unshift("All")
    return key;
};

let addOptions = (arr, filter) => {
    arr.forEach((val) => {
        let optionHTML = document.createElement('option');
        optionHTML.value = val.toLowerCase().replace(/\s/g, "");
        optionHTML.textContent = val;
        filter.append(optionHTML);
    });
};

let loadPage = () => {
    $('#loading').hide();
    $('.softload').addClass('active');
}

let urlParamFix = (key, folder, params = urlParams) => {
    return '?' + (url.search.includes(folder) ? folder + '=' + params.get(folder) + '&' : '') + `${key}=`;
};


/* ================================================================ */
/* Get a card's log
/* ================================================================ */
let getLog = (log, item, key = 'id') => {
    if ($("#log-table").length != 0) {

        let logArr = [];
        log.forEach((i) => {
            if (i[key].toLowerCase() === item[key].toLowerCase()) {
                let newLog = {
                    timestamp: i.timestamp,
                    reason: i.reason,
                };
                logArr.push(newLog);
            };
        });

        // Create Rows
        let rows = [];
        logArr.forEach((i) => {
            let HTML = $("#log-entry").clone();
            HTML.find(".timestamp").html(i.timestamp);
            HTML.find(".reason").html(i.reason);
            rows.push(HTML);
        });

        $("#log-table").html(rows);

    }
}


/* ================================================================ */
/* Get Keys
/* Makes an array for List.js to use
/* ================================================================ */
let sheetArrayKeys = (arr) => {
    let itemArray = Object.keys(arr[0]);
    if (itemArray.indexOf('cardlink')) itemArray[itemArray.indexOf('cardlink')] = { name: 'cardlink', attr: 'href' };
    if (itemArray.indexOf('cardlinkalt')) itemArray[itemArray.indexOf('cardlinkalt')] = { name: 'cardlinkalt', attr: 'href' };
    if (itemArray.indexOf('link')) itemArray[itemArray.indexOf('link')] = { name: 'link', attr: 'href' };
    if (itemArray.indexOf('image')) itemArray[itemArray.indexOf('image')] = { name: 'image', attr: 'src' };
    return itemArray;
};


/* ================================================================ */
/* Pagination
/* ================================================================ */
let showPagination = (arr, amt) => {
    $('.btn-next').on('click', () => { $('.pagination .active').next().children('a')[0].click(); })
    $('.btn-prev').on('click', () => { $('.pagination .active').prev().children('a')[0].click(); })
    if (arr.length > amt) $('#charadex-pagination').show()
}


/* ================================================================ */
/* Search Filter
/* ================================================================ */
let charadexSearch = (info, searchArr) => {

    if (searchArr && searchArr.length > 2) {
        addOptions(searchArr, $('#search-filter'));
        $('#search-filter').parent().show();
        $('#search').addClass('filtered');
    }

    let arr = searchArr.map(function (v) { return v.toLowerCase().replace(/\s/g, ""); });

    $('#search').on('keyup', () => {
        let selection = $("#search-filter option:selected").val();
        let searchString = $('#search').val();
        if (selection && selection != 'all') {
            info.search(searchString, [selection]);
        } else {
            info.search(searchString, arr);
        }
    });

    $('#charadex-filters').show();

};



/* ================================================================ */
/* Custom Filter
/* ================================================================ */
let charadexFilterSelect = (info, arr, key) => {
    if (key) {

        const filterArr = [...new Set(arr.map(i => i[key]))];

        if (filterArr.length > 2) {

            addOptions(addAll(filterArr), $('#filter'));

            $("#filter").on('change', () => {
                let selection = $("#filter option:selected").text().toLowerCase();
                if (selection && !selection.includes('all')) {
                    info.filter(function (i) { return i.values()[key].toLowerCase() == selection; });
                } else {
                    info.filter();
                }
            });

            $('#filter').parent().show();
            $('#charadex-filters').show();

        }
    }
};



/* ================================================================ */
/* Faux Folder Function
/* ================================================================ */
let fauxFolderButtons = (array, fauxFolder, params = urlParams) => {

    if (array[0].hasOwnProperty(fauxFolder)) {

        // Creates Param Object Array
        let urlParamArray = [];
        const uniqueArray = [...new Set(array.map(i => i[fauxFolder]))].filter(n => n);
        uniqueArray.forEach((i) => {
            urlParamArray.push($('#charadex-filter-buttons a').clone().text(i).attr("href", baseURL + '?' + fauxFolder + '=' + i.toLowerCase()));
        });

        if (urlParamArray.length > 1) {

            // Adds All button
            urlParamArray.unshift($('#charadex-filter-buttons a').text('All').attr("href", baseURL));

            // Smacks the links in your flex column
            let btnCols = [];
            for (var i in urlParamArray) { btnCols.push($('#charadex-filter-buttons').html(urlParamArray[i]).clone()); }
            $('#filter-buttons .row').append(btnCols);

            // Show Buttons
            $('#filter-buttons').show();

        }

    }

    // Filters out information based on URL parameters
    if (params.has(fauxFolder) && fauxFolder) {
        return array.filter((i) => i[fauxFolder].toLowerCase() === params.get(fauxFolder).toLowerCase());
    } else {
        return array;
    }

};




/* ================================================================ */
/* Prev and Next Links
/* ================================================================ */
let prevNextLinks = (array, url, params, currParam, key, altkey = false) => {
    if ($("#entryPrev").length != 0) {

        let index = array.map(function (i) {return i[key];}).indexOf(currParam.get(key));
        let leftItem = array[index - 1];
        let rightItem = array[index + 1];

        // Basically a special declaration for the masterlist
        let chooseKey = altkey ? altkey : key;

        // Prev
        if (leftItem) {
            $("#entryPrev").attr("href", url + params + leftItem[chooseKey]);
            $("#entryPrev span").text(leftItem[chooseKey]);
        } else {
            $("#entryPrev i").remove();
        }

        // Next
        if (rightItem) {
            $("#entryNext").attr("href", url + params + rightItem[chooseKey]);
            $("#entryNext span").text(rightItem[chooseKey]);
        } else {
            $("#entryNext i").remove();
        }

        // Back to masterlist (keeps species parameter)
        $("#masterlistLink").attr("href", url);
        $('#prevNext').show();

    }
};


/* ==================================================================== */
/* Charadex w/ Gallery and Cards
======================================================================= */
const charadexLarge = async (options) => {
    const charadexInfo = optionSorter(options);
    const sheetArray = await fetchSheet(charadexInfo.sheetPage);

    let cardKey = Object.keys(sheetArray[0])[0];
    let preParam = urlParamFix(cardKey, charadexInfo.fauxFolderColumn);

    if (charadexInfo.fauxFolderColumn) sheetArray = fauxFolderButtons(sheetArray, charadexInfo.fauxFolderColumn);
    if (charadexInfo.itemOrder === "asc") sheetArray.reverse();

    for (let i in sheetArray) {
        sheetArray[i].cardlink = baseURL + preParam + sheetArray[i][cardKey];
    }

    if (urlParams.has(cardKey)) {
        prevNextLinks(sheetArray, baseURL, preParam, urlParams, cardKey);

        let singleCard = sheetArray.filter((i) => i[cardKey] === urlParams.get(cardKey))[0];
        console.log("Single Card Data:", singleCard);

        let itemOptions = {
            valueNames: sheetArrayKeys(sheetArray),
            item: "charadex-card",
        };

        let charadexItem = new List("charadex-gallery", itemOptions, [singleCard]);

        const imageContainer = document.querySelector(".text-center");
        const imageElement = imageContainer.querySelector(".image");

        // Correctly reference youtubelink or vimeolink
        const videoLink = singleCard["youtubelink"] || singleCard["vimeolink"];
        console.log("Video Link Found:", videoLink);

        if (videoLink?.trim()) {
            let videoID;

            // Check if the link is a regular YouTube video link
            if (videoLink.includes("youtube.com/watch?v=")) {
                videoID = videoLink.split("v=")[1]?.split("&")[0];
            }
            // Check if the link is a YouTube Shorts link
            else if (videoLink.includes("youtube.com/shorts/")) {
                videoID = videoLink.split("/shorts/")[1];
            }
            // Check if the link is a Vimeo link
            else if (videoLink.includes("vimeo.com/")) {
                // Extract Vimeo video ID correctly, for both public and unlisted
                videoID = videoLink.split("vimeo.com/")[1]?.split("/")[0];
            }

            console.log("Extracted Video ID:", videoID);

            if (videoID) {
                const iframe = document.createElement("iframe");

                // If it's a YouTube link
                if (videoLink.includes("youtube.com")) {
                    iframe.src = `https://www.youtube.com/embed/${videoID}`;
                }
                // If it's a Vimeo link
                else if (videoLink.includes("vimeo.com")) {
                    iframe.src = `https://player.vimeo.com/video/${videoID}`;
                }

                iframe.width = "640";  // Custom width
                iframe.height = "360"; // Custom height
                iframe.frameBorder = "0";
                iframe.allow = "autoplay; fullscreen; picture-in-picture";
                iframe.allowFullscreen = true;

                imageContainer.innerHTML = "";
                imageContainer.appendChild(iframe);
            } else {
                console.error("Failed to extract Video ID.");
            }
        } else {
            imageElement.src = singleCard.image || "";
        }
    } else {
        let galleryOptions = {
            item: "charadex-entries",
            valueNames: sheetArrayKeys(sheetArray),
            searchColumns: charadexInfo.searchFilterParams,
            page: charadexInfo.itemAmount,
            pagination: [
                {
                    innerWindow: 1,
                    left: 1,
                    right: 1,
                    item: `<li class='page-item'><a class='page page-link'></a></li>`,
                    paginationClass: "pagination-top",
                },
            ],
        };

        let charadex = new List("charadex-gallery", galleryOptions, sheetArray);
        charadexFilterSelect(charadex, sheetArray, charadexInfo.filterColumn);
        charadexSearch(charadex, charadexInfo.searchFilterParams);
        showPagination(sheetArray, charadexInfo.itemAmount);
    }
};


/* ==================================================================== */
/* Charadex w/ just Gallery
======================================================================= */
const charadexSmall = async (options) => {

    // Sort through options
    const charadexInfo = optionSorter(options);

    // Grab the sheet
    let sheetArray = await fetchSheet(charadexInfo.sheetPage);

    // Create the Gallery
    let galleryOptions = {
        item: 'charadex-entries',
        valueNames: sheetArrayKeys(sheetArray),
    };

    // Render Gallery
    let charadex = new List('charadex-gallery', galleryOptions, sheetArray);

};


/* ==================================================================== */
/* Masterlist Only
======================================================================= */
const masterlist = async (options) => {
    const charadexInfo = optionSorter(options);

    // Fetch the sheet data
    let sheetArray = await fetchSheet(charadexInfo.sheetPage);

    // URL Info
    let cardKey = Object.keys(sheetArray[0])[4];
    let cardKeyAlt = Object.keys(sheetArray[0])[0];
    let preParam = urlParamFix(cardKey, charadexInfo.fauxFolderColumn);

    // Process the sheet data
    if (charadexInfo.fauxFolderColumn) sheetArray = fauxFolderButtons(sheetArray, charadexInfo.fauxFolderColumn);
    if (charadexInfo.itemOrder == 'asc') sheetArray.reverse();

    // Add card links
    for (var i in sheetArray) {
        sheetArray[i].cardlink = baseURL + preParam + sheetArray[i][cardKey];
        sheetArray[i].cardlinkalt = baseURL + urlParamFix(cardKeyAlt, charadexInfo.fauxFolderColumn) + sheetArray[i][Object.keys(sheetArray[0])[0]];
    }

    // Decide if it's a single character page
    if (urlParams.has(cardKey) || urlParams.has(cardKeyAlt)) {
        let currCardKey = urlParams.has(cardKey) ? cardKey : cardKeyAlt;
        let singleCard = sheetArray.filter((i) => i[currCardKey] === urlParams.get(currCardKey))[0];

        // Render Single Character
        let itemOptions = {
            valueNames: sheetArrayKeys(sheetArray),
            item: 'charadex-card',
        };

        // Render Next/Prev Links
        prevNextLinks(sheetArray, baseURL, preParam, urlParams, currCardKey, cardKey);

        // Render single card with alternate sprite toggle
        let charadexItem = new List("charadex-gallery", itemOptions, [singleCard]);
        
        // Apply color theme and text color dynamically
        applyColorTheme(singleCard);

        const characterImage = document.querySelector(".image.img-fluid");
        const imageContainer = characterImage.closest(".mx-auto.w-100.text-center"); // Select the parent container for the image
        
        if (singleCard.altspritelink) {
            const buttonContainer = document.createElement("div");
            buttonContainer.classList.add("text-center", "mt-3");
        
            const normalSpriteButton = document.createElement("button");
            normalSpriteButton.classList.add("btn", "btn-primary", "mr-2");
            normalSpriteButton.textContent = "Normal Sprite";
            normalSpriteButton.addEventListener("click", () => {
                characterImage.src = singleCard.image;
            });
        
            const altSpriteButton = document.createElement("button");
            altSpriteButton.classList.add("btn", "btn-secondary");
            altSpriteButton.textContent = "Alt Sprite";
            altSpriteButton.addEventListener("click", () => {
                characterImage.src = singleCard.altspritelink;
            });
        
            buttonContainer.appendChild(normalSpriteButton);
            buttonContainer.appendChild(altSpriteButton);
        
            // Append the button container directly below the image container
            imageContainer.appendChild(buttonContainer);
        }





        // Ensure artist visibility based on the presence of text in the artist field
        const renderTraits = (traitsValue) => {
            const traitsWrapper = document.querySelector(".traits-wrapper"); // Target the wrapper
        
            if (traitsValue && traitsValue.trim() !== "") {
                // If there's text, update the artist span and show the wrapper
                document.querySelector(".traits").textContent = traitsValue.trim();
                traitsWrapper.style.display = "block"; // Show the entire section
            } else {
                // If no text, hide the entire artist section
                traitsWrapper.style.display = "none"; // Hide the wrapper, including the hr
            }
        };

        
        // Call renderArtist with the correct field from the singleCard object
        renderTraits(singleCard.traits); // Ensure `traits` matches the field name in your sheet  
    


        // Ensure artist visibility based on the presence of text in the artist field
        const renderArtist = (artistValue) => {
            const artistWrapper = document.querySelector(".artist-wrapper"); // Target the wrapper
        
            if (artistValue && artistValue.trim() !== "") {
                // If there's text, update the artist span and show the wrapper
                document.querySelector(".artist").textContent = artistValue.trim();
                artistWrapper.style.display = "block"; // Show the entire section
            } else {
                // If no text, hide the entire artist section
                artistWrapper.style.display = "none"; // Hide the wrapper, including the hr
            }
        };

        
        // Call renderArtist with the correct field from the singleCard object
        renderArtist(singleCard.artist); // Ensure `traits` matches the field name in your sheet    
        
        

        // Ensure artist visibility based on the presence of text in the artist field
        const renderAliases = (aliasesValue) => {
            const aliasesWrapper = document.querySelector(".aliases-wrapper"); // Target the wrapper
        
            if (aliasesValue && aliasesValue.trim() !== "") {
                // If there's text, update the artist span and show the wrapper
                document.querySelector(".aliases").textContent = aliasesValue.trim();
                aliasesWrapper.style.display = "block"; // Show the entire section
            } else {
                // If no text, hide the entire artist section
                aliasesWrapper.style.display = "none"; // Hide the wrapper, including the hr
            }
        };

        
        // Call renderArtist with the correct field from the singleCard object
        renderAliases(singleCard.aliases); // Ensure `traits` matches the field name in your sheet   
        
        

        // Ensure backstory visibility based on the presence of text and render HTML formatting
        const renderBackstory = (backstoryValue) => {
            const backstoryWrapper = document.querySelector(".backstory-wrapper"); // Target the wrapper
            const backElement = document.querySelector(".backstory");
        
            if (backstoryValue && backstoryValue.trim() !== "") {
                // If there's text, update the backstory with HTML content (allow inline HTML formatting)
                backElement.innerHTML = backstoryValue.trim(); // Render HTML with inline styles
                backstoryWrapper.style.display = "block"; // Show the entire section
            } else {
                // If no text, hide the entire backstory section
                backstoryWrapper.style.display = "none"; // Hide the wrapper, including the hr
            }
        };
        
        // Call renderBackstory with the correct field from the singleCard object
        renderBackstory(singleCard.backstory); // Ensure `backstory` matches the field name in your sheet

        
        const renderAbout = (aboutValue) => {
            const aboutElement = document.querySelector(".about");
            if (aboutValue && aboutValue.trim() !== "") {
                aboutElement.innerHTML = aboutValue.trim(); // Render HTML with inline styles
            } else {
                aboutElement.innerHTML = "<p>No about information available.</p>"; // Fallback
            }
        };
        
        // Call the function with the value from the Google Sheet
        renderAbout(singleCard.about);



    




        // Ensure related images section is rendered
// Ensure related images section is rendered
const renderRelatedImages = async (characterName) => {
    console.log('renderRelatedImages called with characterName:', characterName);

    const relatedImagesContainer = document.getElementById('related-images-container');
    if (!relatedImagesContainer) {
        console.error("Related Images Container not found!");
        return;
    }

    // Fetch data from the "Prompts" tab
    const promptsSheet = await fetchSheet('Prompts');
    console.log("Fetched Prompts data:", promptsSheet);

    // Reverse the array to make it descending by default (most recent rows first)
    const reversedPromptsSheet = promptsSheet.reverse();

    // Filter images related to the selected character
    const relatedItems = reversedPromptsSheet.filter(item => {
        const allCharacters = [item.characters, item.npcchars].filter(str => typeof str === 'string').join(', ').toLowerCase();
        return allCharacters.includes(characterName.toLowerCase());
    });

    console.log("Filtered Related Items:", relatedItems);

    // Clear the container before adding new content
    relatedImagesContainer.innerHTML = '';

    if (relatedItems.length === 0) {
        relatedImagesContainer.innerHTML = '<p>No images found for this character.</p>';
    } else {
        relatedItems.forEach(item => {
            const imageDiv = document.createElement('div');
            imageDiv.classList.add('col-md-4', 'p-2'); // 3 images per row

            imageDiv.innerHTML = `
                <div class="image-container">
                    <img src="${item.image}" alt="${item.title}" class="img-fluid" data-toggle="modal" data-target="#image-modal" data-image="${item.image}" data-artist="${item.artist}">
                </div>
            `;
            relatedImagesContainer.appendChild(imageDiv);
        });
    }

    // Add click event listener to all images in the gallery
    const images = document.querySelectorAll('#related-images-container img');
    images.forEach(img => {
        img.addEventListener('click', function() {
            const imageUrl = img.getAttribute('data-image'); // Get the image URL
            const artistName = img.getAttribute('data-artist'); // Get the artist's name
            const modalImage = document.getElementById('modal-image');
            const modalArtist = document.getElementById('modal-artist'); // Element to display artist name
    
            modalImage.src = imageUrl; // Set the modal image source to the clicked image's URL
            modalArtist.innerHTML = `<strong>Artist:</strong> ${artistName}`; // Make "Artist" bold and append artist's name
        });
    });
};

// Call the function to render related images after everything else is set
renderRelatedImages(singleCard.name);







function applyPageDoll(character) {
    const pageDollUrl = character.doll; // Image URL
    const dollComment = character.dollanimation; // Animation or comment from the sheet

    if (pageDollUrl && pageDollUrl.trim() !== "") {
        let existingPageDoll = document.querySelector("#page-doll");
        if (!existingPageDoll) {
            // Create the page doll container
            existingPageDoll = document.createElement("div");
            existingPageDoll.id = "page-doll";
            existingPageDoll.style.position = "fixed";
            existingPageDoll.style.bottom = "10px"; 
            existingPageDoll.style.right = "10px"; 
            existingPageDoll.style.zIndex = "9999"; 

            document.body.appendChild(existingPageDoll);
        }

        // Set the doll image
        existingPageDoll.innerHTML = `<img src="${pageDollUrl.trim()}" alt="Page Doll" id="page-doll-img" style="width: 200px; height: auto; border-radius: 0%;">`;
        
        // Apply animation or special effect if specified in dollcomment
        const dollImg = document.querySelector("#page-doll-img");
        if (dollComment) {
            // Remove any existing animations before applying new ones
            dollImg.classList.remove("fa-spin", "fa-bounce", "fa-pulse"); 

            if (dollComment.toLowerCase() === "bounce") {
                dollImg.classList.add("fa-bounce");
            } else if (dollComment.toLowerCase() === "spin") {
                dollImg.classList.add("fa-spin");
            }
             else if (dollComment.toLowerCase() === "beat") {
                dollImg.classList.add("fa-beat");
            }
             else if (dollComment.toLowerCase() === "fade") {
                dollImg.classList.add("fa-fade");
            }
             else if (dollComment.toLowerCase() === "beat-fade") {
                dollImg.classList.add("fa-beat-fade");
            }
             else if (dollComment.toLowerCase() === "flip") {
                dollImg.classList.add("fa-flip");
            }   
             else if (dollComment.toLowerCase() === "shake") {
                dollImg.classList.add("fa-shake");
            }                          
            
        }

        existingPageDoll.style.display = "block"; // Ensure it's visible
    } else {
        // Remove or hide the page doll if no URL is provided
        const existingPageDoll = document.querySelector("#page-doll");
        if (existingPageDoll) {
            existingPageDoll.style.display = "none";
        }
    }
}

  applyPageDoll(singleCard);



const renderFaves = (favedbyValue) => {
    const favesWrapper = document.querySelector(".faves-wrapper");
    const favesCountElement = document.querySelector(".faves-count");

    if (favedbyValue && favedbyValue.trim() !== "") {
        const favesArray = favedbyValue.split(',').map(name => name.trim()).filter(name => name !== "");
        favesCountElement.textContent = favesArray.length;
        favesWrapper.style.display = "block";
    } else {
        favesCountElement.textContent = "0";
        favesWrapper.style.display = "block"; // still show the section with 0
    }
};

// Call it with the value from the sheet
renderFaves(singleCard.favedby);




// Hide pagination for single character view
document.getElementById('charadex-pagination').style.display = 'none';


    } else {
        // Render gallery
        let galleryOptions = {
            item: 'charadex-entries',
            valueNames: sheetArrayKeys(sheetArray),
            searchColumns: charadexInfo.searchFilterParams,
            page: charadexInfo.itemAmount,
            pagination: [{
                innerWindow: 1,
                left: 1,
                right: 1,
                item: `<li class='page-item'><a class='page page-link'></a></li>`,
                paginationClass: 'pagination-top',
            }],
        };

        let charadex = new List("charadex-gallery", galleryOptions, sheetArray);

        // Show pagination for gallery view
        document.getElementById('charadex-pagination').style.display = 'block';

        // Filters
        charadexFilterSelect(charadex, sheetArray, charadexInfo.filterColumn);
        charadexSearch(charadex, charadexInfo.searchFilterParams);
        showPagination(sheetArray, charadexInfo.itemAmount);
    }
};








function applyColorTheme(character) {
    // Log the singleCard object to see the full structure
    console.log("Single Card:", character);

    const colorTheme = character.colortheme;  // Match the exact column name 'colortheme' in your sheet
    const Headercardcolor = character.headercardcolor;  // Match the exact column name 'colortheme' in your sheet
    const Cardcolor = character.cardcolor;  // Match the exact column name 'colortheme' in your sheet
    const nameheaderColor = character.nameheadercolor;  // Match the exact column name 'colortheme' in your sheet
    const topbarColor = character.topbarcolor;  // Match the exact column name 'colortheme' in your sheet
    const linkColors = character.linkcolors;    // Match the exact column name 'textcolor' in your sheet
    const textColor = character.textcolor;    // Match the exact column name 'textcolor' in your sheet
    const textColor2 = character.textcolor2;    // Match the exact column name 'textcolor' in your sheet
    const relatedBtn = character.relatedbtn;    // Match the exact column name 'textcolor' in your sheet
    const mainBtn = character.mainbtn;    // Match the exact column name 'textcolor' in your sheet
    const backgroundImg = character.backgroundimg; // Match the exact column name 'backgroundimg' in your sheet
    const nameImage = character.nameimage; // Match the exact column name 'NameImage' in your sheet
    const pageDoll = character.doll; // Match the exact column name 'doll' in your sheet
    const font = character.font; // Match the exact column name 'font' in your sheet


    // Apply the color theme if it exists and is valid
    if (colorTheme && /^#[0-9A-F]{6}$/i.test(colorTheme)) {
        document.body.style.backgroundColor = colorTheme;
    }

    // Apply the color theme if it exists and is valid
    if (Cardcolor && /^#[0-9A-F]{6}$/i.test(Cardcolor)) {
        document.documentElement.style.setProperty('--cd-content-background-color', Cardcolor);
    }

    // Apply the color theme to a specific card element if it exists and is valid
    if (Headercardcolor && /^#[0-9A-F]{6}$/i.test(Headercardcolor)) {
        // Target the specific card element (use a more specific selector if needed)
        const specificCard = document.querySelector('.card.p-md-5.p-4.mb-4'); // Modify the selector to match the exact card
    
        // If the specific card is found, change its background color
        if (specificCard) {
            specificCard.style.setProperty('--cd-card-background-color', Headercardcolor);
        }
    }
    

    // Check if the NameImage exists, and if so, replace the character name with the image
    if (nameImage && nameImage.trim() !== "") {
        const nameElement = document.querySelector('.cardlink.name'); // Adjust this selector as needed
        if (nameElement) {
            // Replace the name with the image
            nameElement.innerHTML = `<img src="${nameImage.trim()}" alt="Character Image" style="width: 500px; height: auto;top:-100px!important">`;
        }
    }



    // Apply the color theme if it exists and is valid
    if (nameheaderColor && /^#[0-9A-F]{6}$/i.test(nameheaderColor)) {
        document.documentElement.style.setProperty('--cd-card-header-background-color', nameheaderColor);
    }

    if (topbarColor && /^#[0-9A-F]{6}$/i.test(topbarColor)) {
        document.documentElement.style.setProperty('--cd-topbar-background-color', topbarColor);
    } else {
        // If no valid color is provided, apply the default (white)
        document.documentElement.style.setProperty('--cd-topbar-background-color', 'white');
    }

   

    // Apply the text color if it exists and is valid
    if (linkColors && /^#[0-9A-F]{6}$/i.test(linkColors)) {
        const links = document.querySelectorAll('a');
        links.forEach(link => {
            link.style.color = linkColors;
        });
    }
    
    // Apply the text color if it exists and is valid
    if (textColor && /^#[0-9A-F]{6}$/i.test(textColor)) {
        document.documentElement.style.setProperty('--cd-faded-text-color', textColor);
    }
    
    // Apply the text color if it exists and is valid
    if (textColor2 && /^#[0-9A-F]{6}$/i.test(textColor2)) {
        document.documentElement.style.setProperty('--cd-body-text-color', textColor2);
    }

    // Apply the text color if it exists and is valid
    if (relatedBtn && /^#[0-9A-F]{6}$/i.test(relatedBtn)) {
        document.documentElement.style.setProperty('--cd-faded-background-color', relatedBtn);
    }


    // Apply the text color if it exists and is valid
    if (mainBtn && /^#[0-9A-F]{6}$/i.test(mainBtn)) {
        document.documentElement.style.setProperty('--cd-button-background-color', mainBtn);
    }


    // Apply the background image if it exists and is a valid URL
    if (backgroundImg && backgroundImg.trim() !== "") {
        document.body.style.backgroundImage = `url(${backgroundImg.trim()})`;
        document.body.style.backgroundSize = "cover"; // Ensure the entire image is visible
        document.body.style.backgroundRepeat = "no-repeat"; // Prevent the image from repeating
        document.body.style.backgroundPosition = "center"; // Center the image
        document.body.style.backgroundAttachment = "fixed"; // Make the background image fixed
    } else {
        // Reset background image if no valid URL is provided
        document.body.style.backgroundImage = "";
          document.body.style.backgroundAttachment = ""; // Reset attachment property

    }
}


/* ==================================================================== */
/* Inventories
======================================================================= */
const inventory = async (options) => {

    // Sort through options
    const charadexInfo = optionSorter(options);

    // Grab the sheet
    let sheetArray = await fetchSheet(charadexInfo.sheetPage);

    // Grab all our url info
    let cardKey = Object.keys(sheetArray[0])[0];
    let preParam = `?${cardKey}=`;

    // Put in alphabetical order
    sheetArray.sort((a, b) => a.username.toLowerCase().localeCompare(b.username.toLowerCase()));

    // Add card links to the remaining array
    for (var i in sheetArray) { sheetArray[i].cardlink = baseURL + preParam + sheetArray[i][cardKey]; }

    // Decide if the url points to profile or entire gallery
    if (urlParams.has(cardKey)) {

        // Fetch item info from the item sheet
        let itemSheetArr = await fetchSheet(charadexInfo.itemSheetPage);
        let itemCardKey = Object.keys(itemSheetArr[0])[0];

        // List.js options
        let itemOptions = {
            valueNames: sheetArrayKeys(sheetArray),
            item: 'charadex-card',
        };

        // Filter out the right card
        let singleCard = sheetArray.filter((i) => (i[cardKey] === urlParams.get(cardKey)))[0];

        // Merge the user's inventory with the item sheet
        // Also remove any items they dont have atm
        let inventoryItemArr = [];
        itemSheetArr.forEach((i) => {
            for (var c in singleCard) {
                if (c === keyCreator(i.item) && ((singleCard[keyCreator(i.item)] !== "0" && singleCard[keyCreator(i.item)] !== ""))) {
                    let inventoryItems = {
                        type: i.type,
                        item: i.item,
                        image: i.image,
                        itemlink: folderURL + "/items.html?" + itemCardKey + "=" + i[itemCardKey],
                        amount: singleCard[keyCreator(i.item)],
                    };
                    inventoryItemArr.push(inventoryItems);
                };
            }
        });

        // Sort items by type if applicable
        if (charadexInfo.sortTypes) {
            inventoryItemArr.sort(function (a, b) {
                return charadexInfo.sortTypes.indexOf(a.type) - charadexInfo.sortTypes.indexOf(b.type);
            });
        };

        // Group by the item type
        let orderItems = Object.groupBy(inventoryItemArr, ({ type }) => type);

        // Create Rows
        let rows = [];
        for (var i in orderItems) {

            // Get the headers and cols
            let cols = [];
            orderItems[i].forEach((v) => {
                let HTML = $("#item-list-col").clone();
                HTML.find(".item-img").attr('src', v.image);
                HTML.find(".itemlink").attr('href', v.itemlink);
                HTML.find(".item").html(v.item);
                HTML.find(".amount").html(v.amount);
                cols.push(HTML);
            });

            // Smack everything together
            let rowHTML = $("#item-list-section").clone().html([
                $("#item-list-header").clone().html(i),
                $("#item-list-row").clone().html(cols)
            ]);

            rows.push(rowHTML);

        };

        // Make items show up
        $("#item-list").html(rows);

        // Grab the log sheet and render log
        let logArray = await fetchSheet(charadexInfo.logSheetPage);
        getLog(logArray, singleCard, "username");

        // Render card
        let charadexItem = new List("charadex-gallery", itemOptions, singleCard);


    } else {

        // Show pagination
        showPagination(sheetArray, charadexInfo.itemAmount);

        // Create the Gallery
        let galleryOptions = {
            item: 'charadex-entries',
            valueNames: sheetArrayKeys(sheetArray),
            searchColumns: [cardKey],
            page: charadexInfo.itemAmount,
            pagination: [{
                innerWindow: 1,
                left: 1,
                right: 1,
                item: `<li class='page-item'><a class='page page-link'></a></li>`,
                paginationClass: 'pagination-top',
            }],
        };

        // Render Gallery
        let charadex = new List('charadex-gallery', galleryOptions, sheetArray);

        // Make filters workie
        charadexSearch(charadex, [cardKey]);


    }

};


/* ==================================================================== */
/* This is just to fill out some of the front page automatically
/* You're free to delete and create something yourself!
======================================================================= */
const frontPage = (options) => {

    const charadexInfo = optionSorter(options);

    // Events
    let addEvents = async () => {
        if ($("#prompt-gallery").length != 0) {
            if (charadexInfo.numOfPrompts != 0) {

                // Grab the sheet
                let events = await fetchSheet(charadexInfo.promptSheetPage);
                let cardKey = Object.keys(events[0])[0];

                // Reverse the events array (similar to your design example)
                // Reverse by the most recent "filled" data if necessary
                let newestEvents = events.reverse().slice(0, charadexInfo.numOfPrompts);

                // Add card link
                for (var i in newestEvents) { 
                    newestEvents[i].cardlink = folderURL + "prompts" + cardKey + "=" + newestEvents[i][cardKey]; 
                }

                // Nyoom (Render the Gallery)
                let galleryOptions = {
                    item: 'prompt-item',
                    valueNames: sheetArrayKeys(newestEvents),
                };

                // Render Gallery
                let charadex = new List('prompt-gallery', galleryOptions, newestEvents);

            } else {
                $("#prompt-gallery").hide();
            }
        }
    };
    addEvents();


    // Staff
    let addStaff = async () => {
        if ($("#staff-gallery").length != 0) {
            if (charadexInfo.numOfStaff != 0) {

                // Grab dah sheet
                let mods = await fetchSheet(charadexInfo.staffSheetPage);

                // Show x Amount on Index
                let indexMods = mods.slice(0, charadexInfo.numOfStaff);

                // Nyoom
                let galleryOptions = {
                    item: 'staff-item',
                    valueNames: sheetArrayKeys(indexMods),
                };

                // Render Gallery
                let charadex = new List('staff-gallery', galleryOptions, indexMods);

            } else {
                $("#staff-gallery").hide();
            }
        }
    }; addStaff();

    // Designs
    let addDesigns = async () => {
        if ($("#design-gallery").length != 0) {
            if (charadexInfo.numOfDesigns != 0) {

                // Grab dah sheet
                let designs = await fetchSheet(charadexInfo.masterlistSheetPage);

                // Filter out any MYO slots, reverse and pull the first 4
                let selectDesigns = designs.filter((i) => { return i.designtype != 'MYO Slot' }).reverse().slice(0, charadexInfo.numOfDesigns);

                // Add cardlink
                let cardKey = Object.keys(selectDesigns[0])[0];
                for (var i in selectDesigns) { selectDesigns[i].cardlink = folderURL + "masterlist?" + cardKey + "=" + selectDesigns[i][cardKey]; }

                // Nyoom
                let galleryOptions = {
                    item: 'design-item',
                    valueNames: sheetArrayKeys(selectDesigns),
                };

                // Render Gallery
                let charadex = new List('design-gallery', galleryOptions, selectDesigns);

            } else {
                $("#design-gallery").hide();
            }
        }
    }; addDesigns();

}; 



  
document.addEventListener('DOMContentLoaded', async () => {
    const sidebar = document.getElementById('sidebar'); // Sidebar for Masterlist
    const campaignButtons1 = document.getElementById('campaign-buttons'); // Sidebar container for Prompts
    const campaignButtons2 = document.getElementById('campaign-buttons2'); // Sidebar container for Masterlist
    const searchInput = document.getElementById('search'); // The search bar input element
    const searchColumnSelect = document.getElementById('search-filter'); // Dropdown filter

    // Hide the entire sidebar for single-item pages
    if (urlParams.has('name') || urlParams.has('id')) {
        if (sidebar) sidebar.style.display = 'none';
        return; // Stop further processing if it's a single-item page
    }

    // Function to add campaign buttons and the "All" button
    const addCampaignButtons = (campaignButtonsContainer, campaigns) => {
        if (!campaignButtonsContainer) return;

        // Add "All" button at the top
        const allButton = document.createElement('li');
        allButton.classList.add('nav-item');
        allButton.innerHTML = `<a class="nav-link" href="#" data-filter="all">All</a>`;
        campaignButtonsContainer.appendChild(allButton);

        // Add buttons for specific campaigns
        campaigns.forEach(campaign => {
            const button = document.createElement('li');
            button.classList.add('nav-item');
            button.innerHTML = `<a class="nav-link" href="#" data-filter="${campaign.toLowerCase()}">${campaign}</a>`;
            campaignButtonsContainer.appendChild(button);
        });
    };

    // Handle Prompts Page
    if (campaignButtons1) {
        const sheetArrayPrompts = await fetchSheet('Prompts');
        const campaignColumnPrompts = 'campaign';
        const campaignsPrompts = [...new Set(sheetArrayPrompts.map(item => item[campaignColumnPrompts]?.trim()))].filter(Boolean);

        // Add buttons to Prompts campaign container
        addCampaignButtons(campaignButtons1, campaignsPrompts);
    }

    // Handle Masterlist Page
    if (campaignButtons2) {
        const sheetArrayMasterlist = await fetchSheet('Masterlist');
        const campaignColumnMasterlist = 'campaign';
        const campaignsMasterlist = [...new Set(sheetArrayMasterlist.map(item => item[campaignColumnMasterlist]?.trim()))].filter(Boolean);

        // Add buttons to Masterlist campaign container
        addCampaignButtons(campaignButtons2, campaignsMasterlist);
    }

    // Add filter functionality
    const allSidebars = [campaignButtons1, campaignButtons2];
    allSidebars.forEach(sidebarElement => {
        if (!sidebarElement) return; // Skip if the sidebar element is not present
        sidebarElement.addEventListener('click', event => {
            event.preventDefault();
            const filter = event.target.getAttribute('data-filter');
            if (filter) {
                // Update the search input based on the clicked filter (campaign or 'all')
                searchInput.value = filter === 'all' ? '' : filter;

                // Change the dropdown value to 'Campaign' whenever a campaign button is clicked
                if (searchColumnSelect) {
                    searchColumnSelect.value = 'campaign'; // Set the dropdown to "Campaign"
                    console.log('Dropdown value updated to "Campaign"'); // Debugging line
                }

                // Trigger the keyup event so the search will be applied with the new filter (Campaign column)
                searchInput.dispatchEvent(new Event('keyup'));
            }
        });
    });
});






  
  
  
const sheetIDD = "1lR8-Zd9bXT1nASnb_H9dx3MDzU9NtjvcFGWPrRwS8m4";
  



async function renderCharacterDetails(character) {
    const characterImageContainer = document.querySelector(".mx-auto.w-100.text-center img");
    const buttonsContainer = document.createElement("div");
    buttonsContainer.className = "mt-3 d-flex justify-content-center";
    const normalSpriteButton = document.createElement("button");
    const altSpriteButton = document.createElement("button");

    // Initialize buttons
    normalSpriteButton.className = "btn btn-primary mx-2";
    normalSpriteButton.textContent = "Normal Sprite";
    altSpriteButton.className = "btn btn-secondary mx-2";
    altSpriteButton.textContent = "Alt Sprite";

    // Set default image to normal
    let isAltDisplayed = false;

    // Add event listeners
    normalSpriteButton.addEventListener("click", () => {
        if (characterImageContainer && character.image) {
            characterImageContainer.src = character.image;
            isAltDisplayed = false;
            updateButtonStates();
        }
    });

    altSpriteButton.addEventListener("click", () => {
        if (characterImageContainer && character.altSpriteLink) {
            characterImageContainer.src = character.altSpriteLink;
            isAltDisplayed = true;
            updateButtonStates();
        }
    });

    // Update button states
    function updateButtonStates() {
        normalSpriteButton.disabled = !isAltDisplayed;
        altSpriteButton.disabled = isAltDisplayed;
    }

    // Check if AltSpriteLink exists
    if (character.altSpriteLink) {
        // Append buttons to container
        buttonsContainer.appendChild(normalSpriteButton);
        buttonsContainer.appendChild(altSpriteButton);

        // Insert buttons below the character image
        const imageParent = characterImageContainer.parentElement;
        if (imageParent) {
            imageParent.appendChild(buttonsContainer);
        }
    }
}














/* ==================================================================== */
/* Softload pages
======================================================================= */
$(window).on('pageshow',function(){loadPage()});
