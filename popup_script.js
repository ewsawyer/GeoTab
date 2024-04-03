const button = document.getElementById("btn-close");
button.addEventListener("click", () => {
	window.close();
})

const locationOutput = document.getElementById("location");

const saveButton = document.getElementById('saveButton');

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
            const locationKey = `${latitude.toFixed(2)},${longitude.toFixed(2)}`; // Simplify coords
            saveUrlForLocation(locationKey, url);
        }, function(error) {
            console.error(error);
        });
    } else {
        console.log("Geolocation is not supported by this browser.");
    }
});

const openTabsButton = document.getElementById("openTabsButton");

openTabsButton.addEventListener("click", function() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const { latitude, longitude } = position.coords;
            const locationKey = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
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
        if (!locations[locationKey]) {
            locations[locationKey] = [];
        }
        locations[locationKey].push(url);

        chrome.storage.local.set({locations}, function() {
            console.log(`URL saved for location ${locationKey}:`, url);
            document.getElementById('urlInput').value = ''; 
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
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const { latitude, longitude } = position.coords;
            const userLocationKey = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
            
            chrome.storage.local.get({ locations: {} }, function(result) {
                const locations = result.locations;
                savedTabsContainer.innerHTML = '';
                
                Object.keys(locations).forEach(locationKey => {
                    if (locationKey === userLocationKey) {
                        const savedUrls = locations[locationKey];
                        const locationElement = document.createElement('div');
                        locationElement.textContent = `Location: ${locationKey}`;
                        const urlsList = document.createElement('ul');
                        
                        savedUrls.forEach(url => {
                            const urlItem = document.createElement('li');
                            const link = document.createElement('a');
                            link.href = url;
                            link.target = "_blank";
                            link.textContent = url;
                            urlItem.appendChild(link);
                            
                            urlsList.appendChild(urlItem);
                        });
                        
                        locationElement.appendChild(urlsList);
                        savedTabsContainer.appendChild(locationElement);
                    }
                });
            });
        }, function(error) {
            console.error(error);
        });
    } else {
        console.log("Geolocation is not supported by this browser.");
    }
});

function isValidUrl(url) {
    const urlPattern = /^(https?|ftp|file|chrome):\/\/\S+$/i;
    return urlPattern.test(url);
}

