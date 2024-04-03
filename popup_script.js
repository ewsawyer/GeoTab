const button = document.getElementById("btn-close");
button.addEventListener("click", () => {
    window.close();
});

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
            saveUrlForLocation(latitude, longitude, url);
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
            openLocationBasedUrls(latitude, longitude);
        }, function(error) {
            console.error(error);
        });
    } else {
        console.log("Geolocation is not supported by this browser.");
    }
});

function saveUrlForLocation(latitude, longitude, url) {
    chrome.storage.local.get({locations: []}, function(result) {
        let locations = result.locations;
        let existingLocation = locations.find(loc => isInRadius(loc.latitude, loc.longitude, latitude, longitude));
        
        if (!existingLocation) {
            existingLocation = { latitude, longitude, urls: [] };
            locations.push(existingLocation);
        }
        existingLocation.urls.push(url);

        chrome.storage.local.set({locations}, function() {
            console.log(`URL saved for location ${existingLocation.latitude.toFixed(2)}, ${existingLocation.longitude.toFixed(2)}:`, url);
            document.getElementById('urlInput').value = ''; 
        });
    });
}

function openLocationBasedUrls(latitude, longitude) {
    chrome.storage.local.get({locations: []}, function(result) {
        const locations = result.locations;
        const userLocation = { latitude, longitude };
        const nearbyUrls = [];

        if (Array.isArray(locations)) {
            locations.forEach(location => {
                if (isInRadius(location.latitude, location.longitude, userLocation.latitude, userLocation.longitude)) {
                    nearbyUrls.push(...location.urls);
                }
            });
        }

        if (nearbyUrls.length > 0) {
            nearbyUrls.forEach(url => {
                chrome.tabs.create({url});
            });
        } else {
            console.log("No URLs saved for nearby locations.");
        }
    });
}

function removeUrlFromLocation(latitude, longitude, urlToRemove) {
    chrome.storage.local.get({locations: []}, function(result) {
        let locations = result.locations;
        let existingLocation = locations.find(loc => isInRadius(loc.latitude, loc.longitude, latitude, longitude));
        
        if (existingLocation) {
            existingLocation.urls = existingLocation.urls.filter(url => url !== urlToRemove);

            chrome.storage.local.set({locations}, function() {
                console.log(`URL removed from location ${existingLocation.latitude.toFixed(2)}, ${existingLocation.longitude.toFixed(2)}:`, urlToRemove);
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
            
            chrome.storage.local.get({ locations: [] }, function(result) {
                const locations = result.locations;
                savedTabsContainer.innerHTML = '';
                
                if (Array.isArray(locations)) {
                    locations.forEach(location => {
                        if (isInRadius(location.latitude, location.longitude, latitude, longitude)) {
                            const locationElement = document.createElement('div');
                            locationElement.textContent = `Location: ${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`;
                            const urlsList = document.createElement('ul');
                            
                            location.urls.forEach(url => {
                                const urlItem = document.createElement('li');
                                const link = document.createElement('a');
                                link.href = url;
                                link.target = "_blank";
                                link.textContent = url;
                                urlItem.appendChild(link);
                                
                                const deleteButton = document.createElement('button');
                                deleteButton.textContent = 'Delete';
                                deleteButton.addEventListener('click', function() {
                                    removeUrlFromLocation(location.latitude, location.longitude, url);
                                });
                                urlItem.appendChild(deleteButton);
                                
                                urlsList.appendChild(urlItem);
                            });
                            
                            locationElement.appendChild(urlsList);
                            savedTabsContainer.appendChild(locationElement);
                        }
                    });
                }
            });
        }, function(error) {
            console.error(error);
        });
    } else {
        console.log("Geolocation is not supported by this browser.");
    }
});

function isInRadius(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const radiusInMeters = 50 * 0.3048; // Convert 50 feet to meters
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c * 1000; // Distance in meters
    return distance <= radiusInMeters;
}

function toRadians(degrees) {
    return degrees * Math.PI / 180;
}

function isValidUrl(url) {
    const urlPattern = /^(https?|ftp|file|chrome):\/\/\S+$/i;
    return urlPattern.test(url);
}
