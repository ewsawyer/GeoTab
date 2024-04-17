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