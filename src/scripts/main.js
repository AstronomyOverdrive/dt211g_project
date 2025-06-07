"use strict";

const NotificationEl = document.getElementById("notification");
const DataContainer = document.getElementById("data-container");
const EarthImage = document.getElementById("earth");

// Initialize map and marker
const map = L.map("map").setView([0.0, 0.0], 10);
const marker = L.marker([0.0, 0.0]).addTo(map);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; <a href='http://www.openstreetmap.org/copyright'>OpenStreetMap</a>"
}).addTo(map);

function updateMap(lat, lon) {
    map.panTo([lat, lon]);
    marker.setLatLng([lat, lon]);
}

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

function setCoords(data) {
    const CurrentLat = data.iss_position.latitude;
    const CurrentLon = data.iss_position.longitude;
    //getPlaceInfo(CurrentLat, CurrentLon);
    makeApiCall("https://epic.gsfc.nasa.gov/api/natural", "getAvailableImages", CurrentLon);
    //makeApiCall("http://api.open-notify.org/astros.json", "showPeopleOnISS");
    updateMap(CurrentLat, CurrentLon);
    DataContainer.classList.remove("hidden");
}

function getPlaceInfo(lat, lon) {
    const Url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
    makeApiCall(Url, "showPlaceInfo");
}

function showPlaceInfo(data) {
    if (data.address !== undefined) {
        const Region = data.address.region;
        const Country = data.address.country;
        const License = data.licence;
        console.log("ISS is now over", Region, "in", Country, "Licence", License);
    } else {
        console.log("The ISS is currently not over any country.");
    }
}

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

function showPeopleOnISS(data) {
    const People = data.people.filter(person => person.craft === "ISS");
    People.forEach(person => {
        console.log(person.name);
    });
}

function showNotification(message) {
    NotificationEl.textContent = message;
    NotificationEl.classList.remove("hidden");
    NotificationEl.classList.add("scroll-down");
    setTimeout(() => {
        NotificationEl.classList.remove("scroll-down");
        NotificationEl.classList.add("hidden");
    }, 7000);
}

makeApiCall("http://api.open-notify.org/iss-now.json", "setCoords");
