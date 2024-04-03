const button = document.getElementById("btn-close");
button.addEventListener("click", () => {
	window.close();
})

const locationOutput = document.getElementById("location");

const btnGetLocation = document.getElementById("btn-get-location");
btnGetLocation.addEventListener("click", () => {
	navigator.permissions.query({name: "geolocation"}).then(result => {
		locationOutput.textContent = result.state;
	})
	
	navigator.geolocation.getCurrentPosition(
		loc => locationOutput.innerHTML = loc.coords.latitude + " " + loc.coords.longitude,
		error => locationOutput.textContent = error.message,
		{enableHighAccuracy: true}
	)
})

document.getElementById('saveButton').addEventListener('click', function() {
    const url = document.getElementById('urlInput').value;
    if (!url) {
        console.log('URL is required');
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

function saveUrlForLocation(locationKey, url) {
    chrome.storage.local.get({locations: {}}, function(result) {
        const locations = result.locations;
        if (!locations[locationKey]) {
            locations[locationKey] = [];
        }
        locations[locationKey].push(url);

        chrome.storage.local.set({locations}, function() {
            console.log(`URL saved for location ${locationKey}:`, url);
            document.getElementById('urlInput').value = ''; // Clear input
        });
    });
}

if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(function(position) {
        const { latitude, longitude } = position.coords;
        const locationKey = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
        openLocationBasedUrls(locationKey);
    }, function(error) {
        console.error(error);
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
