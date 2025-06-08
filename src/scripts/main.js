"use strict";

// Declare variables
const NotificationEl = document.getElementById("notification");
const DataContainer = document.getElementById("data-container");
const EarthImage = document.getElementById("earth");
const MapEl = document.getElementById("map");
const PosHeader = document.getElementById("pos-header");
const PosText = document.getElementById("pos-text");
const ISSHeader = document.getElementById("iss-header");
const ISSText = document.getElementById("iss-text");
const Loader = document.getElementById("loader");
const StartScreen = document.getElementById("start");
const StartBtn = document.getElementById("start-btn");
const RefreshBtn = document.getElementById("refresh-btn");
let canRefresh = true;

// Initialize map and marker
const map = L.map("map").setView([0.0, 0.0], 10);
const marker = L.marker([0.0, 0.0]).addTo(map);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>"
}).addTo(map);
// Update map and marker
function updateMap(lat, lon) {
    map.panTo([lat, lon]);
    marker.setLatLng([lat, lon]);
}

/**
 * Make API calls using the coordinates from the ISS and change what content is shown on screen
 * @param {string} url - Url for the API to fetch data from
 * @param {string} sendTo - Where to send the data
 * @param {string} extraData - Any extra data to pass on to the next function
 */
async function makeApiCall(url, sendTo, extraData) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Invalid response!");
        }
        const responseData = await response.json();
        switch (sendTo) {
            case "setCoords":
                setCoords(responseData);
                break;
            case "showPlaceInfo":
                showPlaceInfo(responseData);
                break;
            case "getAvailableImages":
                getAvailableImages(responseData, extraData);
                break;
            case "showPeopleOnISS":
                showPeopleOnISS(responseData);
                break;
            default:
                console.log("Invalid choice!");
        }
    } catch (error) {
        console.error(error);
        showNotification("An error occured, please try again later!");
    }
}

/**
 * Make API calls using the coordinates from the ISS and change what content is shown on screen
 * @param {Array} data - Response data from http://api.open-notify.org/iss-now.json
 */
function setCoords(data) {
    const CurrentLat = data.iss_position.latitude;
    const CurrentLon = data.iss_position.longitude;
    // Show loader
    DataContainer.style.display = "none";
    Loader.style.display = "block";
    // Call functions
    getPlaceInfo(CurrentLat, CurrentLon);
    makeApiCall("https://epic.gsfc.nasa.gov/api/natural", "getAvailableImages", CurrentLon);
    makeApiCall("http://api.open-notify.org/astros.json", "showPeopleOnISS");
    updateMap(CurrentLat, CurrentLon);
    // Show screen with data
    Loader.style.display = "none";
    StartScreen.style.height = 0;
    DataContainer.style.display = "grid";
    // Needed for the map to display properly
    map.invalidateSize();
}

/**
 * Get info about the location the ISS is currently over
 * @param {number} lat - Latitude to get information from
 * @param {number} lon - Longitude to get information from
 */
function getPlaceInfo(lat, lon) {
    const Url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
    makeApiCall(Url, "showPlaceInfo");
}

/**
 * Show info about the location the ISS is currently over
 * @param {Array} data - Response data from https://nominatim.openstreetmap.org/reverse
 */
function showPlaceInfo(data) {
    if (data.address !== undefined) {
        const Region = data.address.region;
        const Country = data.address.country;
        const License = data.licence;
        PosHeader.textContent = "Where is the ISS over?";
        if (data.address.region !== undefined) {
            PosText.innerText = `The ISS is currently over ${Region}, ${Country}.\n${License}`;
        } else {
            PosText.innerText = `The ISS is currently over ${Country}.\n${License}`;
        }
    } else {
        PosHeader.textContent = "The ISS is currently not over any known country!";
        PosText.textContent = "Please check back again later.";
    }
}

/**
 * Find image closest to the position of the ISS
 * @param {Array} data - Response data from https://epic.gsfc.nasa.gov/api/natural
 * @param {number} checkAgaints - Longitude to match
 */
function getAvailableImages(data, checkAgainst) {
    let currentInfo = data[0];

    // Find the image closest to the ISS position
    data.forEach(imageInfo => {
        if (Math.abs(checkAgainst - imageInfo.centroid_coordinates.lon) < Math.abs(checkAgainst - currentInfo.centroid_coordinates.lon)) {
            currentInfo = imageInfo;
        }
    });

    const relevantInfo = {
        "year": currentInfo.date.split(" ")[0].split("-")[0], // YYYY
        "month": currentInfo.date.split(" ")[0].split("-")[1], // MM
        "day": currentInfo.date.split(" ")[0].split("-")[2], // DD
        "file": currentInfo.image,
        "title": currentInfo.caption,
        "lon": currentInfo.centroid_coordinates.lon,
        "lat": currentInfo.centroid_coordinates.lat
    };
    const Url = `https://epic.gsfc.nasa.gov/archive/natural/${relevantInfo.year}/${relevantInfo.month}/${relevantInfo.day}/png/${relevantInfo.file}.png`;
    EarthImage.src = Url;
    EarthImage.alt = relevantInfo.title;
}

/**
 * Show people on the ISS on screen
 * @param {Array} data - Response data from http://api.open-notify.org/astros.json
 */
function showPeopleOnISS(data) {
    const People = data.people.filter(person => person.craft === "ISS");
    let displayText = "Current people on the ISS are:";
    People.forEach(person => {
        displayText += `\n• ${person.name}`;
    });
    ISSHeader.textContent = "ISS Astronauts";
    ISSText.innerText = displayText;
}

/**
 * Show notification on screen
 * @param {string} message - Text to display in notification
 */
function showNotification(message) {
    NotificationEl.textContent = message;
    NotificationEl.classList.remove("hidden");
    NotificationEl.classList.add("scroll-down");
    setTimeout(() => { // Hide again after 7 seconds
        NotificationEl.classList.remove("scroll-down");
        NotificationEl.classList.add("hidden");
    }, 7000);
}

/**
 * Re-fetch API data and disable refresh button for 10s
 */
function refreshData() {
    if (canRefresh) {
        RefreshBtn.disabled = true;
        canRefresh = false;
        makeApiCall("http://api.open-notify.org/iss-now.json", "setCoords");
        setTimeout(() => { // Enable the refresh button again after 10 seconds
            RefreshBtn.disabled = false;
            canRefresh = true;
        }, 10000);
    }
}

/**
 * Make initial API call and hide start button
 */
function retrieveData() {
    StartBtn.disabled = true;
    StartBtn.classList.add("hidden");
    makeApiCall("http://api.open-notify.org/iss-now.json", "setCoords");
}

// Event listeners
RefreshBtn.addEventListener('click', refreshData);
StartBtn.addEventListener('click', retrieveData);
