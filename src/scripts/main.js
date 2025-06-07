"use strict";

async function makeApiCall(url, sendTo) {
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
            default:
                console.log("Invalid choice!");
        }
    } catch (error) {
        console.error(error);
        // Show notification
    }
}

function setCoords(data) {
    const CurrentLat = data.iss_position.latitude;
    const CurrentLon = data.iss_position.longitude;
    console.log(CurrentLat, CurrentLon);
    getPlaceInfo(CurrentLat, CurrentLon);
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

makeApiCall("http://api.open-notify.org/iss-now.json", "setCoords");
