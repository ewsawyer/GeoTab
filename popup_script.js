const button = document.getElementById("btn-close");
button.addEventListener("click", () => {
	window.close();
})

const locationOutput = document.getElementById("location");

const getLocationBtn = document.getElementById("btn-get-location");

const saveButton = document.getElementById('saveButton');
const doneSaving = document.getElementById('doneSaving');
const addTabsBtn = document.getElementById('btn-add-tabs');

getLocationBtn.addEventListener("click", () => {
    navigator.geolocation.getCurrentPosition(function(position) {
        const { latitude, longitude } = position.coords;
        const coordinates = latitude.toFixed(3) + " " + longitude.toFixed(3)
        locationOutput.innerHTML = coordinates;
        document.getElementById('openTabsButton').innerHTML = "Open Tabs for " + coordinates;
        const locationKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;

        chrome.storage.local.get({names: {}}, function(result) {
            const names = result.names;
            if (!names[locationKey]) {
                const nameButton = document.getElementById('naming-location');
                nameButton.style.display = 'block';
                document.getElementById('nameLocation').addEventListener("click", () => {
                    nameButton.style.display = 'none';
                    document.getElementById('save-name').style.display = 'block';
                    document.getElementById('saveName').addEventListener("click", () => {
                        const nameInput = document.getElementById('nameInput');
                        const name = nameInput.value.trim();
                        console.log(name);
                        names[locationKey] = name;
                        locationOutput.innerHTML = name + " (" + coordinates + ")";
                        document.getElementById('openTabsButton').innerHTML = "Open Tabs for " + name;

                        chrome.storage.local.set({names}, function() {
                            document.getElementById('nameInput').value = '';
                            document.getElementById('naming-location').style.display = 'none';
                            document.getElementById('save-name').style.display = 'none';
                        });
                    });
                });
            }
            else {
                locationOutput.innerHTML = names[locationKey] + " (" + latitude.toFixed(3) + " " + longitude.toFixed(3) + ")";
                document.getElementById('openTabsButton').innerHTML = "Open Tabs for " + names[locationKey];
            }
        });

        console.log(locationKey);
    }, function(error) {
        console.error(error);
    });
    document.getElementById('open').style.display = 'block';
	
});

addTabsBtn.addEventListener("click", () => {
	const searchField = document.getElementById('search-field');
    searchField.style.display = 'block';
    console.log(searchField);
});


saveButton.addEventListener('click', function() {
    const urlInput = document.getElementById('urlInput');
    const url = urlInput.value.trim();
    
    const existingErrorMessage = document.querySelector('.error-message');
    if (existingErrorMessage) {
        existingErrorMessage.remove();
    }
    
    if (!url) {
        const errorMessage = document.createElement('p');
        errorMessage.textContent = 'No URL entered.';
        errorMessage.classList.add('error-message');
        errorMessage.style.color = 'red';
        urlInput.parentNode.insertBefore(errorMessage, urlInput.nextSibling);
        return;
    }
    if (!isValidUrl(url)) {
        const errorMessage = document.createElement('p');
        errorMessage.textContent = 'Invalid URL. Please enter a valid URL.';
        errorMessage.classList.add('error-message');
        errorMessage.style.color = 'red';
        urlInput.parentNode.insertBefore(errorMessage, urlInput.nextSibling);
        return;
    }
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const { latitude, longitude } = position.coords;
            const locationKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`; // Simplify coords
            saveUrlForLocation(locationKey, url);
        }, function(error) {
            console.error(error);
        });
    } else {
        console.log("Geolocation is not supported by this browser.");
    }
});

doneSaving.addEventListener("click", () => {
	const searchField = document.getElementById('search-field');
    searchField.style.display = 'none';
    const existingErrorMessage = document.querySelector('.error-message');
    if (existingErrorMessage) {
        existingErrorMessage.remove();
    }
    document.getElementById('urlInput').value = ''; 
});

const openTabsButton = document.getElementById("openTabsButton");

openTabsButton.addEventListener("click", function() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const { latitude, longitude } = position.coords;
            const locationKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
            openLocationBasedUrls(locationKey);
        }, function(error) {
            console.error(error);
        });
    } else {
        console.log("Geolocation is not supported by this browser.");
    }
});

function saveUrlForLocation(locationKey, url) {
    chrome.storage.local.get({locations: {}}, function(result) {
        const locations = result.locations;
        console.log(locations[locationKey]);

        chrome.storage.local.get({names: {}}, function(result) {
            const names = result.names;
            if (!names[locationKey]) {
                if (!locations[locationKey]) {
                    locations[locationKey] = [];
                }
                locations[locationKey].push(url);
            }
            else {
                if (!locations[names[locationKey]]) {
                    locations[names[locationKey]] = [];
                }
                locations[names[locationKey]].push(url);
            }
            chrome.storage.local.set({locations}, function() {
                console.log(`URL saved for location ${names[locationKey] ? names[locationKey] : locationKey}:`, url);
                document.getElementById('urlInput').value = ''; 
            });
        });
    });
}

function openLocationBasedUrls(locationKey) {
    chrome.storage.local.get({locations: {}}, function(result) {
        const urls = result.locations[locationKey];
        if (urls) {
            urls.forEach(url => {
                chrome.tabs.create({url});
            });
        } else {
            console.log("No URLs saved for this location.");
        }
    });
}

function removeUrlFromLocation(locationKey, urlToRemove) {
    chrome.storage.local.get({locations: {}}, function(result) {
        const locations = result.locations;
        if (locations[locationKey]) {
            locations[locationKey] = locations[locationKey].filter(url => url !== urlToRemove);
            chrome.storage.local.set({locations}, function() {
                console.log(`URL removed from location ${locationKey}:`, urlToRemove);
                viewSavedTabsButton.click();
            });
        }
    });
}

const viewSavedTabsButton = document.getElementById("viewSavedTabsButton");
const savedTabsContainer = document.getElementById("savedTabsContainer");

viewSavedTabsButton.addEventListener("click", function() {
    chrome.storage.local.get({locations: {}}, function(result) {
        const locations = result.locations;
        savedTabsContainer.innerHTML = '';
        let locationCount = 0;
        Object.keys(locations).forEach(locationKey => {
            locationCount++;
            const savedUrls = locations[locationKey];
            const locationElement = document.createElement('div');
            locationElement.className = "border";
            locationElement.style.width = "400px";
            const urlsList = document.createElement('ul');
            const locationName = document.createElement('h3');
            urlsList.appendChild(locationName);
           
            locationName.textContent = `Location: ${locationKey}`;
            let tabCount = 0;
            savedUrls.forEach(url => {
                tabCount++;
                const urlItem = document.createElement('li');
                const link = document.createElement('a');
                link.href = url;
                link.target = "_blank";
                link.textContent = url;
                urlItem.appendChild(link);
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.addEventListener('click', function() {
                    removeUrlFromLocation(locationKey, url);
                });
                urlItem.appendChild(deleteButton);
                urlsList.appendChild(urlItem);
            });
            if (tabCount === 0) {
                const noTabs = document.createElement('h4');
                noTabs.textContent = 'No tabs currently saved...'
                urlsList.appendChild(noTabs);
            }
            locationElement.appendChild(urlsList);
            savedTabsContainer.appendChild(locationElement);
        });
        if (locationCount === 0) {
            const locationElement = document.createElement('div');
            locationElement.className = "border";
            locationElement.style.width = "400px";
            const locationName = document.createElement('h3');
            locationName.textContent = "Start saving tabs to see them here";
            locationElement.appendChild(locationName);
            savedTabsContainer.appendChild(locationElement);
        }
    });
});

function isValidUrl(url) {
    const urlPattern = /^(https?|ftp|file|chrome):\/\/\S+$/i;
    return urlPattern.test(url);
}

